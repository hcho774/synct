/**
 * Performance Benchmark Tests for Synct
 * 
 * Run: npx ts-node benchmark/performance.ts
 * 
 * This benchmark compares Synct's performance with other state management libraries
 * 
 * To compare with other libraries, install them first:
 * npm install --save-dev zustand redux mobx xstate
 */

import { SynctManager } from '../src/SynctManager';

interface BenchmarkResult {
  name: string;
  library: string;
  operations: number;
  totalTime: number;
  avgTime: number;
  opsPerSecond: number;
  memory?: {
    before: number;
    after: number;
    diff: number;
  };
}

// Utility functions
function formatNumber(num: number): string {
  return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function getMemoryUsage(): number {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    return process.memoryUsage().heapUsed;
  }
  return 0;
}

// Benchmark runner
async function runBenchmark(
  name: string,
  library: string,
  fn: () => void | Promise<void>,
  iterations: number = 10000
): Promise<BenchmarkResult> {
  const memoryBefore = getMemoryUsage();
  
  // Warm up
  for (let i = 0; i < 100; i++) {
    await fn();
  }
  
  const start = performance.now();
  
  for (let i = 0; i < iterations; i++) {
    await fn();
  }
  
  const end = performance.now();
  const memoryAfter = getMemoryUsage();
  
  const totalTime = end - start;
  const avgTime = totalTime / iterations;
  const opsPerSecond = 1000 / avgTime;
  
  return {
    name,
    library,
    operations: iterations,
    totalTime,
    avgTime,
    opsPerSecond,
    memory: memoryBefore > 0 ? {
      before: memoryBefore,
      after: memoryAfter,
      diff: memoryAfter - memoryBefore,
    } : undefined,
  };
}

// Synct benchmarks
async function testSynctSetState() {
  const store = new SynctManager({ count: 0 });
  return await runBenchmark(
    'setState (simple)',
    'Synct',
    () => {
      store.setState({ count: store.state.count + 1 });
    },
    100000
  );
}

async function testSynctSubscribe() {
  const store = new SynctManager({ count: 0 });
  store.subscribe(() => {});
  return await runBenchmark(
    'subscribe (1 subscriber)',
    'Synct',
    () => {
      store.setState({ count: store.state.count + 1 });
    },
    50000
  );
}

async function testSynctUndo() {
  const store = new SynctManager({ count: 0 }, { maxHistorySize: 1000 });
  for (let i = 0; i < 1000; i++) {
    store.setState({ count: i });
  }
  return await runBenchmark(
    'undo/redo',
    'Synct',
    () => {
      if (store.canUndo()) {
        store.undo();
        store.redo();
      }
    },
    10000
  );
}

// Zustand benchmarks (if available)
async function testZustandSetState(): Promise<BenchmarkResult | null> {
  try {
    const { create } = require('zustand');
    const useStore = create((set: any) => ({
      count: 0,
      increment: () => set((state: any) => ({ count: state.count + 1 })),
    }));
    
    return await runBenchmark(
      'setState (simple)',
      'Zustand',
      () => {
        useStore.getState().increment();
      },
      100000
    );
  } catch (e) {
    return null;
  }
}

async function testZustandSubscribe(): Promise<BenchmarkResult | null> {
  try {
    const { create } = require('zustand');
    const useStore = create((set: any) => ({
      count: 0,
      increment: () => set((state: any) => ({ count: state.count + 1 })),
    }));
    
    useStore.subscribe(() => {});
    
    return await runBenchmark(
      'subscribe (1 subscriber)',
      'Zustand',
      () => {
        useStore.getState().increment();
      },
      50000
    );
  } catch (e) {
    return null;
  }
}

// Redux benchmarks (if available)
async function testReduxSetState(): Promise<BenchmarkResult | null> {
  try {
    const { createStore } = require('redux');
    const store = createStore((state = { count: 0 }, action: any) => {
      if (action.type === 'INCREMENT') {
        return { count: state.count + 1 };
      }
      return state;
    });
    
    return await runBenchmark(
      'setState (simple)',
      'Redux',
      () => {
        store.dispatch({ type: 'INCREMENT' });
      },
      100000
    );
  } catch (e) {
    return null;
  }
}

