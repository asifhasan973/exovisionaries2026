import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Expand, Home, Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { MobileGameContext, MOBILE_GAME_QUERY } from './mobileGameContext.ts';
import { GameInfo } from './GameInfo.tsx';
import { SettingsButton } from './GameSettings.tsx';
import { LearningControls } from './Learning.tsx';
import './mobileGame.css';

type LockableOrientation = ScreenOrientation & { lock?: (orientation: 'landscape') => Promise<void> };

/** Fullscreen is an enhancement. Unsupported or rejected browser APIs never block play. */
export function MobileGameProvider({ children, active, voiceEnabled, onToggleVoice, onHome, onPause, onResume }: {
  children: ReactNode; active: boolean; voiceEnabled: boolean; onToggleVoice(): void; onHome(): void; onPause(): void; onResume(): void;
}) {
  const [mobile, setMobile] = useState(() => matchMedia(MOBILE_GAME_QUERY).matches);
  const [menu, setMenu] = useState(false);
  const [fullscreen, setFullscreen] = useState(!!document.fullscreenElement);
  const [screenMessage, setScreenMessage] = useState('');
  const wanted = useRef(false), ownedFullscreen = useRef(false), ownedLock = useRef(false);

  const release = useCallback(() => {
    wanted.current = false;
    if (ownedLock.current) { screen.orientation?.unlock?.(); ownedLock.current = false; }
    if (ownedFullscreen.current && document.fullscreenElement) void document.exitFullscreen?.().catch(() => {});
    ownedFullscreen.current = false;
  }, []);

  const requestScreen = useCallback(() => {
    if (!matchMedia(MOBILE_GAME_QUERY).matches) return;
    wanted.current = true;
    setScreenMessage('');
    const lock = async () => {
      if (!wanted.current) return;
      try {
        const orientation = screen.orientation as LockableOrientation | undefined;
        if (orientation?.lock) {
          await orientation.lock('landscape');
          ownedLock.current = true;
          if (!wanted.current) { orientation.unlock(); ownedLock.current = false; }
        }
      } catch {
        /* Handled gracefully */
      }
    };
    if (document.fullscreenElement) { void lock(); return; }
    if (!document.fullscreenEnabled || !document.documentElement.requestFullscreen) {
      setScreenMessage('Your game still fills this window.');
      return;
    }
    try {
      void document.documentElement.requestFullscreen().then(() => {
        ownedFullscreen.current = true;
        if (!wanted.current) { release(); return; }
        void lock();
      }).catch(() => setScreenMessage('Keep playing here, or try Fullscreen again.'));
    } catch {
      setScreenMessage('Keep playing here, or try Fullscreen again.');
    }
  }, [release]);

  const start = useCallback(() => { requestScreen(); }, [requestScreen]);
  const openMenu = useCallback(() => { onPause(); setMenu(true); }, [onPause]);
  const closeMenu = () => { setMenu(false); onResume(); };

  useEffect(() => {
    const devices = matchMedia(MOBILE_GAME_QUERY);
    const updateDevice = () => setMobile(devices.matches);
    const updateFullscreen = () => {
      setFullscreen(!!document.fullscreenElement);
      if (!document.fullscreenElement && ownedFullscreen.current) {
        ownedFullscreen.current = false;
        if (ownedLock.current) { screen.orientation?.unlock?.(); ownedLock.current = false; }
        window.dispatchEvent(new Event('game-help-open'));
      }
    };
    devices.addEventListener('change', updateDevice);
    document.addEventListener('fullscreenchange', updateFullscreen);
    return () => {
      devices.removeEventListener('change', updateDevice);
      document.removeEventListener('fullscreenchange', updateFullscreen);
      release();
    };
  }, [release]);

  useEffect(() => { if (!active || !mobile) release(); }, [active, mobile, release]);

  const mode = mobile && active;
  return <MobileGameContext.Provider value={{ mobile, active: mode, start, openMenu }}>
    {children}
    {mode ? <div className="mobile-game-tools" role="group" aria-label="Game controls">
      <button onClick={openMenu} aria-label="Pause and open game menu" title="Pause"><Pause size={19}/></button>
      <button onClick={onToggleVoice} aria-label={voiceEnabled ? 'Mute narration' : 'Enable narration'} aria-pressed={voiceEnabled} title="Voice">
        {voiceEnabled ? <Volume2 size={19}/> : <VolumeX size={19}/>}</button>
    </div> : null}
    {mode && menu ? <GameInfo title="Paused" onClose={closeMenu} pages={[
      <div className="mobile-pause-menu" key="pause">
        <button className="mobile-resume" onClick={closeMenu}><Play size={20}/>Back to game</button>
        <div className="mobile-menu-grid"><LearningControls onOpen={() => setMenu(false)}/><SettingsButton onOpen={() => setMenu(false)}/>
          <button onClick={() => { requestScreen(); }} disabled={fullscreen} aria-label={fullscreen ? 'Already fullscreen' : 'Enter fullscreen'}><Expand size={20}/><span>{fullscreen ? 'Fullscreen on' : 'Fullscreen'}</span></button>
        </div>
        {screenMessage ? <p role="status">{screenMessage}</p> : null}
        <button className="mobile-menu-home" onClick={() => { setMenu(false); release(); onHome(); }}><Home size={19}/>Mission home</button>
      </div>
    ]}/> : null}
  </MobileGameContext.Provider>;
}
