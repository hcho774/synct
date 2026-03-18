/**
 * React example (requires React to be installed)
 * 
 * To run this example:
 * 1. Install React: npm install react react-dom @types/react
 * 2. Use a bundler like Vite or Create React App
 */
import React from 'react';
import { useSynct } from '../src/react/useSynct';

interface CounterState {
  count: number;
  step: number;
}

function CounterApp() {
  const { state, setState, undo, redo, canUndo, canRedo } = useSynct<CounterState>({
    count: 0,
    step: 1
  });

  const increment = () => {
    setState({ count: state.count + state.step });
  };

  const decrement = () => {
    setState({ count: state.count - state.step });
  };

  const changeStep = (step: number) => {
    setState({ step });
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Counter with Undo/Redo</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Count: {state.count}</h2>
        <p>Step: {state.step}</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button onClick={increment} style={{ marginRight: '10px' }}>
          +{state.step}
        </button>
        <button onClick={decrement} style={{ marginRight: '10px' }}>
          -{state.step}
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label>
          Step size:
          <input
            type="number"
            value={state.step}
            onChange={(e) => changeStep(parseInt(e.target.value) || 1)}
            style={{ marginLeft: '10px', width: '60px' }}
          />
        </label>
      </div>

      <div>
        <button
          onClick={undo}
          disabled={!canUndo}
          style={{ marginRight: '10px', opacity: canUndo ? 1 : 0.5 }}
        >
          Undo
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          style={{ opacity: canRedo ? 1 : 0.5 }}
        >
          Redo
        </button>
      </div>
    </div>
  );
}

export default CounterApp;
