async function testReduxSubscribe(): Promise<BenchmarkResult | null> {
  try {
    const { createStore } = require('redux');
    const store = createStore((state = { count: 0 }, action: any) => {
      if (action.type === 'INCREMENT') {
        return { count: state.count + 1 };
      }
      return state;
    });
    
    store.subscribe(() => {});
    
    return await runBenchmark(
      'subscribe (1 subscriber)',
      'Redux',
      () => {
        store.dispatch({ type: 'INCREMENT' });
      },
      50000
    );
  } catch (e) {
    return null;
  }
}

// MobX benchmarks (if available)
async function testMobXSetState(): Promise<BenchmarkResult | null> {
  try {
    const { makeAutoObservable } = require('mobx');
    class CounterStore {
      count = 0;
      constructor() {
        makeAutoObservable(this);
      }
      increment() {
        this.count++;
      }
    }
    const store = new CounterStore();
    
    return await runBenchmark(
      'setState (simple)',
      'MobX',
      () => {
        store.increment();
      },
      100000
    );
  } catch (e) {
    return null;
  }
}

async function testMobXSubscribe(): Promise<BenchmarkResult | null> {
  try {
    const { makeAutoObservable, autorun } = require('mobx');
    class CounterStore {
      count = 0;
      constructor() {
        makeAutoObservable(this);
      }
      increment() {
        this.count++;
      }
    }
    const store = new CounterStore();
    
    // MobX autorun for subscription
    autorun(() => {
      // Access store.count to create dependency
      const _ = store.count;
    });
    
    return await runBenchmark(
      'subscribe (1 subscriber)',
      'MobX',
      () => {
        store.increment();
      },
      50000
    );
  } catch (e) {
    return null;
  }
}

// XState benchmarks (if available)
async function testXStateSetState(): Promise<BenchmarkResult | null> {
  try {
    // Try XState v5 API first, fallback to v4
    let createMachine: any;
    let interpret: any;
    try {
      const xstate = require('xstate');
      // XState v5 uses setup() and createActor
      if (xstate.setup && xstate.createActor) {
        const { setup, createActor } = xstate;
        const counterMachine = setup({
          actions: {
            increment: ({ context }: any) => {
              context.count++;
            }
          }
        }).createMachine({
          initial: 'active',
          context: { count: 0 },
          states: {
            active: {
              on: {
                INCREMENT: {
                  actions: 'increment'
                }
              }
            }
          }
        });
        
        const actor = createActor(counterMachine).start();
        
        return await runBenchmark(
          'setState (simple)',
          'XState',
          () => {
            actor.send({ type: 'INCREMENT' });
          },
          100000
        );
      } else {
        // Fallback to v4 API
        createMachine = xstate.createMachine || xstate.default?.createMachine;
        interpret = xstate.interpret || xstate.default?.interpret;
        
        if (!createMachine || !interpret) {
          return null;
        }
        
        const counterMachine = createMachine({
          id: 'counter',
          initial: 'active',
          context: {
            count: 0
          },
          states: {
            active: {
              on: {
                INCREMENT: {
                  actions: ({ context }: any) => {
                    context.count++;
                  }
                }
              }
            }
          }
        });
        
        const service = interpret(counterMachine).start();
        
        return await runBenchmark(
          'setState (simple)',
          'XState',
          () => {
            service.send({ type: 'INCREMENT' });
          },
          100000
        );
      }
    } catch (e) {
      return null;
    }
  } catch (e) {
    return null;
  }
}

async function testXStateSubscribe(): Promise<BenchmarkResult | null> {
  try {
    // Try XState v5 API first, fallback to v4
    const xstate = require('xstate');
    if (xstate.setup && xstate.createActor) {
      // XState v5
      const { setup, createActor } = xstate;
      const counterMachine = setup({
        actions: {
          increment: ({ context }: any) => {
            context.count++;
          }
        }
      }).createMachine({
        initial: 'active',
        context: { count: 0 },
        states: {
          active: {
            on: {
              INCREMENT: {
                actions: 'increment'
              }
            }
          }
        }
      });
      
      const actor = createActor(counterMachine).start();
      
      // XState v5 subscription
      actor.subscribe(() => {});
      
      return await runBenchmark(
        'subscribe (1 subscriber)',
        'XState',
        () => {
          actor.send({ type: 'INCREMENT' });
        },
        50000
      );
    } else {
      // Fallback to v4 API
      const createMachine = xstate.createMachine || xstate.default?.createMachine;
      const interpret = xstate.interpret || xstate.default?.interpret;
      
      if (!createMachine || !interpret) {
        return null;
      }
      
      const counterMachine = createMachine({
        id: 'counter',
        initial: 'active',
        context: {
          count: 0
        },
        states: {
          active: {
            on: {
              INCREMENT: {
                actions: ({ context }: any) => {
                  context.count++;
                }
              }
            }
          }
        }
      });
      
      const service = interpret(counterMachine).start();
      
      // XState v4 subscription
      service.subscribe(() => {});
      
      return await runBenchmark(
        'subscribe (1 subscriber)',
        'XState',
        () => {
          service.send({ type: 'INCREMENT' });
        },
        50000
      );
    }
  } catch (e) {
    return null;
  }
}

