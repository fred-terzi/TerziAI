import type { LoadingProgress } from '../types/chat';
import './LoadingIndicator.css';

interface LoadingIndicatorProps {
  /** Loading progress information */
  progress: LoadingProgress;
  /** Whether to show the indicator */
  visible: boolean;
}

/**
 * Component for showing model loading progress
 */
export function LoadingIndicator({ progress, visible }: LoadingIndicatorProps) {
  if (!visible) return null;

  return (
    <div className="loading-indicator" data-testid="loading-indicator">
      <div className="loading-spinner" aria-hidden="true" />
      <div className="loading-text">{progress.text || 'Initializing...'}</div>
      <div className="loading-progress-bar">
        <div
          className="loading-progress-fill"
          style={{ width: `${progress.progress}%` }}
          role="progressbar"
          aria-valuenow={progress.progress}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      <div className="loading-percentage">{progress.progress}%</div>
    </div>
  );
}

export default LoadingIndicator;
