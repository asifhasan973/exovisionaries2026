import React from 'react';
import { Search, X, RotateCcw, Terminal, Move } from 'lucide-react';
import type { DebugCategory, DebugItem, DebugRoute } from './debugConfig';

export interface DebugModalProps {
  search: string;
  setSearch(val: string): void;
  filterType: 'all' | 'page' | 'step';
  setFilterType(val: 'all' | 'page' | 'step'): void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  filteredCategories: DebugCategory[];
  activeRoute: DebugRoute | null;
  currentHash: string;
  onResetPill(): void;
  onClearDebugRoute(): void;
  onNavigate(item: DebugItem): void;
  onClose(): void;
}

export function DebugModal({
  search,
  setSearch,
  filterType,
  setFilterType,
  searchInputRef,
  filteredCategories,
  activeRoute,
  currentHash,
  onResetPill,
  onClearDebugRoute,
  onNavigate,
  onClose,
}: DebugModalProps) {
  return (
    <>
      <div className="debug-backdrop" onClick={onClose} />
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
              onClick={onResetPill}
              title="Reset floating debug pill to top center"
            >
              <Move size={11} style={{ display: 'inline', marginRight: 4 }} />
              Reset Pill
            </button>
            {currentHash && (
              <button
                className="debug-reset-btn"
                onClick={onClearDebugRoute}
                title="Clear debug hash and return to normal user progress"
              >
                <RotateCcw size={11} style={{ display: 'inline', marginRight: 4 }} />
                Exit Debug
              </button>
            )}
            <button
              className="debug-close-btn"
              onClick={onClose}
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
              placeholder="Filter pages, steps, activities (e.g. 'lander', 'liftoff', 'science')…"
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
                        onClick={() => onNavigate(item)}
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
  );
}

