# Guided equipment repairs

Mission failures use a red, high-contrast alert with one primary Fix action. The recommendation is computed from the current manifest, not a hard-coded destination page.

Fix opens the correct workshop stage, category and shelf page, highlights the exact part, and immediately plays a ghost hand demonstration. It does not install equipment for the player. Hint repeats the demonstration and refocuses the correct shelf. The engineer gives a short recorded reason, using the player's selected male or female voice. Mute and reduced-motion preferences are respected.

Supported repairs:
- Thermal: Advanced protection for the permanent-shadow game requirement.
- Energy: smallest larger battery that preserves the 20% return reserve.
- Drill less: deepest shorter plan that fits the existing battery; the hand demonstrates the correct slider direction.
- Peak demand: lower-load replacements or removal of optional MSOLO, never removing mandatory instruments.
- Mass/budget: a lighter/cheaper replacement or optional-tool removal; prefer an option that fixes the limit with less loss of science potential.

Shadow protection is never downgraded by weight/budget advice. Replacing parts remains undoable and invalidates previous checks. Retest mission returns directly to mass revalidation; it does not auto-approve the mission. A partial improvement can require another repair.

Repair intent is temporary session state, separate from the existing saved manifest. Current catalogue maxima do not exceed the 350 kg and 450 W ceilings; those guidance paths also support future expanded equipment.

Manual review uses a separate localhost port. No automated test program, typecheck, lint or production build is run for this request.

Manual observations: Deep-shadow Basic thermal kit produced the red Too cold alert. Fix opened Advanced thermal protection directly, replayed the focused hand, and fitting it unlocked Retest. A 100 cm plan with a 100 Wh battery failed on the return leg; Fix opened the Medium battery on its correct page, while Drill less opened a highlighted 80 cm-or-less plan. Changing the slider reduced the displayed energy requirement from 30.9 Wh to 24.7 Wh and unlocked Retest.

The shortened 80 cm plan completed Drive/Drill/Return with 21% battery remaining. A 1,020-credit build showed the live red budget alert; Fix opened Standard solar on the correct page and replacement reduced cost to 985 credits. Browser console contained no errors in the reviewed flows.
