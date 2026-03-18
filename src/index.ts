/**
 * Synct - Type-safe state management with undo/redo and event tracking
 *
 * A powerful state management library featuring automatic undo/redo,
 * event tracking, async debugging, and React integration.
 */

// Named exports for better tree-shaking
export { SynctManager } from './SynctManager';

// Type exports (no runtime code)
export type {
  SynctOptions,
  SynctStateEvent,
  SynctSubscription,
  SynctUpdateMetadata,
  CollectionChangedEvent,
  CollectionAction,
  HistoryEntry,
  SnapshotMetadata,
  PropertyChangeCallback,
  ActionContext,
  Middleware,
  AsyncAction,
  StateDiff,
} from './types';

// Utils are optional - only import if needed
export { deepEqual } from './utils/deepEqual';
export { calculateChangePath, formatChangePath } from './utils/changeTracker';
export { AsyncActionTracker } from './utils/asyncTracker';

// React integration (separate bundle)
export { useSynct, useSynctProperty } from './react/useSynct';

// DevTools
export { devTools, SynctDevTools } from './utils/devtools';
export type { DevToolsMessage } from './utils/devtools';
