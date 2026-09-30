import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, FastForward, Radio, Sparkles, Volume2 } from 'lucide-react';
import { sound } from '../audio/soundEngine';
import { useMissionStore } from '../state/missionStore';
import './cinematic.css';

export interface CinematicScene {
  eyebrow: string;
  title: string;
  lines: string[];
  actionLabel: string;
  reward?: string;
  mood?: 'briefing' | 'success' | 'warning';
  speaker?: 'Mira' | 'Kai';
}

export function MissionCinematic({ scene, onComplete, onBack }: { scene: CinematicScene; onComplete: () => void; onBack?: () => void; backLabel?: string }) {
  const reducedMotion = useMissionStore(s => s.audioSettings.reducedMotion);
  const muted = useMissionStore(s => s.audioSettings.isMuted);
  const [lineIndex, setLineIndex] = useState(0);
  const [letters, setLetters] = useState(reducedMotion ? scene.lines[0].length : 0);
  const [voicePlaying, setVoicePlaying] = useState(false);
  const [blinking, setBlinking] = useState(false);
  const line = scene.lines[lineIndex];
  const lineComplete = letters >= line.length;
  const isLast = lineIndex === scene.lines.length - 1;
  const talking = !lineComplete || voicePlaying;
  const words = useMemo(() => line.slice(0, letters), [line, letters]);
  const character = scene.speaker === 'Kai'
    ? { closed: '/story/kai-briefing.webp', open: '/story/kai-talking.webp' }
    : scene.mood === 'success'
      ? { closed: '/story/mira-talking.webp', open: '/story/mira-briefing.webp' }
      : scene.mood === 'warning'
        ? { closed: '/story/mira-briefing.webp', open: '/story/mira-talking.webp' }
        : { closed: '/story/mira-briefing.webp', open: '/story/mira-talking.webp' };

  useEffect(() => {
    if (lineComplete || reducedMotion) return;
    const timer = window.setInterval(() => setLetters(value => Math.min(line.length, value + 1)), 24);
    return () => window.clearInterval(timer);
  }, [line, lineComplete, reducedMotion]);

  useEffect(() => () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }, []);

  useEffect(() => {
    if (reducedMotion) return;
    const timer = window.setInterval(() => {
      setBlinking(true);
      window.setTimeout(() => setBlinking(false), 150);
    }, 3100);
    return () => window.clearInterval(timer);
  }, [reducedMotion]);

  useEffect(() => {
    if (scene.mood === 'success') sound.playFanfare();
  }, [scene.mood]);

  function continueStory() {
    sound.playClick(760);
    if (!lineComplete) {
      setLetters(line.length);
      return;
    }
    if (!isLast) {
      setLineIndex(index => index + 1);
      setLetters(reducedMotion ? scene.lines[lineIndex + 1].length : 0);
      return;
    }
    onComplete();
  }

  function readLine() {
    if (muted || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const voice = new SpeechSynthesisUtterance(line);
    voice.rate = .92;
    voice.pitch = scene.speaker === 'Kai' ? .88 : 1.06;
    voice.onstart = () => setVoicePlaying(true);
    voice.onend = () => setVoicePlaying(false);
    voice.onerror = () => setVoicePlaying(false);
    window.speechSynthesis.speak(voice);
  }

  return <section className={`mission-cinematic cinematic-${scene.mood || 'briefing'}`} aria-label={`${scene.speaker || 'Mira'} mission briefing`}>
    <div className="cinematic-stars" aria-hidden="true"><i/><i/><i/><i/><i/></div>
    <div className={`cinematic-character ${scene.speaker === 'Kai' ? 'is-kai' : 'is-mira'} ${talking ? 'is-talking' : ''} ${blinking ? 'is-blinking' : ''} ${scene.mood === 'success' ? 'is-celebrating' : ''} ${scene.mood === 'warning' ? 'is-warning' : ''}`} aria-hidden="true">
      <span className="character-glow" />
      <img className="character-frame character-closed" src={character.closed} alt="" />
      <img className="character-frame character-open" src={character.open} alt="" />
      {scene.speaker !== 'Kai' ? <span className="character-blink"><i/><i/></span> : null}
      {scene.mood === 'success' ? <div className="confetti"><span/><span/><span/><span/><span/><span/></div> : null}
    </div>
    <div className="cinematic-copy">
      <span className="cinematic-kicker">{scene.mood === 'success' ? <Sparkles size={18}/> : <Radio size={18}/>} {scene.eyebrow}</span>
      <h1>{scene.title}</h1>
      {scene.reward ? <span className="cinematic-reward"><Check size={18}/>{scene.reward}</span> : null}
      <div className="cinematic-dialogue">
        <div className={`speaker-pulse ${talking ? 'active' : ''}`}><span/><span/><span/></div>
        <div>
          <span className="speaker-name">{scene.speaker || 'Mira'} · {scene.speaker === 'Kai' ? 'FLIGHT CONTROL' : 'MISSION ENGINEER'}</span>
          <p aria-live="polite">{words}<i className={lineComplete ? 'done' : ''} /></p>
        </div>
        {!muted && 'speechSynthesis' in window ? <button type="button" className="cinematic-voice" onClick={readLine} aria-label="Hear this line"><Volume2 size={20}/></button> : null}
      </div>
      <div className="cinematic-actions">
        <div className="cinematic-back-slot"><button type="button" className="cinematic-back" onClick={onBack || onComplete}><ArrowLeft size={17}/>Back</button></div>
        <div className="dialogue-progress" aria-label={`Dialogue ${lineIndex + 1} of ${scene.lines.length}`}>{scene.lines.map((_, index) => <span key={index} className={index <= lineIndex ? 'active' : ''}/>)}</div>
        <button type="button" className="cinematic-skip" onClick={onComplete}><FastForward size={15}/> Skip scene</button>
        <button type="button" className="primary cinematic-next" onClick={continueStory}>{!lineComplete ? 'Show full message' : isLast ? scene.actionLabel : 'Continue'}<ArrowRight size={20}/></button>
      </div>
    </div>
  </section>;
}
