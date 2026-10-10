# Mission experience update — 10 October 2026

- Enter activates the current enabled primary action; name submission keeps native form behavior. Repeated keys, composition, open dialogs and disabled Next do not bypass gates. Focused form controls retain their native keyboard behavior.
- Gold Hint lives beside Next, including launch controls. It replays the existing hand tutorial. Words remains in the header. Mobile navigation fits one footer row.
- Rehearsal has continuous driving/return motor feedback and a different drilling sound, with arrival, sample and completion cues. Sources stop on pause, mute, hidden tab and unmount. Effects remain independent of character voice settings.
- Radar repair takes roughly one second: plug joins socket, then height waves return. Scale remains locked until the repair completes. Healthy camera and radio are indicators, rather than competing buttons.
- Auto build replaces the design after confirmation, installs 15 parts through normal reducer events and visits all five assembly stages in roughly 12 seconds. It previews the drill plan too. Stop preserves the partial build. Hidden tabs pause the sequence; opening help/settings cancels it safely. The example uses advanced thermal protection and lighter navigation for the deep-shadow route. Checks, packing and launch are never auto-approved. The preview is editable afterward.
- Home is a separate entry scene within the existing single-screen game shell: Play now starts/resumes, Judge demo is separate, and New mission requires confirmation when progress exists. The 3D preview uses existing in-game hardware meshes; it does not require external art or network downloads. WebGL disposal, reduced motion and a fallback are included.

## Manual verification

Used a disposable localhost origin (5174); the user's 5173 saved game was not changed. No automated test, lint or build program was run.

Observed homepage rendering, Play now, name Enter submission, one-line-at-a-time Enter progression, radar Connecting → Online and scale unlocking, Drive → Drill → Return progression, auto-build completion at mass check with 15 parts, and immediate Stop retaining an unfinished editable build. Checked a phone viewport, corrected a compact CTA wrapping/footer height conflict, then restored the normal browser viewport. Browser logs showed no runtime errors; an obsolete Three.js shadow-map warning in the new home renderer was corrected. Sound generation and cleanup were inspected in source; audible quality was not independently recorded.

Proof images: `docs/screenshots/moon-home.jpg`, `docs/screenshots/auto-build.jpg`.
