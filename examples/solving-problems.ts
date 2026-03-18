/**
 * Examples demonstrating how Synct solves the 3 main problems
 * with Event-based State Management libraries
 */

import { SynctManager } from '../src/SynctManager';
import type { AsyncAction, Middleware } from '../src/types';

interface UserState {
  name: string;
  age: number;
  email: string;
  loading: boolean;
  error?: string;
}

// ============================================
// Problem #1: No State Change Path Tracking
// ============================================

console.log('=== Problem #1: No State Change Path Tracking ===\n');

const stateManager1 = new SynctManager<UserState>(
  { name: 'John', age: 30, email: 'john@example.com', loading: false },
  {
    enableChangePathTracking: true, // ✅ Solution
    enableStackTrace: true, // Optional: also track stack traces
  }
);

stateManager1.subscribe((state, event) => {
  console.log('State changed!');
  console.log('Change path:', event.changePath); // ✅ Track which paths changed
  console.log('Action context:', event.actionContext); // ✅ Track who, when, how it changed
  console.log('Action chain:', stateManager1.getActionChain()); // ✅ Track complete action chain
  console.log('---\n');
});

stateManager1.setState({ name: 'Jane' });
stateManager1.setProperty('age', 31);

// ============================================
// Problem #2: Difficult Async Flow Debugging
// ============================================

console.log('\n=== Problem #2: Difficult Async Flow Debugging ===\n');

const stateManager2 = new SynctManager<UserState>(
  { name: 'John', age: 30, email: 'john@example.com', loading: false },
  {
    enableAsyncTracking: true, // ✅ Solution
  }
);

// Register async action
const fetchUserAction: AsyncAction<UserState, { name: string; email: string }> = {
  name: 'fetchUser',
  handler: async (state, ...args: any[]) => {
    const userId = args[0] as string;
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { name: 'Jane Doe', email: 'jane@example.com' };
  },
  onStart: (state) => {
    // Update loading state when action starts
    return { ...state, loading: true, error: undefined };
  },
  onSuccess: (state, result) => {
    // Update state on success
    return {
      ...state,
      name: result.name,
      email: result.email,
      loading: false,
    };
  },
  onError: (state, error) => {
    // Update state on error
    return {
      ...state,
      loading: false,
      error: error.message,
    };
  },
};

stateManager2.registerAsyncAction(fetchUserAction);

// Execute async action
stateManager2.dispatchAsync('fetchUser', 'user123')
  .then(() => {
    console.log('Async action completed!');
    
    // ✅ Async action tracking
    console.log('Active async actions:', stateManager2.getActiveAsyncActions());
    console.log('Completed async actions:', stateManager2.getCompletedAsyncActions());
    
    // Get specific async action details
    const tracker = stateManager2.getAsyncTracker();
    if (tracker) {
      const actions = tracker.getCompletedActions();
      if (actions.length > 0) {
        const action = actions[actions.length - 1];
        console.log('Last async action:', {
          name: action.name,
          status: action.status,
          duration: action.duration,
          error: action.error?.message,
          stateBefore: action.stateSnapshots.before,
          stateAfter: action.stateSnapshots.after,
        });
      }
    }
  })
  .catch(error => {
    console.error('Async action failed:', error);
  });

// ============================================
// Problem #3: Different Patterns Per Team
// ============================================

console.log('\n=== Problem #3: Different Patterns Per Team ===\n');

// ✅ Solution: Middleware system to support team-specific patterns

// Team A: Logging middleware
const loggingMiddleware: Middleware<UserState> = (state, next, action) => {
  console.log(`[Team A Pattern] Action: ${action.name}`, {
    timestamp: new Date(action.timestamp).toISOString(),
    state,
  });
  next(state);
};

// Team B: Validation middleware
const validationMiddleware: Middleware<UserState> = (state, next, action) => {
  if ('email' in state && state.email && !state.email.includes('@')) {
    console.error('[Team B Pattern] Invalid email!');
    return; // Don't proceed
  }
  next(state);
};

// Team C: Analytics middleware
const analyticsMiddleware: Middleware<UserState> = (state, next, action) => {
  // Send to analytics
  console.log(`[Team C Pattern] Tracking: ${action.name}`);
  next(state);
};

// Apply team-specific patterns
const stateManager3 = new SynctManager<UserState>(
  { name: 'John', age: 30, email: 'john@example.com', loading: false },
  {
    middleware: [
      loggingMiddleware,    // Team A pattern
      validationMiddleware, // Team B pattern
      analyticsMiddleware,  // Team C pattern
    ],
  }
);

// Or add middleware dynamically
stateManager3.use((state, next, action) => {
  // Custom team pattern
  console.log('[Custom Pattern]', action.name);
  next(state);
});

stateManager3.setState({ name: 'Jane' });

// ============================================
// Combined: All 3 problems solved together
// ============================================

console.log('\n=== All Problems Solved Together ===\n');

const stateManager = new SynctManager<UserState>(
  { name: 'John', age: 30, email: 'john@example.com', loading: false },
  {
    // Problem #1: No State Change Path Tracking
    enableChangePathTracking: true,
    enableStackTrace: true,
    
    // Problem #2: Difficult Async Flow Debugging
    enableAsyncTracking: true,
    
    // Problem #3: Different Patterns Per Team
    middleware: [loggingMiddleware],
  }
);

// Subscribe with full tracking
stateManager.subscribe((state, event) => {
  console.log('=== State Change ===');
  console.log('Path:', event.changePath);
  console.log('Action:', event.actionContext?.name);
  console.log('Chain:', stateManager.getActionChain().map(a => a.name));
  console.log('Async:', stateManager.getActiveAsyncActions().map(a => a.name));
  console.log('---\n');
});

// Register and use async action
stateManager.registerAsyncAction(fetchUserAction);
stateManager.dispatchAsync('fetchUser', 'user123');

