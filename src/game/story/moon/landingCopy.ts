/** Short continuation lines authored for Module 5, not verbatim Final One dialogue. */
export const LANDING_LINES = {
  ready:'Two crew will land. One stays in orbit. Ready to separate?',
  separate:'Lander free! Start the braking burn.',
  braking:'Slowing down. Our landing radar is watching the ground.',
  flying:'Aim for a clear patch. Keep both speeds in green.',
  hazard:'Rocks ahead! Choose a clear patch, then continue.',
  guided:'I’ll help with thrust. You choose where we land.',
  paused:'Descent paused. Ready when you are.',
  landed:'Touchdown! Two crew on the Moon. One safe in orbit.',
  fast:'Too fast! Retry and use more thrust sooner.',
  sideways:'Too much sideways speed. Brake before touchdown.',
  terrain:'Rocky ground! Retry and choose a clear patch.',
  bounds:'Outside the landing zone! Retry and aim for a clear patch.',
  fuel:'Fuel used up! Retry with less hovering.',
  aborting:'Climbing to a safe orbit. Landing is cancelled.',
  aborted:'Abort complete. Retry from lunar orbit.',
  blocked:'Too low or too fast for this abort. Brake now!',
} as const;
