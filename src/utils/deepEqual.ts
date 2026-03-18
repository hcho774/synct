/**
 * Deep equality check for objects and arrays
 * Compares values by content, not by reference
 */
export function deepEqual<T>(a: T, b: T): boolean {
  // Strict equality for primitives and same reference
  if (a === b) return true;

  // Handle null/undefined (if one is null but not both, they are not equal)
  if (a == null || b == null) return false;

  const typeA = typeof a;
  
  // Type check
  if (typeA !== typeof b) return false;

  // For primitives, if they reached here they are not equal
  if (typeA !== 'object') return false;

  // Both are objects/arrays
  const aObj = a as Record<string, unknown>;
  const bObj = b as Record<string, unknown>;

  // Array comparison
  if (Array.isArray(aObj) && Array.isArray(bObj)) {
    if (aObj.length !== bObj.length) {
      return false;
    }
    for (let i = 0; i < aObj.length; i++) {
      if (!deepEqual(aObj[i], bObj[i])) {
        return false;
      }
    }
    return true;
  }

  // If one is array and other is not
  if (Array.isArray(aObj) !== Array.isArray(bObj)) {
    return false;
  }

  // Object comparison
  const aKeys = Object.keys(aObj);

  if (aKeys.length !== Object.keys(bObj).length) {
    return false;
  }

  const hasOwn = Object.prototype.hasOwnProperty;
  for (let i = 0; i < aKeys.length; i++) {
    const key = aKeys[i];
    if (!hasOwn.call(bObj, key)) {
      return false;
    }
    if (!deepEqual(aObj[key], bObj[key])) {
      return false;
    }
  }

  return true;
}
























