/**
 * Home Page - Model selection and information
 */

import { ModelSelector } from './components';
import { getModelById } from './utils/models';
import type { LLMStatus } from './types/chat';

export interface HomePageProps {
  selectedModelId: string;
  onModelSelect: (modelId: string) => void;
  onLoadModel: () => void;
  cachedModelId: string | null;
  status: LLMStatus;
  gpuInfo: string | null;
}

/**
 * Home page for model selection and basic information
 */
export function HomePage({
  selectedModelId,
  onModelSelect,
  onLoadModel,
  cachedModelId,
  status,
  gpuInfo,
}: HomePageProps) {
  const selectedModel = getModelById(selectedModelId);
  const cachedModel = cachedModelId ? getModelById(cachedModelId) : null;
  const modelDisplayName = selectedModel?.name || 'SmolLM2-360M';

  return (
    <div className="home-page">
      <div className="welcome-screen">
        <div className="welcome-icon">🚀</div>
        <h2>Welcome to TerziAI</h2>
        <p>
          Run AI models locally in your browser. Your conversations stay private and work offline.
        </p>

        {cachedModel && (
          <div className="cached-model-info" data-testid="cached-model-info">
            <div className="info-label">Model in Cache:</div>
            <div className="info-value">{cachedModel.name}</div>
          </div>
        )}

        <ModelSelector
          selectedModelId={selectedModelId}
          onModelSelect={onModelSelect}
          disabled={status === 'loading'}
        />

        <button
          className="start-button"
          onClick={onLoadModel}
          disabled={status === 'loading'}
          data-testid="start-button"
        >
          {cachedModelId && cachedModelId !== selectedModelId
            ? 'Clear Cache & Load Model'
            : 'Load AI Model'}
        </button>

        <p className="model-info">
          Selected: {modelDisplayName}
          {cachedModelId && cachedModelId !== selectedModelId && (
            <span className="warning-text"> (will clear cached model)</span>
          )}
          <br />
          Falls back to demo mode if no GPU is detected
        </p>

        {gpuInfo && (
          <div className="gpu-info" data-testid="gpu-info">
            <span className="info-icon">🖥️</span> {gpuInfo}
          </div>
        )}
      </div>
    </div>
  );
}
