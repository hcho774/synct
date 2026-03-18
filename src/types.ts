/**
 * Synct - Type-safe state management with undo/redo and event tracking
 */

/**
 * Collection change action types
 */
export type CollectionAction = 'add' | 'remove' | 'replace' | 'reset' | 'move';

/**
 * Collection changed event interface
 */
export interface CollectionChangedEvent<T> {
  action: CollectionAction;
  newItem?: T;
  oldItem?: T;
  index?: number;
  property?: string;
}

/**
 * Action context for tracking state change paths
 */
export interface ActionContext {
  id: string;
  name: string;
  timestamp: number;
  caller?: string;
  stackTrace?: string;
  parentActionId?: string;
  asyncId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * State change event interface with full tracking
 */
export interface SynctStateEvent<T> {
  previousState: T;
  currentState: T;
  property?: string;
  changeType: 'update' | 'reset' | 'undo' | 'redo';
  actionContext?: ActionContext;
  changePath?: string[]; // Path of properties that changed
  diff?: StateDiff<T>;
}

/**
 * State diff for tracking what actually changed
 */
export interface StateDiff<T> {
  added?: Partial<T>;
  removed?: Partial<T>;
  changed?: Partial<T>;
  unchanged?: Partial<T>;
}

/**
 * Snapshot metadata
 */
export interface SnapshotMetadata {
  timestamp: number;
  action?: string;
  description?: string;
}

/**
 * State update metadata (for setState)
 */
export interface SynctUpdateMetadata {
  action?: string;
  description?: string;
}

/**
 * History entry with metadata
 */
export interface HistoryEntry<T> {
  state: T;
  metadata: SnapshotMetadata;
}

/**
 * Middleware function type
 */
export type Middleware<T> = (
  state: T,
  next: (newState: Partial<T> | T) => void,
  action: ActionContext
) => void | Promise<void>;

/**
 * Async action handler
 */
export interface AsyncAction<T, R = unknown, Args extends unknown[] = unknown[]> {
  name: string;
  handler: (state: T, ...args: Args) => Promise<R>;
  onStart?: (state: T, ...args: Args) => Partial<T> | T;
  onSuccess?: (state: T, result: R, ...args: Args) => Partial<T> | T;
  onError?: (state: T, error: Error, ...args: Args) => Partial<T> | T;
}

/**
 * Synct configuration options
 */
export interface SynctOptions<T = unknown> {
  /**
   * Maximum number of history entries to keep (for undo/redo)
   * Default: 50
   */
  maxHistorySize?: number;

  /**
   * Enable deep equality checking for state changes
   * Default: true
   */
  enableDeepEquality?: boolean;

  /**
   * Enable automatic snapshot creation on state changes
   * Default: true
   */
  autoSnapshot?: boolean;

  /**
   * Custom equality function for state comparison
   */
  equalityFn?: <T>(a: T, b: T) => boolean;

  /**
   * Enable change path tracking (solves problem #1)
   * Default: true
   */
  enableChangePathTracking?: boolean;

  /**
   * Enable async action tracking (solves problem #2)
   * Default: true
   */
  enableAsyncTracking?: boolean;

  /**
   * Enable stack trace capture for debugging
   * Default: false (performance impact)
   */
  enableStackTrace?: boolean;

  /**
   * Middleware functions (solves problem #3 - team patterns)
   * Default: []
   */
  middleware?: Middleware<T>[];
}

/**
 * Subscription callback type
 */
export type SynctSubscription<T> = (state: T, event: SynctStateEvent<T>) => void;

/**
 * Property change callback type
 */
export type PropertyChangeCallback<T> = (value: T, previousValue: T, property?: string) => void;

// Note: Middleware and AsyncAction are defined in types.ts to avoid circular dependency

