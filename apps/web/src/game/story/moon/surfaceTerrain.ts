import * as THREE from 'three';
import { SURFACE_EDGES, SURFACE_MODEL, legPoint, surfaceLight } from './surface.ts';
import type { SurfaceNodeId, SurfaceState } from './surface.ts';
import type { MoonSession } from './session.ts';

/** Presentation relief only; waypoint distance and resource accounting remain authoritative. */
export function surfaceHeight(x: number, z: number) {
  const lookout = 1.5 * Math.exp(-((x - 2.5) ** 2 / 13 + (z - 3.33) ** 2 / 12));
  const ridge = 2.4 * Math.exp(-((x - 14) ** 2 / 50 + (z + 10.5) ** 2 / 5));
  const radius = Math.hypot((x - 24) * .9, z + 6);
  const crater = .85 * Math.exp(-((radius - 6) ** 2) / 1.6) - 1.2 * Math.exp(-(radius ** 2) / 19);
  const ripples = Math.sin(x * .65) * Math.cos(z * .54) * .055 + Math.sin(x * 2.7 + z * 1.8) * .018;
  return lookout + ridge + crater + ripples;
}

export function regolithTexture() {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  let seed = 87;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) | 0; return (seed >>> 0) / 4294967296; };
  const pixels = ctx.createImageData(512, 512);
  for (let i = 0; i < pixels.data.length; i += 4) {
    const gray = 155 + random() * 35;
    pixels.data[i] = gray; pixels.data[i + 1] = gray; pixels.data[i + 2] = gray; pixels.data[i + 3] = 255;
  }
  ctx.putImageData(pixels, 0, 0);
  for (let i = 0; i < 95; i++) {
    const x = random() * 512, y = random() * 512, r = 2 + random() * 13;
    const gradient = ctx.createRadialGradient(x - r * .2, y + r * .2, 0, x, y, r);
    gradient.addColorStop(0, '#44434a80'); gradient.addColorStop(.7, '#77747a20'); gradient.addColorStop(.85, '#e9e5dd45'); gradient.addColorStop(1, '#93909300');
    ctx.fillStyle = gradient; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.repeat.set(14, 10); texture.anisotropy = 4;
  return texture;
}

export function createSurfaceTerrain(moon: MoonSession) {
  const group = new THREE.Group(), texture = regolithTexture();
  const geometry = new THREE.PlaneGeometry(130, 96, 260, 192); geometry.rotateX(-Math.PI / 2);
  const positions = geometry.attributes.position, colors: number[] = [];
  const sunlight = new THREE.Color('#aaa7a1'), shadow = new THREE.Color('#555966');
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i), z = positions.getZ(i); positions.setY(i, surfaceHeight(x, z));
    const color = surfaceLight(x * 6, z * 6, moon) === 0 ? shadow : sunlight;
    colors.push(color.r, color.g, color.b);
  }
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3)); geometry.computeVertexNormals();
  const ground = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ map: texture, roughness: 1, vertexColors: true })); ground.receiveShadow = true; group.add(ground);
  const rockGeometry = new THREE.DodecahedronGeometry(1, 0);
  const rockMaterial = new THREE.MeshStandardMaterial({ color: '#77747a', roughness: .97, flatShading: true });
  // Leave the modeled trails clear; clusters form landmarks around the playable route.
  const trail = SURFACE_EDGES.flatMap(e => Array.from({ length: 25 }, (_, i) => legPoint({ edge: e.id, from: e.a, to: e.b }, i / 24)));
  for (let i = 0; i < 170; i++) {
    const x = Math.sin(i * 4.71) * 36 + 7, z = Math.cos(i * 2.39) * 24;
    if (trail.some(p => Math.hypot(p.x / 6 - x, p.z / 6 - z) < 1.05) || Math.hypot(x + 7, z) < 4) continue;
    const size = .1 + (i % 7) * .075, rock = new THREE.Mesh(rockGeometry, rockMaterial);
    rock.position.set(x, surfaceHeight(x, z) + size * .32, z); rock.scale.set(size * 1.4, size * .8, size);
    rock.rotation.set(i * .31, i * 1.7, i * .19); rock.castShadow = size > .3; rock.receiveShadow = true; group.add(rock);
  }
  return group;
}

/** Bounded geometry reconstructed from completed/current legs rather than a growing frame history. */
export function writeSurfaceTracks(geometry: THREE.BufferGeometry, surface: SurfaceState) {
  const points: number[] = [];
  const append = (from: SurfaceNodeId, to: SurfaceNodeId, edge: typeof SURFACE_EDGES[number]['id'], fraction: number) => {
    const count = Math.floor(fraction * 72);
    for (let i = 0; i < count; i++) {
      const a = legPoint({ from, to, edge }, i / 72), b = legPoint({ from, to, edge }, Math.min(fraction, (i + .7) / 72));
      const angle = Math.atan2(b.z - a.z, b.x - a.x), dx = -Math.sin(angle) * .37, dz = Math.cos(angle) * .37;
      for (const side of [-1, 1]) {
        const ax = a.x / 6 + dx * side, az = a.z / 6 + dz * side, bx = b.x / 6 + dx * side, bz = b.z / 6 + dz * side;
        points.push(ax, surfaceHeight(ax, az) + .022, az, bx, surfaceHeight(bx, bz) + .022, bz);
      }
    }
  };
  for (const id of new Set(surface.traversed)) { const e = SURFACE_EDGES.find(e => e.id === id); if (e) append(e.a, e.b, e.id, 1); }
  if (surface.legs[0]) { const leg = surface.legs[0]; append(leg.from, leg.to, leg.edge, surface.legFrame / SURFACE_MODEL.legFrames); }
  const data = geometry.attributes.position as THREE.BufferAttribute;
  (data.array as Float32Array).set(points); data.needsUpdate = true; geometry.setDrawRange(0, points.length / 3);
  geometry.computeBoundingSphere();
}
