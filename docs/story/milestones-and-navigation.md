# Mission milestones and navigation

The active Moon game has eight presentation chapters. Their definitions and step membership live in `src/game/story/missionMilestones.ts`.

| Milestone | Playable scope |
| --- | --- |
| Plan | Name, destination, objective and site |
| Build | Resource introduction and explorer equipment |
| Prepare | Crew, supplies, mass, power, budget, return rehearsals and quiz |
| Rocket | Packing, launcher assembly and departure approval |
| Fly | Earth launch, transfer and lunar orbit |
| Explore | Landing, rover deployment and scouting |
| Discover | Science, evidence and surface recovery |
| Home | Crew return and debrief |

## Presentation

New missions show an overview before name entry. A compact header ring reports the current chapter's percentage and its position among the eight milestones. It replaces the workshop tabs, readiness strips, ascent stage list and return chapter list. Gameplay controls, inventory paging, power telemetry and quiz question counts remain available. Clicking the ring opens the mission overview and pauses active operations.

Crossing a chapter boundary opens a dedicated completion screen. Continue acknowledges that chapter and opens the next one at zero progress. The final Home completion opens the debrief. Acknowledged celebrations do not repeat when the player revisits a completed chapter. Pending celebrations and introduction status are optional validated fields in `StoryProgress`, saved in the existing atomic envelope. Older saves retain their current position.

`ExactStory` applies `trackMilestoneTransition` to interactive mission events. Reducer-based chapter demo construction remains independent of presentation gates. `MilestonePage` uses local vector art, existing sound effects, reduced-motion settings and the central freeze store; it adds no remote asset pipeline.

## One Back policy

`missionNavigation.ts` owns cursor movement and pauses active simulations without changing their elapsed time, resources or evidence. `StoryControls` routes its page Back button through `StoryNavigationContext`, so journey, landing, surface, science, recovery and return screens no longer open a notes/checkpoint drawer when Back is pressed. Conversation Back moves one line at a time. Screen history determines the preceding page; isolated preview routes also have an ordered fallback.

Before launch, previous preparation screens remain editable under the existing validation rules. Once launch begins, Back enters a protected review of earlier screens. The live frontier is kept in `WorkshopSession.review.anchor`, with a forward cursor stack. Review content is inert, narration does not autoplay, and the footer always provides working Back/Next controls. Next walks back to the same live frontier instead of rerunning burns, awarding science again or resetting a mission. Active operations remain paused until explicitly resumed.

During review, `savedMissionProgress` serializes the live frontier, rather than the temporary review cursor. Reload therefore restores the actual mission checkpoint. Returning home also exits review at the live frontier. Header help and settings remain accessible; notes pagination retains its own independent navigation.

## Judge preview Skip

Every playable mission page exposes a centered **Skip** button through `StoryShell`/`StoryControls`, including scenes with no normal footer. Milestone cards use Skip to continue their card; conversation pages skip the remaining dialogue. Flight uses the same centered Skip; mode/speed controls and its original flight-only shortcut remain in Flight notes. Final debrief is the end of the tour.

`judgeTour.ts` advances completed pages normally. When an activity is unfinished, it opens the next page using existing reducer-built, explicitly assisted chapter checkpoints. The rover's combined free-driving/science section skips directly to crew return. Unfinished upstream equipment may use a known valid showcase kit; sample/departure/return authorization is never bypassed by injecting success flags.

The first mission-page Skip opens a separate demo session labelled **Judge preview** and keeps the main mission in memory and its own save key. Exit returns to that main mission. Later preview checkpoints use the demo save. Shared loading blocks duplicate Skip input and freezes the old simulation during checkpoint construction; Next narration and Back review retain their existing policies.

`node --experimental-strip-types scripts/check-judge-tour.mjs` traverses both objectives from name entry through 33 visible pages to authorized crew return and a completed debrief. It verifies source-session immutability, assistance provenance, every checkpoint save roundtrip, and shuffled supply matching/restoration.

## Verification

Focused manual checks cover the Plan completion page, Build starting at 0%, Back across that boundary, and Back/Next between Moon exploration and rover deployment. The review page exposes its paused status and an inert main region; it does not open a notes dialog. TypeScript compilation and whitespace checks verify the integrated sources. Progress and save behavior are reviewed against the existing receipt and resource reducers.
