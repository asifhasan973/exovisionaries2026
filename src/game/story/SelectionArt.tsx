import { useId } from 'react';

export type SelectionArtKind = 'moon' | 'mars' | 'coming-soon' | 'lunar-ice' | 'lunar-geology' | 'crater-rim' | 'permanent-shadow';

/** Lightweight illustrative mission art, not an orbital map or a surveyed landing site. */
export function SelectionArt({ kind }: { kind: SelectionArtKind }) {
  const id = useId().replace(/:/g, '');
  const paint = (name: string) => `url(#${id}-${name})`;
  const planet = kind === 'moon' || kind === 'mars';
  const shadow = kind === 'permanent-shadow';
  return <svg className={`selection-art art-${kind}`} viewBox="0 0 400 260" aria-hidden="true" focusable="false">
    <defs>
      <radialGradient id={`${id}-moon`} cx="32%" cy="25%" r="85%"><stop stopColor="#fcf0ca" /><stop offset=".5" stopColor="#c5c2bb" /><stop offset="1" stopColor="#555b77" /></radialGradient>
      <radialGradient id={`${id}-mars`} cx="30%" cy="23%" r="85%"><stop stopColor="#f6c690" /><stop offset=".58" stopColor="#bc694f" /><stop offset="1" stopColor="#643d59" /></radialGradient>
      <linearGradient id={`${id}-night`} x2="0" y2="1"><stop stopColor="#141b3a" /><stop offset="1" stopColor="#3b2850" /></linearGradient>
      <linearGradient id={`${id}-ground`} x2="0" y2="1"><stop stopColor={shadow ? '#5b5576' : '#b0b0c2'} /><stop offset="1" stopColor="#494260" /></linearGradient>
      <radialGradient id={`${id}-crater`}><stop stopColor={shadow ? '#080c21' : '#4d4968'} /><stop offset=".75" stopColor="#1a1730" /><stop offset="1" stopColor="#73718c" /></radialGradient>
      <linearGradient id={`${id}-ice`} x2=".9" y2="1"><stop stopColor="#e7fff6" /><stop offset=".48" stopColor="#7cdddc" /><stop offset="1" stopColor="#4485bd" /></linearGradient>
      <linearGradient id={`${id}-gold`} x2="1" y2="1"><stop stopColor="#fce3a6" /><stop offset="1" stopColor="#967160" /></linearGradient>
      <clipPath id={`${id}-disk`}><circle cx="200" cy="130" r="87" /></clipPath>
    </defs>
    <g fill="#e8ccff" opacity=".5"><circle cx="40" cy="39" r="1.7" /><circle cx="344" cy="48" r="1.7" /><circle cx="99" cy="189" r="1.2" /><circle cx="292" cy="220" r="1.2" /><circle cx="306" cy="22" r="1" /></g>
    {planet ? <>
      <ellipse cx="200" cy="130" rx="157" ry="51" transform="rotate(-25 200 130)" fill="none" stroke={kind === 'moon' ? '#d4acf2' : '#dc9683'} strokeWidth="1.5" strokeDasharray="4 7" opacity=".4" />
      <circle cx="200" cy="130" r="96" fill={kind === 'moon' ? '#dbb8f6' : '#bd8c9a'} opacity=".07" />
      <circle cx="200" cy="130" r="87" fill={paint(kind)} />
      <g clipPath={paint('disk')} fill={kind === 'moon' ? '#7c8086' : '#9c5848'} opacity=".4">
        <path d="M119 91Q172 47 213 75T280 134L252 169Q222 121 182 152T113 120Z" opacity=".5" />
        <ellipse cx="175" cy="97" rx="26" ry="22" /><ellipse cx="236" cy="76" rx="16" ry="12" /><ellipse cx="246" cy="155" rx="26" ry="23" />
        <ellipse cx="162" cy="166" rx="14" ry="12" /><ellipse cx="208" cy="119" rx="9" ry="8" /><ellipse cx="209" cy="192" rx="9" ry="7" />
        <circle cx="284" cy="105" r="18" /><circle cx="113" cy="151" r="13" />
      </g>
      <path d="M177 48Q273 50 285 130Q282 216 204 217Q262 164 244 100Q228 65 177 48" fill="#282443" opacity=".24" />
    </> : kind === 'coming-soon' ? <g stroke="#9d7bb7" fill="none" strokeWidth="2">
      <circle cx="200" cy="130" r="60" opacity=".35" /><ellipse cx="200" cy="130" rx="100" ry="29" transform="rotate(-27 200 130)" opacity=".3" />
      <path d="M189 124V111a11 11 0 0 1 22 0v13" /><rect x="180" y="123" width="40" height="33" rx="9" fill="#2d2046" /><circle cx="200" cy="139" r="3" fill="#bd91d1" />
    </g> : kind === 'lunar-ice' ? <>
      <ellipse cx="200" cy="220" rx="104" ry="15" fill="#080d26" opacity=".5" />
      <g fill={paint('ice')} stroke="#c4fff5" strokeWidth="2"><path d="M134 203L121 128L148 93L184 148L178 208Z" /><path d="M167 210L165 95L204 51L237 105L231 209Z" /><path d="M223 210L232 139L260 107L284 163L267 212Z" /></g>
      <g fill="none" stroke="#e4fffa" opacity=".7"><path d="M165 95L198 117L204 51M198 117L197 211M204 51L222 119L237 105M148 93L149 207M260 107L250 160L267 212" /></g>
      <circle cx="298" cy="58" r="24" fill="#79d9dc" opacity=".12" /><path d="M298 40V76M282 49L314 67M282 67L314 49" stroke="#9ae6e1" strokeWidth="3" />
    </> : kind === 'lunar-geology' ? <>
      <ellipse cx="200" cy="220" rx="105" ry="15" fill="#080d26" opacity=".5" />
      <path d="M108 191L126 146L165 126L198 150L213 215L130 221Z" fill={paint('gold')} stroke="#c5a38b" strokeWidth="2" />
      <path d="M172 137L199 94L254 112L286 162L268 215L208 223Z" fill="#8c7f88" stroke="#b4a2a4" strokeWidth="2" />
      <path d="M172 137L232 144L254 112M232 144L268 215M108 191L157 180L165 126M157 180L213 215" fill="none" stroke="#4c4564" strokeWidth="2" />
      <g transform="rotate(32 264 82)"><rect x="256" y="60" width="13" height="80" rx="4" fill="#a2b3c9" /><path d="M235 48H290V65H235Z" fill="#d4cdd4" stroke="#65738c" strokeWidth="2" /></g>
      <g fill="#f2c78c"><circle cx="83" cy="101" r="2" /><path d="M106 76v12M100 82h12" stroke="#f2c78c" strokeWidth="2" /></g>
    </> : <>
      <rect width="400" height="260" rx="18" fill={paint('night')} />
      <g fill="#cfcae8"><circle cx="66" cy="35" r="1" /><circle cx="245" cy="51" r="1" /><circle cx="336" cy="29" r="1.5" /></g>
      {!shadow ? <><circle cx="33" cy="113" r="13" fill="#fbe1a0" /><circle cx="33" cy="113" r="23" fill="#fbe1a0" opacity=".08" /></> : null}
      <path d="M0 145L76 91L134 139L212 83L282 149L343 105L400 145V260H0Z" fill="#65647f" />
      <path d="M0 169Q97 150 200 171T400 154V260H0Z" fill={paint('ground')} />
      <ellipse cx="261" cy="190" rx="131" ry="44" fill="#8d8ba1" />
      <ellipse cx="268" cy="192" rx="119" ry="33" fill={paint('crater')} />
      <path d="M159 176Q262 139 367 178" fill="none" stroke={shadow ? '#837b94' : '#d5ced1'} strokeWidth="6" opacity=".7" />
      <g fill="#a3a0b4" opacity=".65"><path d="M53 225l15-11 20 13Z" /><path d="M93 237l12-7 13 9Z" /><path d="M338 232l10-7 19 8Z" /></g>
      <g transform={shadow ? 'translate(232 178) scale(.65)' : 'translate(99 148) scale(.8)'}>
        <ellipse cx="18" cy="49" rx="40" ry="7" fill="#171328" opacity=".4" />
        <path d="M-10 26L44 26L50 40L-17 40Z" fill="#d2cfe0" stroke="#6a5e82" strokeWidth="2" />
        <rect x="-9" y="14" width="27" height="17" rx="4" fill="#f3e2b0" /><path d="M23 21H53V8H23Z" fill="#41507d" stroke="#8c97bb" strokeWidth="2" />
        <path d="M5 14V-4M5 -4H18" stroke="#bcbad1" strokeWidth="3" /><rect x="14" y="-9" width="11" height="10" rx="2" fill="#aeacc5" />
        <g fill="#24263d" stroke="#8f8ca5" strokeWidth="2"><circle cx="-10" cy="42" r="10" /><circle cx="17" cy="42" r="10" /><circle cx="44" cy="42" r="10" /></g>
      </g>
      <path d={shadow ? 'M248 214Q224 231 181 250' : 'M110 193Q121 222 55 257'} fill="none" stroke="#d3ccda" strokeWidth="2" strokeDasharray="3 9" opacity=".3" />
    </>}
  </svg>;
}