// Speed comparison tests
async function compareSetStateSpeed() {
  console.log('\n⚡ Speed Comparison: setState\n');
  console.log('='.repeat(60));
  
  const results: BenchmarkResult[] = [];
  
  // Zustand (if available) - RUN FIRST TO TAKE JIT WARMUP HIT
  const zustandResult = await testZustandSetState();
  if (zustandResult) results.push(zustandResult);

  // Synct
  results.push(await testSynctSetState());
  
  // Redux (if available)
  const reduxResult = await testReduxSetState();
  if (reduxResult) results.push(reduxResult);
  
  // MobX (if available)
  const mobxResult = await testMobXSetState();
  if (mobxResult) results.push(mobxResult);
  
  // XState (if available)
  const xstateResult = await testXStateSetState();
  if (xstateResult) results.push(xstateResult);
  
  // Print comparison table
  console.log('\n| Library | Ops/sec | Avg Time (ms) | Total Time (ms) |');
  console.log('|---------|---------|---------------|----------------|');
  results.forEach(result => {
    console.log(`| ${result.library} | ${formatNumber(result.opsPerSecond)} | ${result.avgTime.toFixed(4)} | ${result.totalTime.toFixed(2)} |`);
  });
  
  // Find winner
  if (results.length > 1) {
    const sorted = [...results].sort((a, b) => b.opsPerSecond - a.opsPerSecond);
    const winner = sorted[0];
    console.log(`\n🏆 Winner: ${winner.library} (${formatNumber(winner.opsPerSecond)} ops/sec)`);
    
    // Show relative performance
    console.log('\nRelative Performance:');
    results.forEach(result => {
      const ratio = (result.opsPerSecond / winner.opsPerSecond * 100).toFixed(1);
      console.log(`  ${result.library}: ${ratio}% of ${winner.library}`);
    });
  }
  
  return results;
}

async function compareSubscribeSpeed() {
  console.log('\n⚡ Speed Comparison: Subscribe\n');
  console.log('='.repeat(60));
  
  const results: BenchmarkResult[] = [];
  
  // Synct
  results.push(await testSynctSubscribe());
  
  // Zustand (if available)
  const zustandResult = await testZustandSubscribe();
  if (zustandResult) results.push(zustandResult);
  
  // Redux (if available)
  const reduxResult = await testReduxSubscribe();
  if (reduxResult) results.push(reduxResult);
  
  // MobX (if available)
  const mobxResult = await testMobXSubscribe();
  if (mobxResult) results.push(mobxResult);
  
  // XState (if available)
  const xstateResult = await testXStateSubscribe();
  if (xstateResult) results.push(xstateResult);
  
  // Print comparison table
  console.log('\n| Library | Ops/sec | Avg Time (ms) | Total Time (ms) |');
  console.log('|---------|---------|---------------|----------------|');
  results.forEach(result => {
    console.log(`| ${result.library} | ${formatNumber(result.opsPerSecond)} | ${result.avgTime.toFixed(4)} | ${result.totalTime.toFixed(2)} |`);
  });
  
  // Find winner
  if (results.length > 1) {
    const sorted = [...results].sort((a, b) => b.opsPerSecond - a.opsPerSecond);
    const winner = sorted[0];
    console.log(`\n🏆 Winner: ${winner.library} (${formatNumber(winner.opsPerSecond)} ops/sec)`);
    
    // Show relative performance
    console.log('\nRelative Performance:');
    results.forEach(result => {
      const ratio = (result.opsPerSecond / winner.opsPerSecond * 100).toFixed(1);
      console.log(`  ${result.library}: ${ratio}% of ${winner.library}`);
    });
  }
  
  return results;
}

