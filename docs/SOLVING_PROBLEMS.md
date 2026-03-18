# synct: Solving the 3 Biggest Problems

## Problem Analysis and Solutions

This document explains how synct solves the 3 main problems that users face with Event-based State Management libraries.

---

## Problem #1: No State Change Path Tracking ❌ → ✅ SOLVED

### The Problem
- Cannot tell which properties changed
- Difficult to trace the cause of changes
- Must manually find change paths when debugging

### synct's Solution

#### 1. Change Path Tracking
```typescript
const stateManager = new SynctManager<UserState>(initialState, {
  enableChangePathTracking: true, // ✅ Automatic path tracking
});

stateManager.subscribe((state, event) => {
  console.log(event.changePath); 
  // ['name'] - only name property changed
  // ['user', 'profile', 'email'] - nested paths also tracked
});
```

#### 2. Action Context
```typescript
// Complete context for all state changes
event.actionContext = {
  id: 'action_1_1234567890',
  name: 'setState',
  timestamp: 1234567890,
  caller: 'handleSubmit',        // Which function called it
  stackTrace: '...',              // Full stack trace
  parentActionId: 'action_0_...', // Parent action (chain tracking)
  metadata: { description: '...' }
};
```

#### 3. Action Chain
```typescript
// Track complete action chain
const chain = stateManager.getActionChain();
// [
//   { name: 'loadData', id: 'action_1', ... },
//   { name: 'validateForm', id: 'action_2', parentActionId: 'action_1', ... },
//   { name: 'submitForm', id: 'action_3', parentActionId: 'action_2', ... }
// ]
```

### Usage Example
```typescript
interface FormState {
  user: {
    name: string;
    email: string;
    profile: {
      age: number;
    };
  };
}

const stateManager = new SynctManager<FormState>({...}, {
  enableChangePathTracking: true,
  enableStackTrace: true,
});

stateManager.setState({
  user: {
    ...stateManager.state.user,
    profile: {
      ...stateManager.state.user.profile,
      age: 31
    }
  }
});

// Output:
// changePath: ['user', 'profile', 'age']
// actionContext: { name: 'setState', caller: 'handleAgeChange', ... }
```

---

## Problem #2: Difficult Async Flow Debugging ❌ → ✅ SOLVED

### The Problem
- Difficult to track start/success/failure states of async operations
- Cannot tell which async operation changed the state
- Lack of context when errors occur
- Cannot track when multiple async operations run simultaneously

### synct's Solution

#### 1. Async Action Registration
```typescript
stateManager.registerAsyncAction({
  name: 'fetchUser',
  handler: async (state, userId) => {
    const user = await api.getUser(userId);
    return user;
  },
  onStart: (state) => ({ ...state, loading: true }),
  onSuccess: (state, result) => ({ ...state, user: result, loading: false }),
  onError: (state, error) => ({ ...state, error: error.message, loading: false }),
});
```

#### 2. Full Async Tracking
```typescript
// Execute async action
await stateManager.dispatchAsync('fetchUser', '123');

// Query tracking information
const active = stateManager.getActiveAsyncActions();
// [
//   {
//     id: 'async_1234567890_abc',
//     name: 'fetchUser',
//     status: 'pending',
//     startTime: 1234567890,
//     stateSnapshots: { before: {...} }
//   }
// ]

const completed = stateManager.getCompletedAsyncActions();
// [
//   {
//     id: 'async_1234567890_abc',
//     name: 'fetchUser',
//     status: 'success',
//     duration: 1234, // ms
//     result: {...},
//     stateSnapshots: { before: {...}, after: {...} }
//   }
// ]
```

#### 3. Error Context
```typescript
// Complete context when error occurs
const failedAction = stateManager.getAsyncTracker().getAction('async_123');
console.log({
  name: failedAction.name,
  error: failedAction.error,
  stateBefore: failedAction.stateSnapshots.before,
  stateAfter: failedAction.stateSnapshots.after,
  duration: failedAction.duration,
});
```

### Usage Example
```typescript
// Execute multiple async operations simultaneously
const [user, posts, comments] = await Promise.all([
  stateManager.dispatchAsync('fetchUser', '123'),
  stateManager.dispatchAsync('fetchPosts', '123'),
  stateManager.dispatchAsync('fetchComments', '123'),
]);

// Track all operations
const allActive = stateManager.getActiveAsyncActions();
const allCompleted = stateManager.getCompletedAsyncActions();

// Check status of specific operation
const userAction = stateManager.getAsyncTracker().getAction('async_user_123');
console.log('User fetch:', {
  status: userAction.status,
  duration: userAction.duration,
  error: userAction.error,
});
```

---

## Problem #3: Different Patterns Per Team ❌ → ✅ SOLVED

### The Problem
- Each team prefers different patterns (logging, validation, analytics, etc.)
- Libraries that only support specific patterns are hard for other teams to use
- Must fork the library to add custom logic

### synct's Solution

#### 1. Middleware System
```typescript
// Team A: Logging pattern
const loggingMiddleware: Middleware<UserState> = (state, next, action) => {
  console.log(`[${action.name}]`, state);
  next(state);
};

// Team B: Validation pattern
const validationMiddleware: Middleware<UserState> = (state, next, action) => {
  if (isValid(state)) {
    next(state);
  } else {
    console.error('Invalid state!');
    // Don't call next() - prevents state update
  }
};

// Team C: Analytics pattern
const analyticsMiddleware: Middleware<UserState> = (state, next, action) => {
  analytics.track(action.name, { state });
  next(state);
};

// Apply all patterns
const stateManager = new SynctManager(initialState, {
  middleware: [
    loggingMiddleware,
    validationMiddleware,
    analyticsMiddleware,
  ],
});
```

#### 2. Dynamic Middleware
```typescript
// Add/remove middleware at runtime
stateManager.use((state, next, action) => {
  // Custom logic
  next(state);
});

stateManager.removeMiddleware(someMiddleware);
```

#### 3. Async Middleware
```typescript
// Async middleware also supported
const asyncMiddleware: Middleware<UserState> = async (state, next, action) => {
  await logToServer(action);
  await validateWithAPI(state);
  next(state);
};
```

### Usage Examples

#### Team A: Logging + Performance
```typescript
const teamAMiddleware = [
  (state, next, action) => {
    const start = performance.now();
    next(state);
    const duration = performance.now() - start;
    console.log(`[Performance] ${action.name}: ${duration}ms`);
  },
  (state, next, action) => {
    logger.log(action.name, state);
    next(state);
  },
];
```

#### Team B: Validation + Error Handling
```typescript
const teamBMiddleware = [
  (state, next, action) => {
    try {
      validateState(state);
      next(state);
    } catch (error) {
      errorHandler.handle(error, action);
    }
  },
];
```

#### Team C: Analytics + Caching
```typescript
const teamCMiddleware = [
  (state, next, action) => {
    analytics.track(action.name);
    next(state);
  },
  (state, next, action) => {
    if (shouldCache(action)) {
      cache.set(action.name, state);
    }
    next(state);
  },
];
```

---

## Conclusion

synct solves all 3 major problems with Event-based State Management:

1. ✅ **State Change Path Tracking** - Change path, action context, action chain
2. ✅ **Async Flow Debugging** - Async action tracking, state snapshots, error context
3. ✅ **Different Patterns Per Team** - Middleware system, plugin architecture

This enables developers to:
- Debug faster
- Write more stable code
- Maintain their team's preferred patterns
