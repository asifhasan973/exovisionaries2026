import type { CharacterCue, StoryCharacterId, StoryExpression, StoryPose } from './types.ts';
export type CharacterArtId = StoryCharacterId | 'commander-male';
export type PerformanceCue = Omit<CharacterCue, 'character'> & { character: CharacterArtId };

export type AssetPoint = [number, number];
export type AssetRect = [number, number, number, number];
export type MouthFrame = 'closed' | 'ah' | 'oo';

export interface CharacterFaceAsset {
  atlas: string;
  closed: AssetRect;
  anchor: AssetPoint;
  scale: number;
  columnWidth: number;
  mouth: AssetRect;
  eyes: AssetRect;
  eyelids?: AssetRect[];
  neckCut?: AssetRect;
  offsets: Record<'ah' | 'oo' | 'blink', AssetPoint>;
}

export interface CharacterBodyAsset {
  cell: number;
  neck: AssetPoint;
  arm: AssetPoint[];
  pivot: AssetPoint;
}

export interface CharacterArt {
  displayName: string;
  identity: string;
  bodyAtlas: string;
  bodyGrid: AssetPoint;
  bodyScale: number;
  neckTarget: AssetPoint;
  headOffset?: AssetPoint;
  expressions: Partial<Record<StoryExpression, CharacterFaceAsset>>;
  poses: Partial<Record<StoryPose, CharacterBodyAsset>>;
  fullBody?: { expressionRows: Record<StoryExpression, number>; portrait: AssetRect; frames: { rect: AssetRect; anchor: AssetPoint }[][] };
}

export interface CharacterAssetManifest {
  version: 1;
  stage: { width: number; height: number };
  atlases: Record<string, { file: string; width: number; height: number }>;
  characters: Record<CharacterArtId, CharacterArt>;
  cueBindings: (CharacterCue & { lineId: string; role: 'speaker' | 'listener' })[];
}

export interface CharacterMotion {
  mouth?: MouthFrame;
  blink?: boolean;
  gesture?: number;
  nod?: number;
  breath?: number;
}

export interface LoadedCharacterArt {
  manifest: CharacterAssetManifest;
  characterId: CharacterArtId;
  character: CharacterArt;
  images: Map<string, HTMLImageElement>;
}

export interface CharacterAssetCompositor {
  loadRigAssets(characterId: CharacterArtId, baseURL?: string | URL, signal?: AbortSignal): Promise<LoadedCharacterArt>;
  sampleRigMotion(elapsedMs: number, speaking?: boolean, reducedMotion?: boolean, speechMs?: number): CharacterMotion;
  drawCharacterRig(context: CanvasRenderingContext2D, assets: LoadedCharacterArt, cue: PerformanceCue, motion?: CharacterMotion): void;
  drawCharacterPortrait(context: CanvasRenderingContext2D, assets: LoadedCharacterArt, expression: StoryExpression, motion?: CharacterMotion): void;
}

/** Lazy art bridge shared by the conversation renderer and later story screens. */
export function characterAssetRoot(base = import.meta.env?.BASE_URL ?? '/') {
  return `${base.endsWith('/') ? base : base + '/'}story/characters-v1/`;
}

export async function loadCharacterCompositor(): Promise<CharacterAssetCompositor> {
  // Bundle runtime code; public/ is reserved for the atlases and standalone art lab.
  return import('./characterRig.mjs');
}

export function requireCharacterPerformance(manifest: CharacterAssetManifest, cue: PerformanceCue) {
  const character = manifest.characters[cue.character];
  if (character?.fullBody && character.poses[cue.pose] && Number.isInteger(character.fullBody.expressionRows[cue.expression])) return { character };
  const face = character?.expressions[cue.expression];
  const body = character?.poses[cue.pose];
  if (!face || !body) throw new Error(`Missing character art: ${cue.character}/${cue.expression}/${cue.pose}`);
  return { character, face, body };
}
