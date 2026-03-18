/**
 * Interactive Demo - Play with Synct in real-time!
 * 
 * Usage: npx ts-node test/interactive-demo.ts
 */

import * as readline from 'readline';
import { SynctManager } from '../src/SynctManager';

interface DemoState {
  name: string;
  age: number;
  items: string[];
  count: number;
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const stateManager = new SynctManager<DemoState>({
  name: 'Synct',
  age: 0,
  items: [],
  count: 0,
}, {
  enableChangePathTracking: true,
  enableAsyncTracking: true,
});

// Subscribe to all changes
stateManager.subscribe((state, event) => {
  console.log('\n📊 State Updated!');
  console.log(`   State:`, state);
  console.log(`   Changed: ${event.changePath?.join(', ') || 'N/A'}`);
  console.log(`   Action: ${event.actionContext?.name || 'N/A'}`);
});

console.log('🎮 Synct Interactive Demo\n');
console.log('Commands:');
console.log('  set name <value>  - Set name');
console.log('  set age <number>  - Set age');
console.log('  add <item>        - Add item to list');
console.log('  remove <index>    - Remove item by index');
console.log('  inc               - Increment count');
console.log('  dec               - Decrement count');
console.log('  undo              - Undo last change');
console.log('  redo              - Redo last change');
console.log('  history           - Show history');
console.log('  chain             - Show action chain');
console.log('  state             - Show current state');
console.log('  help              - Show this help');
console.log('  exit              - Exit demo\n');

function showState() {
  console.log('\n📦 Current State:');
  console.log(JSON.stringify(stateManager.getState(), null, 2));
}

function showHistory() {
  const history = stateManager.getHistory();
  console.log(`\n📜 History (${history.length} entries):`);
  history.forEach((entry, index) => {
    const isCurrent = index === stateManager.getHistoryIndex();
    console.log(
      `${isCurrent ? '👉' : '  '} ${index}: ${entry.metadata.action || 'update'} at ${new Date(entry.metadata.timestamp).toLocaleTimeString()}`
    );
  });
}

function showChain() {
  const chain = stateManager.getActionChain();
  console.log(`\n🔗 Action Chain (${chain.length} actions):`);
  chain.forEach((action, index) => {
    console.log(`  ${index + 1}. ${action.name} (${action.id})`);
  });
}

function prompt() {
  rl.question('\n> ', (input) => {
    const [command, ...args] = input.trim().split(' ');

    try {
      switch (command) {
        case 'set':
          if (args[0] === 'name') {
            stateManager.setProperty('name', args.slice(1).join(' '), {
              action: 'setName',
              description: `Set name to ${args.slice(1).join(' ')}`,
            });
          } else if (args[0] === 'age') {
            stateManager.setProperty('age', parseInt(args[1]) || 0, {
              action: 'setAge',
              description: `Set age to ${args[1]}`,
            });
          } else {
            console.log('❌ Usage: set name <value> or set age <number>');
          }
          break;

        case 'add':
          if (args.length > 0) {
            const item = args.join(' ');
            stateManager.setState({
              items: [...stateManager.state.items, item],
            }, {
              action: 'addItem',
              description: `Add item: ${item}`,
            });
          } else {
            console.log('❌ Usage: add <item>');
          }
          break;

        case 'remove':
          const index = parseInt(args[0]);
          if (!isNaN(index) && index >= 0 && index < stateManager.state.items.length) {
            const newItems = [...stateManager.state.items];
            newItems.splice(index, 1);
            stateManager.setState({ items: newItems }, {
              action: 'removeItem',
              description: `Remove item at index ${index}`,
            });
          } else {
            console.log('❌ Invalid index');
          }
          break;

        case 'inc':
          stateManager.setProperty('count', stateManager.state.count + 1, {
            action: 'increment',
          });
          break;

        case 'dec':
          stateManager.setProperty('count', stateManager.state.count - 1, {
            action: 'decrement',
          });
          break;

        case 'undo':
          if (stateManager.canUndo()) {
            stateManager.undo();
            console.log('✅ Undone!');
          } else {
            console.log('❌ Nothing to undo');
          }
          break;

        case 'redo':
          if (stateManager.canRedo()) {
            stateManager.redo();
            console.log('✅ Redone!');
          } else {
            console.log('❌ Nothing to redo');
          }
          break;

        case 'history':
          showHistory();
          break;

        case 'chain':
          showChain();
          break;

        case 'state':
          showState();
          break;

        case 'help':
          console.log('\nCommands:');
          console.log('  set name <value>  - Set name');
          console.log('  set age <number>  - Set age');
          console.log('  add <item>        - Add item to list');
          console.log('  remove <index>    - Remove item by index');
          console.log('  inc               - Increment count');
          console.log('  dec               - Decrement count');
          console.log('  undo              - Undo last change');
          console.log('  redo              - Redo last change');
          console.log('  history           - Show history');
          console.log('  chain             - Show action chain');
          console.log('  state             - Show current state');
          console.log('  help              - Show this help');
          console.log('  exit              - Exit demo');
          break;

        case 'exit':
        case 'quit':
          console.log('\n👋 Goodbye!');
          rl.close();
          process.exit(0);
          break;

        default:
          console.log(`❌ Unknown command: ${command}. Type 'help' for commands.`);
      }
    } catch (error) {
      console.error('❌ Error:', error);
    }

    prompt();
  });
}

// Show initial state
showState();
prompt();
























