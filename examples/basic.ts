/**
 * Basic Synct usage example
 */
import { SynctManager } from '../src/SynctManager';

interface UserState {
  name: string;
  age: number;
  email: string;
}

// Create state manager
const stateManager = new SynctManager<UserState>({
  name: 'John Doe',
  age: 30,
  email: 'john@example.com'
});

// Subscribe to state changes
const unsubscribe = stateManager.subscribe((state, event) => {
  console.log('State changed:', state);
  console.log('Change type:', event.changeType);
  console.log('Previous state:', event.previousState);
});

// Subscribe to specific property
stateManager.subscribeToProperty('name', (newValue, oldValue) => {
  console.log(`Name changed: ${oldValue} -> ${newValue}`);
});

// Update state
console.log('\n--- Updating name ---');
stateManager.setState({ name: 'Jane Doe' });

// Update specific property
console.log('\n--- Updating age ---');
stateManager.setProperty('age', 31);

// Undo
console.log('\n--- Undoing ---');
stateManager.undo();
console.log('Current state:', stateManager.getState());

// Redo
console.log('\n--- Redoing ---');
stateManager.redo();
console.log('Current state:', stateManager.getState());

// Get history
console.log('\n--- History ---');
const history = stateManager.getHistory();
console.log(`History entries: ${history.length}`);
history.forEach((entry, index) => {
  console.log(`${index}: ${entry.metadata.action || 'update'} at ${new Date(entry.metadata.timestamp).toISOString()}`);
});

// Cleanup
unsubscribe();
























