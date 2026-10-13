import { Component } from 'react';
import type { ReactNode } from 'react';
import './scenePolish.css';

type Scene = 'journey' | 'landing' | 'surface' | 'return';
/** A light, readable view when 3D is unavailable. Controls and rules stay live. */
export function SceneFallback({ scene, label, detail, position = .5 }: {
  scene: Scene; label: string; detail?: string; position?: number;
}) {
  const surface = scene === 'surface' || scene === 'landing';
  const x = 130 + Math.max(0, Math.min(1, position)) * 400;
  return <div className="moon-flat-view" role="img" aria-label={`${label}. ${detail ?? ''}. 2D mission view.`}>
    <svg viewBox="0 0 660 400" aria-hidden="true">
      <rect width="660" height="400" fill="#11122b" />
      {[50,115,210,330,425,510,600].map((star,i)=><circle key={star} cx={star} cy={35+(i*43)%180} r={i%2?1:2} fill="#e8ddff" />)}
      {surface ? <><path d="M0 270L95 210L165 265L310 190L410 260L540 210L660 280V400H0Z" fill="#36314e"/><path d="M0 315Q180 280 330 323T660 310V400H0Z" fill="#80778e"/><path d="M120 320H555" stroke="#f3d16d" strokeWidth="3" strokeDasharray="8 9"/>
        <g transform="translate(105 274)"><path d="M-25 26L0-10L25 26Z" fill="#e2dfec"/><path d="M-15 22L-30 49M15 22L30 49" stroke="#e2dfec" strokeWidth="5"/><rect x="-22" y="16" width="44" height="20" fill="#c59942"/></g>
        {scene==='surface'?<g transform={`translate(${x} 290)`}><path d="M-28 0H28V23H-28Z" fill="#d5ad4d"/><path d="M-20 0V-15H18V0M0-15V-30H15" fill="none" stroke="#e4dfef" strokeWidth="5"/>{[-22,0,22].map(w=><circle key={w} cx={w} cy="26" r="9" fill="#161b2a" stroke="#c8c7d9" strokeWidth="3"/>)}</g>:<g transform={`translate(${x} ${260-position*170})`}><path d="M-22 12L0-25L22 12Z" fill="#ebe5f1"/><path d="M-20 10L-34 35M20 10L34 35" stroke="#e4dfef" strokeWidth="5"/><rect x="-22" y="10" width="44" height="20" fill="#d5ad4d"/></g>}
        <path d="M553 320V255H590V278H553" fill="#b246cc" stroke="#ffdf68" strokeWidth="4"/>
      </> : <><circle cx="90" cy="270" r="64" fill="#3874aa"/><path d="M47 237L89 223L118 259L92 290L54 280Z" fill="#78aa94"/><circle cx="570" cy="130" r="44" fill="#beb5c4"/><circle cx="558" cy="120" r="13" fill="#9690a4"/><path d="M142 240Q330 55 523 137" fill="none" stroke="#c89ce0" strokeWidth="3" strokeDasharray="8 10"/><g transform={`translate(${x} ${220-Math.sin(position*Math.PI)*85}) rotate(45)`}><path d="M-17 12L0-28L17 12Z" fill="#e8e6ef"/><rect x="-17" y="12" width="34" height="33" fill="#d0a759"/><path d="M-19 44H19" stroke="#eee7f7" strokeWidth="5"/></g></>}
    </svg>
    <div className="moon-flat-caption"><span>2D VIEW</span><strong>{label}</strong>{detail?<p>{detail}</p>:null}</div>
  </div>;
}

/** Failed lazy imports never remove the player's controls or lose the mission. */
export class SceneBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}
