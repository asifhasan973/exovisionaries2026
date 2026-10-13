/** Short authored continuation. The source script did not supply a flight ending. */
export const RETURN_LINES={
  ready:'Rover parked. Data sent. Bring our two Moon explorers back to orbit!',
  ascending:'Only the upper cabin lifts off. The legs and rover stay on the Moon.',
  rendezvous:'Line up the cabins. Slow down before you dock.',
  unsafeDock:'Too fast or off-center! Brake and line up. We’re holding safely.',
  docked:'All three crew together! Leave the empty lander. Fire toward Earth.',
  burning:'Our service engine sends us home. Keep the cabin attached.',
  coast:'Three days home, sped up. Our crew still uses food and power.',
  'entry-ready':'Earth ahead! Leave the service module. Turn the heat shield forward.',
  shield:'Heat shield first! Earth’s air slows our capsule.',
  wrongShield:'That points the nose into the heat. Turn the broad shield forward.',
  'chute-ready':'We’re low and slow enough now. Open the Earth parachutes!',
  chutes:'Parachutes slow us over the ocean. Nearly home!',
  splashdown:'Splashdown! All three crew are home. Let’s see what we learned!',
  fuel:'Hold here. We need enough ascent and Earth-return fuel.',
  reserve:'Hold here. Protect food and cabin power for the whole trip.',
  assisted:'Nice alignment! Assistance is recorded. Now dock gently.',
} as const;
