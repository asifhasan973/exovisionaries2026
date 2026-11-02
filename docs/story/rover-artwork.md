# Rover cabin artwork

These are fictional game illustrations, not NASA photographs. The existing Commander character rig remains live in the cabin.

| Asset | File | Use |
| --- | --- | --- |
| Enclosed lunar cockpit | `public/story/lunar-cabin-v1.webp` | Responsive cabin backdrop |
| Seated Scientist | `public/story/crew-portraits/scientist-seated-v1.webp` | Transparent crew cutout, placed in the right seat |

Both assets were created with built-in image generation and optimized to WebP. Their decoded image tasks register with shared loading before the cabin is shown. No new runtime image service is required.

## Final prompts

**Scientist:** Create one transparent-background seated young South Asian male astronaut scientist. Preserve the existing Astrobiologist portrait's curly dark hair, light stubble, warm brown skin and friendly face. Match the existing Commander atlas's polished stylized 3D illustration, blue jumpsuit and boots. Show the complete seated person with bent knees and a dark tablet in his lap, three-quarter front view slightly toward the left. Use teal collar trim, neutral cabin lighting, no chair, backdrop, helmet, writing or insignia. A final background-removal pass preserves the character and removes backdrop/glow pixels, with transparent alpha outside the silhouette.

**Cabin:** Create a wide 16:9 enclosed compact lunar lander cockpit, looking toward two crew positions, without people. Use polished stylized 3D rendering, metal/padded walls, overhead structural ribs, equipment lockers, routed cables, restrained amber/teal indicators and recessed lighting. Include a side pressure hatch, two ergonomic seat backs at the left/right thirds, and two small thick-rimmed windows showing black space and a low lunar horizon. Perspective floor panels and side instruments establish depth. Leave the bottom 22% dark and simple for a separate foreground console. Navy, cool gray aluminum and soft warm highlights; no text, logos, UI or watermarks.
