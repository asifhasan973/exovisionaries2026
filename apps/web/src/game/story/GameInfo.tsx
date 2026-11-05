import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { ReactNode } from 'react';
import './gamePolish.css';

/** Modal right drawer: focus is contained and returned to the original help button. */
export function GameInfo({ title, pages, onClose }: { title: string; pages: ReactNode[]; onClose(): void }) {
  const dialog = useRef<HTMLDialogElement>(null), headingId = useId();
  const [page, setPage] = useState(0);
  const current = Math.min(page, Math.max(0, pages.length - 1));
  useEffect(() => { const previous = document.activeElement as HTMLElement | null; const el = dialog.current; el?.showModal(); window.dispatchEvent(new Event('game-help-open'));
    return () => { el?.close(); if (previous?.isConnected) previous.focus({ preventScroll: true }); }; }, []);
  return createPortal(<dialog ref={dialog} className="game-info learning-drawer" aria-labelledby={headingId} onCancel={event => { event.preventDefault(); onClose(); }}
    onClick={event => { if (event.target === event.currentTarget) { const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose(); } }}>
    <header><h2 id={headingId}>{title}</h2><button className="conversation-icon" aria-label="Close information" autoFocus onClick={onClose}><X size={20} /></button></header>
    <section className="game-info-page">{pages[current]}</section>
    {pages.length > 1 ? <nav aria-label="Information pages"><button className="game-info-page-button" aria-label="Previous information page" disabled={!current} onClick={() => setPage(value => value - 1)}><ChevronLeft size={18} />Back</button><span>{current + 1} / {pages.length}</span><button className="game-info-page-button" aria-label="Next information page" disabled={current === pages.length - 1} onClick={() => setPage(value => value + 1)}>Next<ChevronRight size={18} /></button></nav> : null}
  </dialog>, document.body);
}
