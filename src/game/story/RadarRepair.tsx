import { useEffect, useRef, useState } from 'react';
import { Camera, Check, Radio, Zap } from 'lucide-react';
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
      <div className="radar-healthy"><Camera size={25}/><strong>Camera</strong><span><Check size={14}/> ONLINE</span></div><div className="radar-healthy"><Radio size={25}/><strong>Radio</strong><span><Check size={14}/> ONLINE</span></div>
    </div>
    <div className="radar-signal" role="img" aria-label={connected ? 'Connected cable. Radar waves bounce off the ground to measure height.' : connecting ? 'Cable sliding into the sensor socket' : 'Disconnected radar cable'}>
      <svg viewBox="0 0 520 250" aria-hidden="true">
        <defs><linearGradient id="radar-metal" x2="1" y2="1"><stop stopColor="#f5f6ef"/><stop offset=".55" stopColor="#8597a6"/><stop offset="1" stopColor="#e3e9e7"/></linearGradient><linearGradient id="radar-foil" x2="1" y2="1"><stop stopColor="#ffe5a0"/><stop offset=".5" stopColor="#9b6830"/><stop offset="1" stopColor="#dbb761"/></linearGradient><linearGradient id="radar-beam" x2="0" x1="0" y1="0" y2="1"><stop stopColor="#a9ffe2" stopOpacity=".48"/><stop offset="1" stopColor="#9affd1" stopOpacity="0"/></linearGradient></defs>
        <ellipse cx="307" cy="220" rx="176" ry="18" fill="#6c6385" opacity=".45"/><path d="M72 218q55-26 104-8t87-8q46-14 94 5t95-12" fill="none" stroke="#9587b0" strokeWidth="4"/>
        <g className="radar-lander"><path d="M201 89h187l-13 71H217Z" fill="url(#radar-foil)" stroke="#e9d18e" strokeWidth="4"/><path d="M230 74h130l28 25H202Z" fill="url(#radar-metal)" stroke="#f5f4e7" strokeWidth="4"/><path d="M244 77V54h71v23" fill="#9daeb7" stroke="#e9f1ed" strokeWidth="3"/><path d="M223 143 163 202m208-59 61 59" stroke="#c9d5db" strokeWidth="8"/><path d="m163 202-22 4m291-4 23 4" stroke="#e5ebec" strokeWidth="9" strokeLinecap="round"/><path d="M248 159h94" stroke="#172434" strokeWidth="12" strokeLinecap="round"/><path d="M276 160v15h38v-15" fill="#bbc9cb"/><path d="M280 176h30l-6 13h-18Z" fill="#243746" stroke="#a9bac2" strokeWidth="2"/></g>
        <path className="radar-height radar-beam" d="M290 190h18l30 23h-80Z" fill="url(#radar-beam)" stroke="none"/>
        {[0,1,2].map(i=><path key={i} className={`radar-wave wave-${i}`} d={`M${279-i*14} ${190+i*8}q20 ${13+i*3} 40 0`} fill="none" stroke="#a1f7d4" strokeWidth="3"/>)}
        <path d="M55 130h84" stroke="#6e6686" strokeWidth="9" fill="none" strokeLinecap="round"/><g className="radar-plug"><rect x="136" y="114" width="31" height="32" rx="5" fill="#ffd775" stroke="#fff0a0" strokeWidth="2"/><path d="M167 122h14m-14 16h14" stroke="#ffd775" strokeWidth="5"/></g><rect x="195" y="109" width="16" height="41" rx="5" fill="#483c5c" stroke="#b9a6cc" strokeWidth="2"/><path d="M211 130h42l22 27" fill="none" stroke="#8a83a6" strokeWidth="8"/>
        <g className="radar-altimeter"><rect x="385" y="63" width="110" height="78" rx="11" fill="#15253b" stroke="#7fa1af" strokeWidth="2"/><text x="400" y="85" fill="#b9d9e5" fontSize="11" fontWeight="700" letterSpacing="2">ALTITUDE</text><text x="399" y="119" fill={connected?'#a9ffd9':'#f5a7ac'} fontSize="31" fontWeight="800">{connected?'124':'---'}</text><text x="469" y="119" fill="#b9d9e5" fontSize="13">m</text></g>
        <circle className="radar-status-dot" cx="303" cy="169" r="5" fill={connected?'#91edc8':'#ff8d9b'}/>
      </svg>
      <span role="status"><Radio size={17}/>{connected ? 'Radar online · height measured' : connecting ? 'Connecting radar cable…' : 'Connect radar cable'}</span>
    </div>
  </div>;
}
