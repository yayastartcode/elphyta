import { useParams } from 'react-router-dom';
import Game from './Game';
import ErrorBoundary from '../components/ErrorBoundary';

export default function GameWrapper() {
  const { mode, level } = useParams<{ mode: 'truth' | 'dare'; level: string }>();
  
  if (!mode || !level) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-400 to-red-600 flex items-center justify-center">
        <div className="text-white pixel-text text-xl">PARAMETER TIDAK VALID</div>
      </div>
    );
  }
  
  return (
    <ErrorBoundary>
      <Game mode={mode} level={parseInt(level)} />
    </ErrorBoundary>
  );
}