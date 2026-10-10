import { readFileSync, writeFileSync } from 'node:fs';
import { STORY_DIALOGUE } from '../src/game/story/dialogue.ts';

// Source rectangles and feature anchors were registered against the generated atlases.
// This packages metadata only; it never alters the generated artwork.
const provenance = JSON.parse(readFileSync(new URL('../docs/story/character-assets/provenance.json', import.meta.url)));
const atlases = Object.fromEntries(provenance.files.map(f => [f.name, { file: f.name + '.webp', width: f.width, height: f.height }]));
const face = (atlas, y, height, anchor, scale, mouth, eyes, offsets, width = 380) => ({
  atlas, closed: [0, y, width, height], anchor, scale, mouth, eyes,
  columnWidth: atlases[atlas].width / 4,
  offsets: { ah: offsets[0], oo: offsets[1], blink: offsets[2] },
});
const body = (cell, neck, arm, pivot) => ({ cell, neck, arm, pivot });
const manifest = {
  version: 1, stage: { width: 600, height: 900 }, atlases,
  characters: {
    commander: {
      displayName: 'Commander', identity: 'Existing Mira identity; role follows the new script',
      bodyAtlas: 'commander-body', bodyGrid: [3, 2], bodyScale: 1.14, neckTarget: [320, 267], headOffset: [0, 10],
      poses: {
        listen: body(0, [254, 23], [[111, 214], [153, 226], [149, 269], [141, 309], [151, 354], [140, 391], [119, 381], [108, 329], [106, 283]], [130, 229]),
        explain: body(1, [248, 25], [[112, 139], [133, 151], [164, 185], [146, 229], [112, 232], [78, 209], [43, 190], [38, 165], [61, 133], [78, 137]], [143, 208]),
        point: body(2, [296, 26], [[96, 115], [146, 124], [201, 143], [180, 173], [136, 178], [74, 151], [31, 132], [23, 112], [61, 105]], [162, 151]),
        think: body(3, [247, 22], [[151, 65], [177, 35], [194, 11], [224, 8], [242, 33], [221, 57], [190, 90], [169, 126], [137, 150], [117, 136]], [147, 125]),
        ready: body(4, [242, 25], [[114, 137], [132, 107], [152, 66], [171, 60], [202, 76], [203, 100], [170, 112], [148, 164], [121, 185], [102, 169]], [123, 156]),
      },
      expressions: {
        thoughtful: face('commander-faces-a', 0, 350, [180, 330], .78, [88, 265, 96, 55], [39, 166, 179, 83], [[-7, 0], [-14, 0], [-16, -1]]),
        grateful: face('commander-faces-a', 362, 344, [180, 318], .78, [88, 251, 100, 55], [39, 152, 183, 84], [[-6, 0], [-10, 0], [-13, 0]]),
        surprised: face('commander-faces-a', 724, 338, [180, 302], .78, [88, 241, 100, 52], [39, 133, 189, 91], [[-6, 0], [-11, 0], [-14, 0]]),
        determined: face('commander-faces-b', 0, 356, [185, 337], .755, [94, 269, 96, 57], [36, 170, 193, 88], [[1, 0], [1, 0], [0, 1]]),
        encouraging: face('commander-faces-b', 362, 339, [185, 324], .755, [94, 255, 99, 57], [36, 154, 196, 88], [[1, 0], [0, 0], [0, 1]]),
        curious: face('commander-faces-b', 724, 342, [185, 307], .755, [94, 236, 98, 59], [36, 131, 195, 94], [[1, 0], [0, 0], [0, 1]]),
        confident: face('commander-faces-c', 145, 513, [254, 479], .523, [108, 371, 167, 105], [26, 231, 289, 111], [[1, 0], [-2, 0], [-2, 2]], 512),
      },
    },
    chief: {
      displayName: 'Chief', identity: 'Senior mission officer; consistent silver hair and short beard',
      bodyAtlas: 'chief-body', bodyGrid: [2, 2], bodyScale: 1, neckTarget: [350, 267], headOffset: [0, 18],
      poses: {
        greet: body(0, [381, 50], [[87, 92], [164, 86], [205, 125], [188, 195], [177, 241], [152, 264], [127, 229], [126, 199], [95, 167]], [164, 246]),
        listen: body(1, [307, 50], [[122, 293], [170, 305], [168, 365], [176, 417], [162, 450], [141, 442], [115, 403], [108, 358]], [143, 314]),
        explain: body(2, [380, 25], [[46, 185], [71, 170], [108, 189], [146, 208], [185, 227], [172, 254], [141, 257], [98, 232], [60, 219], [37, 202]], [157, 235]),
        point: body(3, [302, 25], [[75, 113], [104, 110], [131, 140], [155, 169], [153, 209], [127, 232], [92, 207], [78, 179], [69, 149]], [131, 207]),
      },
      expressions: {
        welcoming: face('chief-faces-a', 0, 374, [210, 361], .74, [105, 267, 139, 80], [67, 170, 190, 86], [[-8, 0], [-9, 0], [-11, 0]], 374),
        proud: face('chief-faces-a', 374, 354, [210, 347], .74, [105, 248, 139, 84], [67, 148, 190, 91], [[-8, 0], [-9, 0], [-11, 0]], 374),
        focused: face('chief-faces-a', 728, 358, [210, 347], .74, [105, 254, 139, 82], [67, 156, 191, 90], [[-8, 0], [-9, 0], [-11, 0]], 374),
        encouraging: face('chief-faces-b', 0, 451, [263, 437], .586, [118, 317, 173, 95], [77, 203, 238, 111], [[-5, 0], [-6, 0], [-8, -1]], 448),
        confident: face('chief-faces-b', 451, 436, [263, 430], .586, [118, 305, 173, 98], [77, 189, 238, 112], [[-5, 0], [-6, 0], [-8, -1]], 448),
      },
    },
  },
  cueBindings: Object.values(STORY_DIALOGUE).flatMap(lines => lines.flatMap(line =>
    [['speaker', line.speaker], ['listener', line.listener]].filter(([, cue]) => cue).map(([role, cue]) => ({ lineId: line.id, role, ...cue })))),
};
// Local eyelid windows exclude the outside contour and eyebrow, avoiding doubled lashes.
manifest.characters.commander.expressions.determined.eyelids = [[42, 211, 85, 48], [126, 194, 104, 58]];
manifest.characters.commander.expressions.encouraging.eyelids = [[42, 197, 85, 48], [126, 180, 104, 58]];
manifest.characters.commander.expressions.curious.eyelids = [[42, 178, 85, 48], [126, 161, 104, 58]];
// Remove each face's duplicate neck tab at the jaw; the body supplies the neck.
const jawEdges = {
  thoughtful: [155, 334, 244, 280], grateful: [155, 327, 244, 273],
  surprised: [150, 315, 244, 261], determined: [155, 342, 244, 286],
  encouraging: [155, 330, 244, 274], curious: [151, 316, 244, 261],
  confident: [197, 472, 325, 397],
};
for (const [expression, edge] of Object.entries(jawEdges)) manifest.characters.commander.expressions[expression].neckCut = edge;
// The male atlas is a complete-body rig with registered talking/blinking frames.
manifest.characters['commander-male'] = JSON.parse(readFileSync(new URL('../public/story/characters-v1/commander-male-rig.json', import.meta.url)));
manifest.atlases['commander-male-atlas'] = { file: 'commander-male-atlas.png', width: 1024, height: 1536 };
writeFileSync(new URL('../public/story/characters-v1/manifest.json', import.meta.url), JSON.stringify(manifest, null, 2) + '\n');
console.log('Character manifest: 12 expression sets, 9 poses, all script cue bindings.');
