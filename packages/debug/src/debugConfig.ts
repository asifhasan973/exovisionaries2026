/**
 * Environment resolution & registry:
 * Debug navigation is available only in the development environment.
 * VITE_APP_ENV=production can also disable it locally.
 */
export const isDevelopment: boolean =
  typeof import.meta !== 'undefined' &&
  Boolean(import.meta.env?.DEV) &&
  import.meta.env?.VITE_APP_ENV !== 'production';

export type DebugTargetType = 'page' | 'step' | 'demo';

export interface DebugRoute {
  type: DebugTargetType;
  id: string;
}

export interface DebugItem {
  id: string;
  label: string;
  description?: string;
  badge?: string;
  type: DebugTargetType;
  hash: string;
}

export interface DebugCategory {
  title: string;
  description: string;
  items: DebugItem[];
}

let registeredCategories: DebugCategory[] = [];
let sessionSeeder: ((stepId: string) => any) | null = null;

export function registerDebugCategories(categories: DebugCategory[]): void {
  registeredCategories = categories;
}

export function getDebugCategories(): DebugCategory[] {
  return registeredCategories;
}

export function setDebugSessionSeeder(seeder: (stepId: string) => any): void {
  sessionSeeder = seeder;
}

export function createDebugSession(stepId: string): any {
  if (sessionSeeder) {
    return sessionSeeder(stepId);
  }
  return null;
}

/**
 * Parses hash routes matching:
 * - #/debug/page/:id (e.g. #/debug/page/legacy)
 * - #/debug/step/:id (e.g. #/debug/step/lander-build)
 * - #/debug/demo/:id (e.g. #/debug/demo/ice-return)
 * - #/debug/:id (shorthand fallback)
 */
export function parseDebugHash(hash: string): DebugRoute | null {
  if (!isDevelopment) return null;
  const clean = hash.replace(/^#\/?/, '').trim();
  if (!clean.startsWith('debug')) return null;

  const parts = clean.split('/').filter(Boolean);
  if (parts.length < 2) return null;

  if (parts.length >= 3) {
    const type = parts[1];
    const id = parts[2];
    if (type === 'page' || type === 'step' || type === 'demo') {
      return { type, id };
    }
    return null;
  }

  // Shorthand #/debug/:id -> default to 'step'
  return { type: 'step', id: parts[1] };
}