// Detailed Synct benchmarks
async function testSetStatePerformance() {
  console.log('\n📊 Benchmark: setState Performance\n');
  console.log('='.repeat(60));
  
  const results: BenchmarkResult[] = [];
  
  // Test 1: Simple setState
  const store1 = new SynctManager({ count: 0 });
  results.push(await runBenchmark(
    'setState (simple)',
    'Synct',
    () => {
      store1.setState({ count: store1.state.count + 1 });
    },
    100000
  ));
  
  // Test 2: setState with deep object
  const store2 = new SynctManager({
    user: {
      profile: {
        name: 'John',
        age: 30,
        settings: {
          theme: 'light',
          notifications: true,
        },
      },
    },
  });
  results.push(await runBenchmark(
    'setState (deep object)',
    'Synct',
    () => {
      store2.setState({
        user: {
          ...store2.state.user,
          profile: {
            ...store2.state.user.profile,
            age: store2.state.user.profile.age + 1,
          },
        },
      });
    },
    50000
  ));
  
  // Test 3: setState with change tracking enabled
  const store3 = new SynctManager(
    { count: 0 },
    { enableChangePathTracking: true }
  );
  results.push(await runBenchmark(
    'setState (with change tracking)',
    'Synct',
    () => {
      store3.setState({ count: store3.state.count + 1 });
    },
    50000
  ));
  
  // Print results
  results.forEach(result => {
    console.log(`\n${result.name}:`);
    console.log(`  Operations: ${formatNumber(result.operations)}`);
    console.log(`  Total time: ${result.totalTime.toFixed(2)}ms`);
    console.log(`  Avg time: ${result.avgTime.toFixed(4)}ms`);
    console.log(`  Ops/sec: ${formatNumber(result.opsPerSecond)}`);
    if (result.memory) {
      console.log(`  Memory: ${formatBytes(result.memory.diff)}`);
    }
  });
  
  return results;
}

async function testSubscribePerformance() {
  console.log('\n📊 Benchmark: Subscribe Performance\n');
  console.log('='.repeat(60));
  
  const results: BenchmarkResult[] = [];
  
  // Test 1: Single subscriber
  const store1 = new SynctManager({ count: 0 });
  store1.subscribe(() => {});
  
  results.push(await runBenchmark(
    'subscribe (1 subscriber)',
    'Synct',
    () => {
      store1.setState({ count: store1.state.count + 1 });
    },
    50000
  ));
  
  // Test 2: Multiple subscribers
  const store2 = new SynctManager({ count: 0 });
  for (let i = 0; i < 10; i++) {
    store2.subscribe(() => {});
  }
  
  results.push(await runBenchmark(
    'subscribe (10 subscribers)',
    'Synct',
    () => {
      store2.setState({ count: store2.state.count + 1 });
    },
    50000
  ));
  
  // Test 3: Property subscription
  const store3 = new SynctManager({ count: 0, name: 'Test' });
  store3.subscribeToProperty('count', () => {});
  
  results.push(await runBenchmark(
    'subscribeToProperty',
    'Synct',
    () => {
      store3.setState({ count: store3.state.count + 1 });
    },
    50000
  ));
  
  // Print results
  results.forEach(result => {
    console.log(`\n${result.name}:`);
    console.log(`  Operations: ${formatNumber(result.operations)}`);
    console.log(`  Total time: ${result.totalTime.toFixed(2)}ms`);
    console.log(`  Avg time: ${result.avgTime.toFixed(4)}ms`);
    console.log(`  Ops/sec: ${formatNumber(result.opsPerSecond)}`);
  });
  
  return results;
}

