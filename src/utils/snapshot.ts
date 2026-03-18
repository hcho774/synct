/**
 * Lightweight snapshot function
 * Uses structuredClone if available, otherwise shallow copy
 */
export function createSnapshot<T>(state: T): T {
  // Use native structuredClone if available (faster, smaller)
  if (typeof structuredClone !== 'undefined') {
    return structuredClone(state);
  }
  
  // Fallback: shallow copy for primitives, deep copy for objects
  if (state === null || typeof state !== 'object') {
    return state;
  }
  
  if (Array.isArray(state)) {
    return state.map(item => createSnapshot(item)) as T;
  }
  
  const result = {} as T;
  for (const key in state) {
    if (state.hasOwnProperty(key)) {
      const value = state[key];
      result[key] = typeof value === 'object' && value !== null
        ? createSnapshot(value)
        : value;
    }
  }
  
  return result;
}
