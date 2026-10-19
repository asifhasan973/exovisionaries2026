import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Compass, Search, X, RotateCcw, Terminal, GripVertical, Move } from 'lucide-react';
import { isDevelopment, getDebugCategories, parseDebugHash, type DebugItem } from './debugConfig';
import { sound } from '../audio/soundEngine';
import './debugToolbar.css';

const PILL_POS_STORAGE_KEY = 'zero_to_beyond_debug_pill_pos';

interface PillPosition {
  x: number;
  y: number;
  dockSide?: 'left' | 'right' | 'top' | 'bottom';
}

function getDefaultPosition(): PillPosition {
  if (typeof window === 'undefined') return { x: 20, y: 16 };
  const padding = 14;
  const pillApproxWidth = 175;
  return {
    x: Math.max(padding, window.innerWidth - pillApproxWidth - padding),
    y: 16,
    dockSide: 'right'
  };
}

function loadSavedPosition(): PillPosition {
  if (typeof window === 'undefined') return getDefaultPosition();
  try {
    const raw = localStorage.getItem(PILL_POS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
        const padding = 10;
        const pillWidth = 175;
        const pillHeight = 36;
        const maxX = Math.max(padding, window.innerWidth - pillWidth - padding);
        const maxY = Math.max(padding, window.innerHeight - pillHeight - padding);
        return {
          x: Math.max(padding, Math.min(maxX, parsed.x)),
          y: Math.max(padding, Math.min(maxY, parsed.y)),
          dockSide: parsed.dockSide
        };
      }
    }
  } catch {}
  return getDefaultPosition();
}