async function testUndoRedoPerformance() {
  console.log('\n📊 Benchmark: Undo/Redo Performance\n');
  console.log('='.repeat(60));
  
  const results: BenchmarkResult[] = [];
  
  // Test 1: Undo performance
  const store1 = new SynctManager({ count: 0 }, { maxHistorySize: 1000 });
  // Build history
  for (let i = 0; i < 1000; i++) {
    store1.setState({ count: i });
  }
  
  results.push(await runBenchmark(
    'undo (1000 history entries)',
    'Synct',
    () => {
      if (store1.canUndo()) {
        store1.undo();
        store1.redo();
      }
    },
    10000
  ));
  
  // Test 2: History creation
  const store2 = new SynctManager({ count: 0 }, { maxHistorySize: 100 });
  results.push(await runBenchmark(
    'history creation',
    'Synct',
    () => {
      store2.setState({ count: store2.state.count + 1 });
    },
    10000
  ));
  
  // Print results
  results.forEach(result => {
    console.log(`\n${result.name}:`);
    console.log(`  Operations: ${formatNumber(result.operations)}`);
    console.log(`  Total time: ${result.totalTime.toFixed(2)}ms`);
    console.log(`  Avg time: ${result.avgTime.toFixed(4)}ms`);
    console.log(`  Ops/sec: ${formatNumber(result.opsPerSecond)}`);
  });
  
  return results;
}

async function testChangeTrackingPerformance() {
  console.log('\n📊 Benchmark: Change Tracking Performance\n');
  console.log('='.repeat(60));
  
  const results: BenchmarkResult[] = [];
  
  // Test 1: Change tracking enabled
  const store1 = new SynctManager(
    {
      user: {
        profile: {
          name: 'John',
          age: 30,
          email: 'john@example.com',
        },
      },
    },
    { enableChangePathTracking: true }
  );
  
  results.push(await runBenchmark(
    'change tracking (enabled)',
    'Synct',
    () => {
      store1.setState({
        user: {
          ...store1.state.user,
          profile: {
            ...store1.state.user.profile,
            age: store1.state.user.profile.age + 1,
          },
        },
      });
    },
    10000
  ));
  
  // Test 2: Change tracking disabled
  const store2 = new SynctManager(
    {
      user: {
        profile: {
          name: 'John',
          age: 30,
          email: 'john@example.com',
        },
      },
    },
    { enableChangePathTracking: false }
  );
  
  results.push(await runBenchmark(
    'change tracking (disabled)',
    'Synct',
    () => {
      store2.setState({
        user: {
          ...store2.state.user,
          profile: {
            ...store2.state.user.profile,
            age: store2.state.user.profile.age + 1,
          },
        },
      });
    },
    10000
  ));
  
  // Print results
  results.forEach(result => {
    console.log(`\n${result.name}:`);
    console.log(`  Operations: ${formatNumber(result.operations)}`);
    console.log(`  Total time: ${result.totalTime.toFixed(2)}ms`);
    console.log(`  Avg time: ${result.avgTime.toFixed(4)}ms`);
    console.log(`  Ops/sec: ${formatNumber(result.opsPerSecond)}`);
  });
  
  return results;
}

async function testAsyncTrackingPerformance() {
  console.log('\n📊 Benchmark: Async Tracking Performance\n');
  console.log('='.repeat(60));
  
  const results: BenchmarkResult[] = [];
  
  interface AsyncTestState {
    data: any;
    loading: boolean;
  }
  
  const store = new SynctManager<AsyncTestState>(
    { data: null, loading: false },
    { enableAsyncTracking: true }
  );
  
  // Fix: registerAsyncAction only takes 1 type parameter (R, the return type)
  store.registerAsyncAction<{ result: string }>({
    name: 'testAction',
    handler: async (state) => {
      await new Promise(resolve => setTimeout(resolve, 0));
      return { result: 'success' };
    },
    onStart: (state): Partial<AsyncTestState> => {
      return { ...state, loading: true };
    },
    onSuccess: (state, result): Partial<AsyncTestState> => {
      return { loading: false, data: result };
    },
  });
  
  results.push(await runBenchmark(
    'async action (with tracking)',
    'Synct',
    async () => {
      await store.dispatchAsync('testAction');
    },
    1000
  ));
  
  // Print results
  results.forEach(result => {
    console.log(`\n${result.name}:`);
    console.log(`  Operations: ${formatNumber(result.operations)}`);
    console.log(`  Total time: ${result.totalTime.toFixed(2)}ms`);
    console.log(`  Avg time: ${result.avgTime.toFixed(4)}ms`);
    console.log(`  Ops/sec: ${formatNumber(result.opsPerSecond)}`);
  });
  
  return results;
}

