import { TachyoManager } from '../src/TachyoManager';
import { devTools } from '../src/utils/devtools';

// Mock DevTools
(globalThis as Record<string, unknown>).window = {
  __REDUX_DEVTOOLS_EXTENSION__: {
    connect: () => ({
      init: () => {},
      send: () => {},
      subscribe: () => () => {},
      unsubscribe: () => {}
    })
  }
};

devTools['connect']();

const store = new TachyoManager({ count: 0 });

async function bench() {
  const start = performance.now();
  for (let i = 0; i < 100000; i++) {
    store.setState({ count: i });
  }
  const end = performance.now();
  const ops = 100000 / ((end - start) / 1000);
  console.log(`With DevTools Connected: ${Math.round(ops).toLocaleString()} ops/sec`);
}

bench();
