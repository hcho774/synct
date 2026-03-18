/**
 * Async action tracking utilities
 * Solves problem #2: Difficult Async Flow Debugging
 */

import { ActionContext } from '../types';

export interface AsyncActionState<TState = unknown, TResult = unknown> {
  id: string;
  name: string;
  status: 'pending' | 'success' | 'error' | 'cancelled';
  startTime: number;
  endTime?: number;
  duration?: number;
  error?: Error;
  result?: TResult;
  stateSnapshots: {
    before: TState;
    after?: TState;
  };
}

export class AsyncActionTracker<TState = unknown, TResult = unknown> {
  private activeActions: Map<string, AsyncActionState<TState, TResult>> = new Map();
  private completedActions: AsyncActionState<TState, TResult>[] = [];
  private maxCompletedActions = 100;

  /**
   * Deep clone state for tracking snapshots.
   * Uses native structuredClone (fast) with JSON fallback.
   */
  private cloneState(state: TState): TState {
    if (typeof structuredClone !== 'undefined') {
      return structuredClone(state);
    }
    return JSON.parse(JSON.stringify(state)) as TState;
  }

  /**
   * Start tracking an async action
   */
  start(actionContext: ActionContext, initialState: TState): string {
    const asyncId = actionContext.asyncId || `async_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const asyncState: AsyncActionState<TState, TResult> = {
      id: asyncId,
      name: actionContext.name,
      status: 'pending',
      startTime: Date.now(),
      stateSnapshots: {
        before: this.cloneState(initialState),
      },
    };

    this.activeActions.set(asyncId, asyncState);
    return asyncId;
  }

  /**
   * Mark async action as successful
   */
  success(asyncId: string, result: TResult, finalState: TState): void {
    const action = this.activeActions.get(asyncId);
    if (!action) return;

    action.status = 'success';
    action.endTime = Date.now();
    action.duration = action.endTime - action.startTime;
    action.result = result;
    action.stateSnapshots.after = this.cloneState(finalState);

    this.complete(asyncId);
  }

  /**
   * Mark async action as failed
   */
  error(asyncId: string, error: Error, finalState: TState): void {
    const action = this.activeActions.get(asyncId);
    if (!action) return;

    action.status = 'error';
    action.endTime = Date.now();
    action.duration = action.endTime - action.startTime;
    action.error = error;
    action.stateSnapshots.after = this.cloneState(finalState);

    this.complete(asyncId);
  }

  /**
   * Mark async action as cancelled
   */
  cancel(asyncId: string): void {
    const action = this.activeActions.get(asyncId);
    if (!action) return;

    action.status = 'cancelled';
    action.endTime = Date.now();
    action.duration = action.endTime - action.startTime;

    this.complete(asyncId);
  }

  /**
   * Complete action (move from active to completed)
   */
  private complete(asyncId: string): void {
    const action = this.activeActions.get(asyncId);
    if (!action) return;

    this.activeActions.delete(asyncId);
    this.completedActions.push(action);

    // Limit completed actions history
    if (this.completedActions.length > this.maxCompletedActions) {
      this.completedActions.shift();
    }
  }

  /**
   * Get active async actions
   */
  getActiveActions(): ReadonlyArray<AsyncActionState<TState, TResult>> {
    return Array.from(this.activeActions.values());
  }

  /**
   * Get completed async actions
   */
  getCompletedActions(): ReadonlyArray<AsyncActionState<TState, TResult>> {
    return [...this.completedActions];
  }

  /**
   * Get async action by ID
   */
  getAction(asyncId: string): AsyncActionState<TState, TResult> | undefined {
    return this.activeActions.get(asyncId) || this.completedActions.find(a => a.id === asyncId);
  }

  /**
   * Clear all tracking data
   */
  clear(): void {
    this.activeActions.clear();
    this.completedActions = [];
  }
}
