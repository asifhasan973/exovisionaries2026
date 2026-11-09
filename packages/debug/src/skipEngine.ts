/**
 * Unified Debug & Skip Execution Coordinator.
 * Encapsulates the stage advancement heavy lifting and state seeder registration
 * inside @exo/debug, keeping apps/web as a lightweight consumer.
 */

export type SkipResolver<T> = (source: T) => T;

let activeSkipResolver: SkipResolver<any> | null = null;

export function registerSkipResolver<T>(resolver: SkipResolver<T>): void {
  activeSkipResolver = resolver;
}

export function executeSkip<T>(source: T): T {
  if (activeSkipResolver) {
    return activeSkipResolver(source);
  }
  return source;
}

export function hasSkipResolver(): boolean {
  return activeSkipResolver !== null;
}
