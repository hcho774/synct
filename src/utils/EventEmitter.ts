/**
 * Simple EventEmitter implementation
 * Replaces 'events' package to reduce bundle size
 */

/** Generic event listener type — replaces bare Function + unknown[] */
type EventListener = (...args: unknown[]) => void;

export class SimpleEventEmitter {
  private _events: Map<string, EventListener[]> = new Map();
  private _maxListeners: number = 10;
  private _emitting: boolean = false;

  /**
   * Emit an event
   */
  emit(event: string, ...args: unknown[]): boolean {
    const listeners = this._events.get(event);
    if (!listeners || listeners.length === 0) {
      return false;
    }

    // Iterate directly without copying — use length snapshot for safety
    const len = listeners.length;
    this._emitting = true;
    for (let i = 0; i < len; i++) {
      try {
        listeners[i](...args);
      } catch (error) {
        // Emit error event if listener throws
        if (event !== 'error') {
          this._emitting = false;
          this.emit('error', error);
          this._emitting = true;
        }
      }
    }
    this._emitting = false;
    return true;
  }

  /**
   * Add event listener
   */
  on(event: string, listener: EventListener): this {
    if (!this._events.has(event)) {
      this._events.set(event, []);
    }
    const listeners = this._events.get(event)!;
    listeners.push(listener);

    // Warn if too many listeners
    if (listeners.length > this._maxListeners) {
      console.warn(
        `MaxListenersExceededWarning: Possible EventEmitter memory leak detected. ${listeners.length} listeners added.`
      );
    }

    return this;
  }

  /**
   * Remove event listener
   */
  off(event: string, listener: EventListener): this {
    return this.removeListener(event, listener);
  }

  /**
   * Remove event listener
   */
  removeListener(event: string, listener: EventListener): this {
    const listeners = this._events.get(event);
    if (!listeners) return this;

    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
      if (listeners.length === 0) {
        this._events.delete(event);
      }
    }

    return this;
  }

  /**
   * Remove all listeners for an event
   */
  removeAllListeners(event?: string): this {
    if (event) {
      this._events.delete(event);
    } else {
      this._events.clear();
    }
    return this;
  }

  /**
   * Set max listeners
   */
  setMaxListeners(n: number): this {
    this._maxListeners = n;
    return this;
  }
}
