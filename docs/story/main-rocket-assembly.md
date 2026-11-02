# Main rocket assembly

The preparation flow is now **Pack → Rocket → Ready → Launch**. Packing secures the three mission cargo groups. A separate `rocket-assembly` activity assembles the launch vehicle before departure approval is issued.

## Play

Eleven shuffled shelf parts surround one 3D hangar: engine cluster, main tank, stage connector, upper stage, payload mount, lunar lander, selected rover, crew capsule, two fairing halves and escape tower. Empty parts have dotted geometry and small socket markers. Mouse dragging and select-part/select-socket keyboard interaction use the same placement reducer. Installed parts remain on the shelves with removal controls.

The first engine placement receives one automatic ghost-hand demonstration. Further demonstrations require Hint. A hint follows the current selection or next missing part, explains the cover/payload ordering when necessary, and never installs anything for the player. Payload-bay zoom, camera reset and a transparent inspection view help players see small internal parts. Inspection changes appearance only; it never opens the physical cover.

Cover halves may be installed early. Installing a lander, rover or capsule while either cover is fitted produces a red, spoken “cover blocks the bay” alert. Remove cover opens both halves without discarding other work. Payload can then be loaded and the covers refitted. A wrong socket also leaves the build intact.

Quick build moves thumbnail parts from their shelves to their actual socket positions, with snap feedback at each placement. It opens an obstructing cover first and then uses the normal placement events in the correct order. It takes roughly two-thirds of a second per missing part. Stop preserves work; starting again continues from the current build. Quick build does not skip the Ready review.

`rocketAssemblyCopy.ts` supplies short recorded Commander lines for each part, blocked cargo, wrong slots, opening the bay, removal and completion. The audio catalogue uses separate male/female recordings from the existing character voices. Mechanical stage thuds, cargo snaps, cover seals and tower radio cues use `SoundEngine.playRocketFit`; global effects mute and suspension still apply. `generate-story-voices.py --ids …` records selected dialogue IDs without rebuilding the entire catalogue.

The Ready screen is a full-stage departure celebration: a safety medal, three completion checks and the completed 3D launcher. Its footer continues to the launch pad; preflight download/manifest controls have been removed. `DepartureSuccess.tsx` and `departureSuccess.css` own this presentation, while the original departure authorization remains in the mission reducer.

## Shared geometry

`launchHardware.ts` exposes `assemblyParts` while retaining the existing booster/upper-stage/fairing groups used by ascent. The builder, Ready preview and flight share these mesh factories. The crewed payload includes the capsule, lunar lander and the actual selected rover/tool assembly, fitted to the fairing envelope. Camera, cutaway transparency, animation and socket markers belong only to the workshop presentation.

The adapter includes a separate retention deck, support struts and cargo clamps. These remain fixed with the payload when the protective fairing is released. Ascent tips each fairing half about its base rim before sending it outward along a separate drift path; it does not deploy the capsule, lander or rover. Release timestamps keep the animation continuous when a player acts late in the challenge window or restores a save. This is a generic launcher sequence, not a reconstruction of the Apollo transposition and docking maneuver. See [NASA’s InSight launch sequence](https://www.jpl.nasa.gov/news/press_kits/insight/launch/mission/) for the distinction between uncovering a payload and deploying it.

Flight Back uses the shared [mission navigation policy](milestones-and-navigation.md): it pauses ascent and opens the preceding page in protected review, preserving the flight checkpoint and launched build. Next returns through the visited screens to the same ascent without restarting the countdown. Flight notes open only through Notes; the restart action remains inside that drawer.

`MainRocketViewport.tsx` creates one WebGL context for the central view and shelf thumbnail renders. Empty-part dotted outlines derive from the same source geometry. Scene setup, thumbnail generation and shader compilation register with the shared loading shield. No remote models or new image assets are required. WebGL failure leaves labelled, keyboard-accessible socket controls available.

## State, gates and migration

`rocketAssembly.ts` owns versioned `RocketAssemblyState`, part IDs, ordering hints and the pure placement/removal reducer. `HumanValidation.rocketBuild` stores installed parts and assistance. Design changes and quiz restart reset this build through the existing validation flow. New placement events are accepted only on the assembly activity after valid packing and all required checks.

Packing completion alone no longer approves departure. Only a complete current-design rocket can create the immutable manifest and unlock Ready/Launch. Save restoration recalculates completeness; partial builds resume with their fitted parts. Older preflight saves return to assembly when they lack a rocket receipt. Valid older missions already in flight receive a compatible assembled vehicle record, preserving the mission they have already launched. Chapter demos and debug previews replay the same assembly events.

Full and demo saves use the v13 envelope, with a v12 fallback. Quick build and requested assembly hints mark the departure manifest as assisted.

The launcher remains a generic, illustrative two-stage game vehicle. Dimensions, folded payload fit, unrestricted external-part order and snap tolerances are teaching-game conventions, not manufacturing procedures or a flight-certified architecture.

## Lifecycle

Manual drags cancel during an orientation block or lost focus. Quick-build elapsed time stops while loading/orientation is blocked, a dialog is open or the document is hidden. Part snap animation preserves its elapsed time across visibility and lifecycle pauses. WebGL rendering sleeps when idle or frozen, uses capped pixel density, and cleans up its renderer, controls, geometries and materials on exit. Gentle/reduced motion removes part-flight animation while keeping assembly feedback and controls.
