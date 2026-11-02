# Lunar landing game

## Design review and implementation plan

The previous screen separated a text-heavy control panel from a small flight view. Guided flight removed most player decisions; manual flight exposed raw throttle and tilt without enough feedback. Camera jumps, oversized labels and static dust made the final approach difficult to read.

The replacement uses one medium-difficulty landing game:

1. Show a full-width lunar landscape, a clearly lit lander and compact height, velocity and fuel instruments. Keep explanations in optional help.
2. Play a short separation and approach sequence, then pause on the first terrain scan. The player chooses one of two clear patches directly over the landscape; the rocky original target remains visibly unsafe.
3. Use A/D or arrow keys for lateral movement and hold Space/W to brake descent. On-screen arrow buttons latch lateral movement, a crosshair stops it, and a brake button toggles slowing. This lets a mouse user steer and brake together without holding two buttons. Releasing lateral input actively damps drift; releasing the brake allows a faster descent. Stabilization helps with handling but never chooses or reaches the landing site for the player.
4. Show a target-distance indicator and a large descent-speed instrument. Warn about excessive speed near the ground. Hint pauses flight and gives advice for the current situation without taking control.
5. Use continuous camera movement, engine glow, radar pulses and ground dust to make control inputs visible. Touchdown settles the lander and shows a compact result; unsuccessful attempts provide a specific reason and an explicit checkpoint retry.
6. Preserve shared Back navigation, resource accounting, separate ascent fuel, pause/freeze behavior and deterministic save replay. Legacy landing receipts retain their original physics; new flights use version 2 and medium handling.

## Handling and scientific boundary

This is a planar learning game, not a spacecraft flight simulator. The existing lunar gravity, thrust, variable vehicle mass, fuel consumption, safe-ground boundaries and touchdown limits remain in use. Version 2 applies a feedback controller to the player's lateral direction and descent-brake input. It consumes actual modeled thrust and propellant; it cannot grant a touchdown. Cinematic approach time remains compressed while the final playable approach runs at real screen time. The terrain markings are a navigation overlay, not equipment installed on the Moon.

## Lifecycle and verification

The procedural scene is registered with the shared loading screen. Rendering and physics stop during global suspension, hidden tabs, manual pause and help. Held controls are cleared when focus is lost. GPU resources and listeners are released on unmount. Active saves restore paused; retry restores the pre-descent resource checkpoint and records assistance.

## Files

- `LandingScreen.tsx`: input handling, compact instruments, contextual help, stage/result overlays and shared story navigation.
- `LandingViewport.tsx`: procedural lunar terrain, common spacecraft meshes, navigation markers, drift arrow, interpolated camera, plume and dust. Visuals never advance physics.
- `landing.ts`: versioned fixed-step handling, collision and receipt replay.
- `landingSession.ts`: authorization, resource checkpoints and retry.
- `journeyDemo.ts`: assisted surface demo traverses the same medium landing physics with recorded control inputs.

## Verification

TypeScript compilation completed without errors. A focused desktop play-through selected patch A, moved left, braked, stopped drift, paused/resumed and achieved touchdown at 0.9 m/s down and 0.0 m/s sideways with 85% of terminal-entry fuel remaining. An earlier attempt outside the clear circle correctly required Retry. No automated test suite was run.

### Recorded landing advice

Landing advice uses the shared `landing-*` audio catalogue IDs, including `landing-controls` for the keyboard introduction. Separating/scanning lines also have recorded male and female Commander clips. This keeps the character voice consistent across the approach and avoids speech-synthesis fallback caused by unmatched dialogue IDs.
