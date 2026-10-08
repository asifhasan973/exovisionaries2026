import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { ReactNode } from 'react';

/** Extra learning material is paged, so it never expands the game stage. */
export function GameInfo({ title, pages, onClose }: { title: string; pages: ReactNode[]; onClose(): void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [page, setPage] = useState(0);
  useEffect(() => { const el = dialog.current; el?.showModal(); return () => el?.close(); }, []);
  return <dialog ref={dialog} className="game-info" aria-labelledby="game-info-title" onCancel={onClose}
    onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <header><h2 id="game-info-title">{title}</h2><button className="conversation-icon" aria-label="Close information" autoFocus onClick={onClose}><X size={20} /></button></header>
    <section className="game-info-page">{pages[page]}</section>
    {pages.length > 1 ? <nav aria-label="Information pages"><button className="conversation-icon" aria-label="Previous information page" disabled={!page} onClick={() => setPage(value => value - 1)}><ChevronLeft /></button><span>{page + 1} / {pages.length}</span><button className="conversation-icon" aria-label="Next information page" disabled={page === pages.length - 1} onClick={() => setPage(value => value + 1)}><ChevronRight /></button></nav> : null}
  </dialog>;
}