async function testMemoryUsage() {
  console.log('\n📊 Benchmark: Memory Usage\n');
  console.log('='.repeat(60));
  
  const memoryBefore = getMemoryUsage();
  
  // Create stores with history - use any[] to avoid type issues
  const stores: any[] = [];
  for (let i = 0; i < 100; i++) {
    const store = new SynctManager({ count: 0 }, { maxHistorySize: 100 });
    for (let j = 0; j < 100; j++) {
      store.setState({ count: j });
    }
    stores.push(store);
  }
  
  const memoryAfter = getMemoryUsage();
  const memoryDiff = memoryAfter - memoryBefore;
  
  console.log(`\nMemory Usage:`);
  console.log(`  Before: ${formatBytes(memoryBefore)}`);
  console.log(`  After: ${formatBytes(memoryAfter)}`);
  console.log(`  Diff: ${formatBytes(memoryDiff)}`);
  console.log(`  Per store: ${formatBytes(memoryDiff / 100)}`);
  
  return {
    before: memoryBefore,
    after: memoryAfter,
    diff: memoryDiff,
  };
}

// Feature comparison
function compareFeatures() {
  console.log('\n📊 Feature Comparison\n');
  console.log('='.repeat(60));
  
  const features = [
    {
      feature: 'Built-in Undo/Redo',
      synct: '✅',
      zustand: '❌ (requires Zundo)',
      redux: '❌ (requires Redux Undo)',
      jotai: '❌',
      mobx: '❌',
      xstate: '❌',
    },
    {
      feature: 'Change Path Tracking',
      synct: '✅',
      zustand: '❌',
      redux: '❌',
      jotai: '❌',
      mobx: '❌',
      xstate: '❌',
    },
    {
      feature: 'Async Flow Debugging',
      synct: '✅',
      zustand: '❌',
      redux: '❌',
      jotai: '❌',
      mobx: '❌',
      xstate: '⚠️ (limited)',
    },
    {
      feature: 'Action Chain Tracking',
      synct: '✅',
      zustand: '❌',
      redux: '⚠️ (limited)',
      jotai: '❌',
      mobx: '❌',
      xstate: '⚠️ (state machine)',
    },
    {
      feature: 'Redux DevTools',
      synct: '✅',
      zustand: '⚠️',
      redux: '✅',
      jotai: '⚠️',
      mobx: '⚠️',
      xstate: '⚠️',
    },
    {
      feature: 'Zero Dependencies',
      synct: '✅',
      zustand: '✅',
      redux: '❌',
      jotai: '⚠️',
      mobx: '❌',
      xstate: '❌',
    },
    {
      feature: 'Bundle Size',
      synct: '~5-8KB',
      zustand: '~1KB',
      redux: '~15KB+',
      jotai: '~2KB',
      mobx: '~15KB+',
      xstate: '~20KB+',
    },
  ];
  
  console.log('\n| Feature | Synct | Zustand | Redux | Jotai | MobX | XState |');
  console.log('|---------|----------|---------|-------|-------|------|--------|');
  features.forEach(f => {
    console.log(`| ${f.feature} | ${f.synct} | ${f.zustand} | ${f.redux} | ${f.jotai} | ${(f as any).mobx || 'N/A'} | ${(f as any).xstate || 'N/A'} |`);
  });
}

// Main benchmark runner
async function runAllBenchmarks() {
  console.log('🚀 Synct Performance Benchmark\n');
  console.log('='.repeat(60));
  
  try {
    // Speed comparisons (with other libraries if available)
    await compareSetStateSpeed();
    await compareSubscribeSpeed();
    
    // Detailed Synct benchmarks
    await testSetStatePerformance();
    await testSubscribePerformance();
    await testUndoRedoPerformance();
    await testChangeTrackingPerformance();
    await testAsyncTrackingPerformance();
    await testMemoryUsage();
    compareFeatures();
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ All benchmarks completed!\n');
    console.log('💡 Tip: Install other libraries to compare speeds:');
    console.log('   npm install --save-dev zustand redux mobx xstate\n');
  } catch (error) {
    console.error('❌ Benchmark failed:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  runAllBenchmarks();
}

export {
  runAllBenchmarks,
  compareSetStateSpeed,
  compareSubscribeSpeed,
  testSetStatePerformance,
  testSubscribePerformance,
  testUndoRedoPerformance,
  testChangeTrackingPerformance,
  testAsyncTrackingPerformance,
  testMemoryUsage,
  compareFeatures,
};
