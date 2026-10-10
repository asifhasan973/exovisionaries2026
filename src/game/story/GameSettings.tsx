import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Settings, Volume2, Sparkles, RotateCcw } from 'lucide-react';
import { GameInfo } from './GameInfo.tsx';

import { SettingsContext } from './gameSettingsContext.ts';
function saved(key: string, fallback: boolean) { try { const value = localStorage.getItem(`ztb-${key}`); return value === null ? fallback : value === 'true'; } catch { return fallback; } }
export function GameSettingsProvider({ children, voiceEnabled, onToggleVoice, onRestart }: { children: ReactNode; voiceEnabled: boolean; onToggleVoice(): void; onRestart(): void }) {
  const [effects, setEffects] = useState(() => saved('effects', true));
  const [gentle, setGentle] = useState(() => saved('gentle', window.matchMedia('(prefers-reduced-motion: reduce)').matches));
  const [open, setOpen] = useState(false);
  useEffect(() => { try { localStorage.setItem('ztb-effects', String(effects)); localStorage.setItem('ztb-gentle', String(gentle)); } catch { /* Settings still work without storage. */ } }, [effects, gentle]);
  useEffect(() => { document.documentElement.dataset.gentleMotion = String(gentle); return () => { delete document.documentElement.dataset.gentleMotion; }; }, [gentle]);
  useEffect(() => { const show = () => setOpen(true); window.addEventListener('open-game-settings', show); return () => window.removeEventListener('open-game-settings', show); }, []);
  return <SettingsContext.Provider value={{ effects, gentle }}>{children}{open ? <GameInfo title="Game settings" onClose={() => setOpen(false)} pages={[
    <div className="game-settings-options" key="settings">
      <label><Volume2 />Character voices<input type="checkbox" checked={voiceEnabled} onChange={onToggleVoice} /></label>
      <label><Volume2 />Sound effects<input type="checkbox" checked={effects} onChange={e => setEffects(e.target.checked)} /></label>
      <label><Sparkles />Gentle motion<input type="checkbox" checked={gentle} onChange={e => setGentle(e.target.checked)} /></label>
      <button className="game-info-trigger settings-restart" onClick={() => { setOpen(false); onRestart(); }}><RotateCcw size={18} />Start a new mission</button>
    </div>
  ]} /> : null}</SettingsContext.Provider>;
}
export function SettingsButton({ onOpen }: { onOpen?: () => void } = {}) { return <button className="conversation-icon labeled-control" aria-label="Game settings" title="Game settings" onClick={() => { onOpen?.(); window.dispatchEvent(new Event('open-game-settings')); }}><Settings size={20} /><span>Settings</span></button>; }
