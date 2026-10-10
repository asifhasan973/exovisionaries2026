import { usePlayerGender } from './playerCharacter.tsx';
import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { BookOpen, Info, Lightbulb, Volume2 } from 'lucide-react';
import { GameInfo } from './GameInfo.tsx';
import { browserNarrationEnvironment, NarrationController } from './narration.ts';
import { GLOSSARY, WORD_GROUPS } from './glossary.ts';
import type { LearningTerm } from './glossary.ts';
import './gamePolish.css';
const LearningContext = createContext<((term: LearningTerm | 'all') => void) | null>(null);
function LearningPicture({ term }: { term: LearningTerm }) {
  const group = WORD_GROUPS.find(group => group.terms.includes(term))?.name;
  const coins = term === 'budget' || term === 'credits';
  return <svg className="learning-diagram" viewBox="0 0 300 130" role="img" aria-label={coins ? 'Game coins pay for spacecraft parts' : group === 'Energy' ? 'Sunlight charges a battery that powers a rover' : group === 'Moon' ? 'Sunlight on a crater rim; its deep floor stays in shadow' : group === 'Rocket' ? 'A rocket carries its explorer above Earth' : 'A rover uses tools to explore rocks'}>
    <rect width="300" height="130" rx="20" fill="#17132e" />
    {coins ? <><rect x="23" y="55" width="87" height="51" rx="12" fill="#7b478e" stroke="#bda0d0" strokeWidth="3"/>{[44,67,90].map((x,i)=><circle key={x} cx={x} cy={45-i*3} r="16" fill="#ffdf68" stroke="#b89239" strokeWidth="3"/>)}<path d="M132 65H175L163 54M175 65L163 76" fill="none" stroke="#b8f0d5" strokeWidth="4"/><path d="M211 92V46L229 25L247 46V92Z" fill="#e6e7ef"/><rect x="218" y="52" width="22" height="18" rx="4" fill="#907eaf"/></> : group === 'Energy' ? <><circle cx="45" cy="60" r="23" fill="#ffdf68"/><path d="M78 60H110M192 60H226" stroke="#b8f0d5" strokeWidth="5"/><rect x="116" y="35" width="65" height="50" rx="8" fill="#3b947f" stroke="#b8f0d5" strokeWidth="3"/><path d="M148 45L136 62H148L143 77L160 58H148Z" fill="#ffdf68"/><path d="M236 47H274V77H236Z" fill="#c6b7e6"/><circle cx="243" cy="83" r="9" fill="#94aac2"/><circle cx="267" cy="83" r="9" fill="#94aac2"/></> : group === 'Moon' ? <><circle cx="34" cy="30" r="17" fill="#ffdf68"/><path d="M53 32L138 69M49 40L111 78" stroke="#ffdf68" strokeWidth="3"/><path d="M0 106L84 64L145 79Q185 146 232 82L300 67V130H0Z" fill="#827a9d"/><path d="M146 79Q186 139 230 83Z" fill="#080d22"/><circle cx="192" cy="103" r="6" fill="#9ed8eb"/></> : group === 'Rocket' ? <><circle cx="65" cy="140" r="78" fill="#385d96"/><path d="M187 84V41L202 19L217 41V84Z" fill="#e6e7ef"/><path d="M183 89L202 111L221 89Z" fill="#ffdf68"/><rect x="193" y="50" width="18" height="15" fill="#907eaf"/><path d="M100 83Q137 36 167 37" fill="none" stroke="#c7a5ec" strokeWidth="3" strokeDasharray="5 6"/></> : <><path d="M0 107L70 94L146 105L228 87L300 103V130H0Z" fill="#6b617c"/><path d="M69 64H132V88H69Z" fill="#d8ceef"/><circle cx="81" cy="94" r="12" fill="#91a5bc"/><circle cx="121" cy="94" r="12" fill="#91a5bc"/><path d="M130 72L177 81L188 97" fill="none" stroke="#ffdf68" strokeWidth="6"/><path d="M210 87L224 67L245 82L251 103H207Z" fill="#a7a0b9"/><path d="M86 63V39H108" stroke="#bca5dc" strokeWidth="4"/></>}
  </svg>;
}
export function LearningProvider({ children }: { children: ReactNode }) {
  const [term, setTerm] = useState<LearningTerm | 'all' | null>(null);
  const [group, setGroup] = useState<string | null>(null);
  const gender = usePlayerGender();
  const [voice] = useState(() => new NarrationController(browserNarrationEnvironment()));
  useEffect(() => () => voice.stop(), [term, voice]);
  const open = (value: LearningTerm | 'all') => { setGroup(null); setTerm(value); };
  const selectedGroup = WORD_GROUPS.find(item => item.name === group);
  const entries = selectedGroup?.terms ?? [];
  const pages = term === 'all' ? selectedGroup ? Array.from({ length: Math.ceil(entries.length / 6) }, (_, page) => <div className="learning-word-grid" key={page}><button onClick={() => setGroup(null)}>← All topics</button>{entries.slice(page * 6, page * 6 + 6).map(key => <button key={key} onClick={() => setTerm(key)}><span aria-hidden="true">{GLOSSARY[key].icon}</span>{GLOSSARY[key].name}</button>)}</div>)
    : [<div className="learning-word-grid" key="topics">{WORD_GROUPS.map(item => <button key={item.name} onClick={() => setGroup(item.name)}><span>{item.icon}</span>{item.name}</button>)}</div>]
    : term ? [<div className="learning-explanation" key="explanation"><LearningPicture term={term}/><p>{GLOSSARY[term].text}</p><div className="learning-example">{GLOSSARY[term].example}</div><button className="game-info-trigger" onClick={() => voice.speak(`${GLOSSARY[term].name}. ${GLOSSARY[term].text} ${GLOSSARY[term].example}`, 'commander', `word-${term}`, gender)}><Volume2 size={18}/>Read aloud</button><button className="game-info-trigger" onClick={() => open('all')}><BookOpen size={18}/>More space words</button></div>] : [];
  return <LearningContext.Provider value={open}>{children}{term ? <GameInfo key={`${term}-${group}`} title={term === 'all' ? group ?? 'Space words' : GLOSSARY[term].name} onClose={() => setTerm(null)} pages={pages}/> : null}</LearningContext.Provider>;
}
export function Term({ term, children }: { term: LearningTerm; children?: ReactNode }) {
  const open = useContext(LearningContext);
  return <span className="learning-term">{children ?? GLOSSARY[term].name}{open ? <button type="button" className="learning-info" aria-label={`Explain ${GLOSSARY[term].name}`} title={`What is ${GLOSSARY[term].name}?`} onClick={() => open(term)}><Info size={15} /></button> : null}</span>;
}
export function LearningControls({ onOpen }: { onOpen?: () => void } = {}) {
  const open = useContext(LearningContext);
  if (!open) return null;
  return <button className="conversation-icon labeled-control" aria-label="Open space words" title="Space words" onClick={() => { onOpen?.(); open('all'); }}><BookOpen size={20} /><span>Words</span></button>;
}
export function HintButton({ disabled = false }: { disabled?: boolean }) {
  return <button type="button" className="game-hint" disabled={disabled} aria-label="Hint: show the next action" onClick={() => window.dispatchEvent(new Event('replay-game-help'))}><Lightbulb size={19}/><span>Hint</span></button>;
}
/** Only annotate prose, never text inside another button. One help icon per term. */
const WORDS: [RegExp, LearningTerm][] = [
  [/\bmission objective\b/i, 'objective'], [/\bpermanent(?:ly)? shadow(?:ed)?(?: region)?\b/i, 'shadow'], [/\bthermal protection\b/i, 'thermal'], [/\bsolar(?: array| panels)?\b/i, 'solar'], [/\bpeak(?: load| power)?\b/i, 'peak'], [/\b(?:battery|batteries)\b/i, 'battery'], [/\bpayload\b/i, 'payload'], [/\bfairing\b/i, 'fairing'], [/\bbooster\b/i, 'booster'], [/\borbit\b/i, 'orbit'], [/\bbudget\b/i, 'budget'], [/\bmass\b/i, 'mass'], [/\bcredits\b/i, 'credits'], [/\bnavigation\b/i, 'navigation'], [/\bcommunication\b/i, 'communication'], [/\bradar\b/i, 'radar'], [/\brehearsal\b/i, 'rehearsal'], [/\bNSS\b/, 'nss'], [/\bNIRVSS\b/, 'nirvss'], [/\bTRIDENT\b/, 'trident'], [/\bMSOLO\b/, 'msolo'],
];
export function LearningText({ text }: { text: string }) {
  const remaining = new Set(WORDS.map((_, index) => index));
  const pieces: ReactNode[] = []; let rest = text;
  while (rest) {
    const found = [...remaining].map(index => ({ index, match: rest.match(WORDS[index][0]) })).filter(item => item.match).sort((a, b) => a.match!.index! - b.match!.index!)[0];
    if (!found) { pieces.push(rest); break; }
    const match = found.match!; pieces.push(rest.slice(0, match.index)); pieces.push(<Term key={pieces.length} term={WORDS[found.index][1]}>{match[0]}</Term>);
    rest = rest.slice(match.index! + match[0].length); remaining.delete(found.index);
  }
  return <>{pieces}</>;
}
