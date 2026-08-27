"use client";

import { useEffect, useReducer } from "react";

/**
 * A tiny cross-component refresh bus.
 *
 * The store mutates localStorage directly. Components that depend on store
 * data call `useStoreVersion()` and re-read their slice whenever the version
 * bumps (which happens after any mutation). This keeps the demo consistent
 * without introducing a heavier state library.
 */
let version = 0;
const listeners = new Set<() => void>();

function emit() {
  version += 1;
  listeners.forEach((fn) => fn());
}

export function bumpStore() {
  emit();
}

export function useStoreVersion(): number {
  const [v, force] = useReducer((n: number) => n + 1, 0);

  useEffect(() => {
    const fn = () => force();
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);

  return v;
}

export { version };
