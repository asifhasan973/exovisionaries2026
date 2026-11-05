import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Compass, GripVertical } from 'lucide-react';
import { isDevelopment, getDebugCategories, parseDebugHash, type DebugItem } from './debugConfig';
import { sound } from '@exo/audio';
import { useDraggablePill } from './useDraggablePill';
import { DebugModal } from './DebugModal';
import './debugToolbar.css';

export function DebugToolbar() {
  return isDevelopment ? <DevelopmentDebugToolbar /> : null;
}

function DevelopmentDebugToolbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'page' | 'step' | 'demo'>('all');
  const [currentHash, setCurrentHash] = useState(() => window.location.hash);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const openModal = () => {
    setIsOpen(true);
    setTimeout(() => searchInputRef.current?.focus(), 50);
  };

  const {
    position,
    isDragging,
    pillRef,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    resetPillPosition,
  } = useDraggablePill(openModal);

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
    window.location.assign(item.hash);
    setIsOpen(false);
  };

  const clearDebugRoute = () => {
    try {
      sound.playClick();
    } catch {}
    window.location.assign('#');
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
            top: `${position.y}px`,
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          onClick={event => {
            if (event.detail === 0) {
              openModal();
            }
          }}
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
        <DebugModal
          search={search}
          setSearch={setSearch}
          filterType={filterType}
          setFilterType={setFilterType}
          searchInputRef={searchInputRef}
          filteredCategories={filteredCategories}
          activeRoute={activeRoute}
          currentHash={currentHash}
          onResetPill={resetPillPosition}
          onClearDebugRoute={clearDebugRoute}
          onNavigate={navigateTo}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
