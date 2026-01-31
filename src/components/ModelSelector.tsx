import { useState, useEffect } from 'react';
import type { ModelInfo } from '../utils/models';
import { AVAILABLE_MODELS, recommendModel, estimateAvailableVRAM } from '../utils/models';
import './ModelSelector.css';

interface ModelSelectorProps {
  /** Currently selected model ID */
  selectedModelId: string;
  /** Callback when model is selected */
  onModelSelect: (modelId: string) => void;
  /** Whether the selector is disabled */
  disabled?: boolean;
}

/**
 * Component for selecting AI models with recommendations
 */
export function ModelSelector({ selectedModelId, onModelSelect, disabled }: ModelSelectorProps) {
  const [recommendedModelId, setRecommendedModelId] = useState<string | null>(null);
  const [availableVRAM, setAvailableVRAM] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function detectResources() {
      try {
        const vram = await estimateAvailableVRAM();
        setAvailableVRAM(vram);

        const recommended = await recommendModel();
        setRecommendedModelId(recommended.id);
      } catch (err) {
        console.error('Failed to detect resources:', err);
        // Default to smallest model on error
        setRecommendedModelId(AVAILABLE_MODELS[0].id);
      } finally {
        setIsLoading(false);
      }
    }

    detectResources();
  }, []);

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onModelSelect(event.target.value);
  };

  const getResourceDescription = () => {
    if (availableVRAM === 0) {
      return 'No GPU detected - models may not work';
    }
    const vramGB = (availableVRAM / 1024).toFixed(1);
    return `Estimated GPU Memory: ~${vramGB}GB`;
  };

  const isRecommended = (model: ModelInfo) => {
    return model.id === recommendedModelId;
  };

  return (
    <div className="model-selector" data-testid="model-selector">
      <label htmlFor="model-select" className="model-selector-label">
        Select AI Model:
      </label>
      <select
        id="model-select"
        className="model-selector-dropdown"
        value={selectedModelId}
        onChange={handleChange}
        disabled={disabled || isLoading}
        data-testid="model-select-dropdown"
      >
        {AVAILABLE_MODELS.map((model) => (
          <option key={model.id} value={model.id}>
            {model.name} - {model.description}
            {isRecommended(model) ? ' ⭐ Recommended' : ''}
          </option>
        ))}
      </select>
      <div className="model-selector-info">
        {isLoading ? (
          <span className="model-info-text">Detecting resources...</span>
        ) : (
          <>
            <span className="model-info-text">{getResourceDescription()}</span>
            {recommendedModelId && selectedModelId !== recommendedModelId && (
              <button
                className="use-recommended-button"
                onClick={() => recommendedModelId && onModelSelect(recommendedModelId)}
                disabled={disabled}
                data-testid="use-recommended-button"
              >
                Use Recommended
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default ModelSelector;
