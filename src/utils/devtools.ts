/**
 * Redux DevTools Extension integration for Synct
 * Automatically connects to Redux DevTools Extension when available
 */

/**
 * Typed interface for the Redux DevTools Extension object on window
 */
interface ReduxDevToolsExtension {
  connect(options: { name: string; instanceId: string }): ReduxDevToolsConnection;
}

/**
 * Typed interface for the connected Redux DevTools instance
 */
interface ReduxDevToolsConnection {
  init(state: unknown): void;
  send(action: { type: string; payload?: unknown }, state: unknown): void;
  subscribe(listener: (message: DevToolsMessage) => void): () => void;
  unsubscribe(): void;
}

export interface DevToolsMessage {
  type: string;
  payload?: { type?: string; [key: string]: unknown };
  state?: unknown;
  action?: { type: string; [key: string]: unknown };
  id?: string | number;
  source?: string;
}

// Type-safe window access
declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION__?: ReduxDevToolsExtension;
    __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: ReduxDevToolsExtension;
  }
}

export class SynctDevTools {
  private devToolsExtension: ReduxDevToolsConnection | null = null;
  private instanceId: string;
  private isEnabled: boolean = false;

  constructor() {
    this.instanceId = `synct_${Date.now()}`;
    this.connect();
  }

  /**
   * Connect to Redux DevTools Extension
   */
  private connect(): void {
    // Check if we're in a browser environment
    if (typeof globalThis === 'undefined' || typeof (globalThis as Record<string, unknown>)['window'] === 'undefined') {
      return;
    }

    const win = (globalThis as Record<string, unknown>)['window'] as Window;

    // Check for Redux DevTools Extension
    const extension = win.__REDUX_DEVTOOLS_EXTENSION__ ||
                      win.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__;

    if (extension) {
      try {
        this.devToolsExtension = extension.connect({
          name: 'Synct',
          instanceId: this.instanceId,
        });

        this.isEnabled = true;

        // Subscribe to DevTools actions (time-travel debugging)
        this.devToolsExtension.subscribe((message: DevToolsMessage) => {
          if (message.type === 'DISPATCH') {
            this.handleDevToolsAction(message);
          }
        });

        // Send initial state
        this.devToolsExtension.init({});
      } catch (error) {
        console.warn('Synct: Failed to connect to Redux DevTools', error);
      }
    }
  }

  /**
   * Handle DevTools actions (time-travel, jump to state, etc.)
   */
  private handleDevToolsAction(message: DevToolsMessage): void {
    // This will be handled by SynctManager if needed
    // For now, we just log it
    if (message.payload?.type === 'JUMP_TO_STATE' || message.payload?.type === 'JUMP_TO_ACTION') {
      // Time-travel debugging - would need to be handled by SynctManager
      console.log('Synct: DevTools time-travel action', message);
    }
  }

  /**
   * Send state update to DevTools
   */
  public send(action: string, state: unknown, diff?: unknown): void {
    if (!this.isEnabled || !this.devToolsExtension) {
      return;
    }

    try {
      this.devToolsExtension.send(
        {
          type: action,
          payload: diff ?? state,
        },
        state
      );
    } catch (error) {
      console.warn('Synct: Failed to send to DevTools', error);
    }
  }

  /**
   * Check if DevTools is available
   */
  public isAvailable(): boolean {
    return this.isEnabled && this.devToolsExtension !== null;
  }

  /**
   * Disconnect from DevTools
   */
  public disconnect(): void {
    if (this.devToolsExtension) {
      try {
        this.devToolsExtension.unsubscribe();
      } catch (error) {
        // Ignore errors
      }
      this.devToolsExtension = null;
      this.isEnabled = false;
    }
  }
}

// Singleton instance
export const devTools = new SynctDevTools();