export function DebugToolbar() {
  if (!isDevelopment) return null;

  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'page' | 'step' | 'demo'>('all');
  const [currentHash, setCurrentHash] = useState(() => window.location.hash);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Draggable position state
  const [position, setPosition] = useState<PillPosition>(loadSavedPosition);
  const [isDragging, setIsDragging] = useState(false);
  const pillRef = useRef<HTMLButtonElement | null>(null);

  const dragSessionRef = useRef<{
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
    moved: boolean;
  } | null>(null);

  // Sync hash state
  useEffect(() => {
    const handleHashChange = () => {
      setCurrentHash(window.location.hash);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Global hotkey: ~ (backquote/tilde) to toggle, Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName);
      if (e.key === '`' || e.key === '~') {
        if (!isInput || e.target === searchInputRef.current) {
          e.preventDefault();
          setIsOpen(prev => {
            const next = !prev;
            if (next) {
              setTimeout(() => searchInputRef.current?.focus(), 50);
            }
            return next;
          });
        }
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Keep pill clamped within screen bounds on window resize
  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => {
        const pillWidth = pillRef.current?.offsetWidth || 175;
        const pillHeight = pillRef.current?.offsetHeight || 36;
        const padding = 10;
        const maxX = Math.max(padding, window.innerWidth - pillWidth - padding);
        const maxY = Math.max(padding, window.innerHeight - pillHeight - padding);
        return {
          ...prev,
          x: Math.max(padding, Math.min(maxX, prev.x)),
          y: Math.max(padding, Math.min(maxY, prev.y))
        };
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Pointer dragging handlers
  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return; // Left click / primary touch only
    e.currentTarget.setPointerCapture(e.pointerId);
    dragSessionRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y,
      moved: false
    };
  }, [position.x, position.y]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    const session = dragSessionRef.current;
    if (!session) return;

    const dx = e.clientX - session.startX;
    const dy = e.clientY - session.startY;

    if (!session.moved && Math.hypot(dx, dy) > 5) {
      session.moved = true;
      setIsDragging(true);
    }

    if (session.moved) {
      const pillWidth = pillRef.current?.offsetWidth || 175;
      const pillHeight = pillRef.current?.offsetHeight || 36;
      const padding = 8;
      const maxX = Math.max(padding, window.innerWidth - pillWidth - padding);
      const maxY = Math.max(padding, window.innerHeight - pillHeight - padding);

      const nextX = Math.max(padding, Math.min(maxX, session.initialX + dx));
      const nextY = Math.max(padding, Math.min(maxY, session.initialY + dy));
      setPosition({ x: nextX, y: nextY });
    }
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    const session = dragSessionRef.current;
    if (!session) return;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    if (session.moved) {
      // Finished dragging: perform smart docking to nearest edge if close
      const pillWidth = pillRef.current?.offsetWidth || 175;
      const pillHeight = pillRef.current?.offsetHeight || 36;
      const padding = 12;
      const snapThreshold = 45;

      let finalX = position.x;
      let finalY = position.y;
      let dockSide: PillPosition['dockSide'];

      // Edge snapping
      if (finalX < snapThreshold + padding) {
        finalX = padding;
        dockSide = 'left';
      } else if (finalX > window.innerWidth - pillWidth - padding - snapThreshold) {
        finalX = window.innerWidth - pillWidth - padding;
        dockSide = 'right';
      }

      if (finalY < snapThreshold + padding) {
        finalY = padding;
        if (!dockSide) dockSide = 'top';
      } else if (finalY > window.innerHeight - pillHeight - padding - snapThreshold) {
        finalY = window.innerHeight - pillHeight - padding;
        if (!dockSide) dockSide = 'bottom';
      }

      const updatedPos: PillPosition = { x: finalX, y: finalY, dockSide };
      setPosition(updatedPos);
      try {
        localStorage.setItem(PILL_POS_STORAGE_KEY, JSON.stringify(updatedPos));
      } catch {}
      try {
        navigator.vibrate?.(10);
      } catch {}
    } else {
      // Pure click / tap: open navigator drawer
      try {
        sound.playClick();
      } catch {}
      setIsOpen(true);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }

    dragSessionRef.current = null;
    setIsDragging(false);
  }, [position.x, position.y]);

  const resetPillPosition = () => {
    try {
      sound.playClick();
    } catch {}
    const defaultPos = getDefaultPosition();
    setPosition(defaultPos);
    try {
      localStorage.setItem(PILL_POS_STORAGE_KEY, JSON.stringify(defaultPos));
    } catch {}
  };

  const activeRoute = useMemo(() => parseDebugHash(currentHash), [currentHash]);
  const categories = useMemo(() => getDebugCategories(), []);

  // Filter items according to search text and filter pill
  const filteredCategories = useMemo(() => {
    const query = search.trim().toLowerCase();
    return categories
      .map(cat => {
        const items = cat.items.filter(item => {
          if (filterType !== 'all' && item.type !== filterType) return false;
          if (!query) return true;
          return (
            item.label.toLowerCase().includes(query) ||
            item.id.toLowerCase().includes(query) ||
            (item.description && item.description.toLowerCase().includes(query)) ||
            item.hash.toLowerCase().includes(query)
          );
        });
        return { ...cat, items };
      })
      .filter(cat => cat.items.length > 0);
  }, [categories, search, filterType]);

  const navigateTo = (item: DebugItem) => {
    try {
      sound.playClick();
    } catch {}
    window.location.hash = item.hash;
    setIsOpen(false);
  };

  const clearDebugRoute = () => {
    try {
      sound.playClick();
    } catch {}
    window.location.hash = '';
    setCurrentHash('');
    setIsOpen(false);
  };

  return (
    <div className="debug-toolbar-container" aria-label="Development Debug Navigator">
      {/* Floating draggable & dockable launcher badge */}
      {!isOpen && (
        <button
          ref={pillRef}
          className={`debug-launcher-btn ${isDragging ? 'is-dragging' : ''} ${
            position.dockSide ? `is-docked-${position.dockSide}` : ''
          }`}
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={() => { dragSessionRef.current = null; setIsDragging(false); }}
          onClick={event => { if (event.detail === 0) { setIsOpen(true); setTimeout(() => searchInputRef.current?.focus(), 50); } }}
          title="Drag to dock anywhere on screen • Click or press ~ to open navigator"
        >
          <span className="debug-grip-handle" title="Drag handle">
            <GripVertical size={13} />
          </span>
          <span className="debug-launcher-icon">
            <Compass size={14} />
          </span>
          <span>DEBUG</span>
          {activeRoute ? (
            <span className="debug-active-pill" title={`Active: ${activeRoute.id}`}>
              {activeRoute.id}
            </span>
          ) : null}
          <span className="debug-launcher-hotkey">~</span>
        </button>
      )}

      {/* Drawer backdrop & centered modal */}
      {isOpen && (
        <>
          <div className="debug-backdrop" onClick={() => setIsOpen(false)} />
          <div
            className="debug-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="debug-header-title"
          >
            {/* Header */}
            <div className="debug-drawer-header">
              <div className="debug-header-title-row">
                <Terminal size={16} color="#8ce2c2" />
                <h3 id="debug-header-title" className="debug-header-title">
                  Debug Navigation
                </h3>
                <span className="debug-env-badge">ENV: dev</span>
              </div>
              <div className="debug-header-actions">
                <button
                  className="debug-reset-btn"
                  onClick={resetPillPosition}
                  title="Reset floating debug pill to top-right corner"
                >
                  <Move size={11} style={{ display: 'inline', marginRight: 4 }} />
                  Reset Pill
                </button>
                {currentHash && (
                  <button
                    className="debug-reset-btn"
                    onClick={clearDebugRoute}
                    title="Clear debug hash and return to normal user progress"
                  >
                    <RotateCcw size={11} style={{ display: 'inline', marginRight: 4 }} />
                    Exit Debug
                  </button>
                )}
                <button
                  className="debug-close-btn"
                  onClick={() => setIsOpen(false)}
                  title="Close (~ or Esc)"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Search & Filter pills */}
            <div className="debug-search-bar">
              <div className="debug-search-input-wrap">
                <Search size={14} />
                <input
                  ref={searchInputRef}
                  type="text"
                  className="debug-search-input"
                  placeholder="Filter pages, steps, activities, demos (e.g. 'lander', 'liftoff', 'science')…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <div className="debug-filter-pills">
                <button
                  className={`debug-filter-pill ${filterType === 'all' ? 'is-active' : ''}`}
                  onClick={() => setFilterType('all')}
                >
                  All Endpoints
                </button>
                <button
                  className={`debug-filter-pill ${filterType === 'page' ? 'is-active' : ''}`}
                  onClick={() => setFilterType('page')}
                >
                  Pages
                </button>
                <button
                  className={`debug-filter-pill ${filterType === 'step' ? 'is-active' : ''}`}
                  onClick={() => setFilterType('step')}
                >
                  Story Steps
                </button>
                <button
                  className={`debug-filter-pill ${filterType === 'demo' ? 'is-active' : ''}`}
                  onClick={() => setFilterType('demo')}
                >
                  Demo Chapters
                </button>
              </div>
            </div>

            {/* List */}
            <div className="debug-drawer-content">
              {filteredCategories.length === 0 ? (
                <div className="debug-empty-search">
                  No matching debug endpoints found for "{search}".
                </div>
              ) : (
                filteredCategories.map(cat => (
                  <div key={cat.title} className="debug-category-section">
                    <div className="debug-category-header">
                      <span>{cat.title}</span>
                      <span className="debug-category-count">{cat.items.length} targets</span>
                    </div>
                    <div className="debug-items-grid">
                      {cat.items.map(item => {
                        const isActive =
                          activeRoute?.id === item.id && activeRoute?.type === item.type;
                        return (
                          <div
                            key={item.hash}
                            className={`debug-item-card ${isActive ? 'is-active' : ''}`}
                            onClick={() => navigateTo(item)}
                            title={`Navigate to ${item.label} (${item.hash})`}
                          >
                            <div className="debug-item-info">
                              <span className="debug-item-label">{item.label}</span>
                              {item.description && (
                                <span className="debug-item-desc">{item.description}</span>
                              )}
                              <span className="debug-item-hash">{item.hash}</span>
                            </div>
                            {item.badge && <span className="debug-item-badge">{item.badge}</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
