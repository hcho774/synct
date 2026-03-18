/**
 * Change tracking utilities
 * Solves problem #1: No State Change Path Tracking
 */

export interface ChangePath {
  path: string[];
  from: unknown;
  to: unknown;
}

/**
 * Calculate change path between two states
 */
export function calculateChangePath<T extends object>(
  previous: T,
  current: T,
  path: string[] = []
): ChangePath[] {
  const changes: ChangePath[] = [];

  const prevKeys = Object.keys(previous);
  const currKeys = Object.keys(current);
  const hasOwn = Object.prototype.hasOwnProperty;

  for (let i = 0; i < prevKeys.length; i++) {
    const key = prevKeys[i];
    
    path.push(key);
    const prevValue = previous[key as keyof T];
    const currValue = current[key as keyof T];

    // Value was removed
    if (!hasOwn.call(current, key)) {
      changes.push({
        path: [...path],
        from: prevValue,
        to: undefined,
      });
    }
    // Value changed
    else if (prevValue !== currValue) {
      // If both are objects, recurse
      if (
        typeof prevValue === 'object' &&
        prevValue !== null &&
        !Array.isArray(prevValue) &&
        typeof currValue === 'object' &&
        currValue !== null &&
        !Array.isArray(currValue)
      ) {
        changes.push(...calculateChangePath(
          prevValue as Record<string, unknown>,
          currValue as Record<string, unknown>,
          path
        ));
      } else {
        changes.push({
          path: [...path],
          from: prevValue,
          to: currValue,
        });
      }
    }
    path.pop();
  }

  for (let i = 0; i < currKeys.length; i++) {
    const key = currKeys[i];
    if (hasOwn.call(previous, key)) continue;
    
    path.push(key);
    changes.push({
      path: [...path],
      from: undefined,
      to: current[key as keyof T],
    });
    path.pop();
  }

  return changes;
}

/**
 * Format change path as string
 */
export function formatChangePath(changes: ChangePath[]): string[] {
  return changes.map(change => change.path.join('.'));
}

/**
 * Get stack trace (if enabled)
 */
export function getStackTrace(): string | undefined {
  const stack = new Error().stack;
  if (!stack) return undefined;

  // Remove first 3 lines (Error, getStackTrace, caller)
  const lines = stack.split('\n').slice(3);
  return lines.join('\n');
}

/**
 * Get caller function name from stack
 */
export function getCallerName(): string | undefined {
  const stack = new Error().stack;
  if (!stack) return undefined;

  const lines = stack.split('\n');
  if (lines.length < 4) return undefined;

  // Extract function name from stack line
  const match = lines[3].match(/at\s+(\w+)/);
  return match ? match[1] : undefined;
}

