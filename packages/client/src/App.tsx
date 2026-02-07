import { useGameClient } from '@party-kit/client';
import { gameReducer, initialState } from '@my-game/shared';

export default function App() {
  const { state, sendAction, status } = useGameClient({
    reducer: gameReducer,
    initialState,
    debug: true,
  });

  const handleBuzz = () => {
    sendAction({ type: 'BUZZ' });
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      backgroundColor: '#1a1a1a',
      color: 'white',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <h1 style={{ marginBottom: '2rem' }}>Buzz Controller</h1>
      
      <button 
        onClick={handleBuzz}
        style={{
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          border: 'none',
          backgroundColor: '#ef4444',
          color: 'white',
          fontSize: '2rem',
          fontWeight: 'bold',
          cursor: 'pointer',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
          transition: 'transform 0.1s',
        }}
        onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
        onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
        onTouchStart={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
        onTouchEnd={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        PRESS ME
      </button>

      <div style={{ marginTop: '2rem', fontSize: '1.5rem' }}>
        Current Score: {state.score}
      </div>

      <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: status === 'connected' ? '#4ade80' : '#ef4444' }}>
        WS: {status}
      </div>
    </div>
  );
}
