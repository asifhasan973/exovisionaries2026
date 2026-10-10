import { useEffect, useRef, useState } from 'react';
import { Check, Radio, Zap } from 'lucide-react';
import { useGameSettings } from './gameSettingsContext.ts';
import { sound } from '../../audio/soundEngine.ts';

/** A sensor connector repair, followed by a visible height signal. */
export function RadarRepair({ connected, onConnect }: { connected: boolean; onConnect(): void }) {
  const { effects, gentle } = useGameSettings();
  const [connecting, setConnecting] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const connect = () => {
    if (connected || connecting) return;
    sound.setMuted(!effects); sound.playClick(); setConnecting(true);
    timer.current = setTimeout(() => {
      sound.setMuted(!effects); sound.playSnap(); sound.playRadioBeep(true);
      setConnecting(false); onConnect(); timer.current = null;
    }, gentle ? 300 : 950);
  };
  return <div className={`radar-repair ${connecting ? 'is-connecting' : ''} ${connected ? 'is-online' : ''}`}>
    <div className="readiness-connectors" role="group" aria-label="Repair disconnected sensor">
      <button className={connected ? 'is-connected' : 'is-unplugged'} disabled={connecting || connected} onClick={connect}>
        {connected ? <Check size={24}/> : <Zap size={24}/>}<strong>Landing radar</strong><span>{connected ? 'Online' : connecting ? 'Connecting…' : 'Tap to connect'}</span>
      </button>
      <div className="radar-healthy"><Check size={18}/>Camera</div><div className="radar-healthy"><Check size={18}/>Radio</div>
    </div>
    <div className="radar-signal" role="img" aria-label={connected ? 'Connected cable. Radar waves bounce off the ground to measure height.' : connecting ? 'Cable sliding into the sensor socket' : 'Disconnected radar cable'}>
      <svg viewBox="0 0 460 180" aria-hidden="true">
        <path d="M30 56H130" stroke="#9679b3" strokeWidth="9" fill="none"/>
        <g className="radar-plug"><rect x="128" y="39" width="35" height="34" rx="6" fill="#ffde70"/><path d="M163 47h14m-14 18h14" stroke="#ffde70" strokeWidth="5"/></g>
        <path d="M211 56h41" stroke="#9679b3" strokeWidth="9"/><rect x="194" y="37" width="19" height="38" rx="5" fill="#675574"/>
        <g className="radar-unit"><path d="M262 34h65l-14 36h-38z" fill="#d7ddeb"/><path d="M290 68v20" stroke="#d7ddeb" strokeWidth="6"/>
          {[0,1,2].map(i => <path key={i} className={`radar-wave wave-${i}`} d={`M${278-i*12} ${92+i*19}Q290 ${105+i*19} ${302+i*12} ${92+i*19}`} fill="none" stroke="#91edc8" strokeWidth="4"/>)}</g>
        <path d="M246 158l20-8 25 4 24-7 36 11 25-4 42 6" stroke="#7f7595" strokeWidth="5" fill="none"/>
        <path className="radar-height" d="M369 74v77m-5-69 5-8 5 8m-10 61 5 8 5-8" stroke="#91edc8" strokeWidth="3" fill="none"/>
        <circle className="radar-status-dot" cx="295" cy="50" r="5" fill={connected ? '#91edc8' : '#ff8d9b'}/>
      </svg>
      <span role="status"><Radio size={17}/>{connected ? 'Height signal restored!' : connecting ? 'Plugging in…' : 'No cable → no height signal'}</span>
    </div>
  </div>;
}
