import { useState, useEffect } from 'react';
import type { ModelInfo } from '../utils/models';
import { getAvailableModels, recommendModel, estimateAvailableVRAM } from '../utils/models';
import { checkGPUSupport } from '../utils/gpu';
import { shouldUseLowResourceMode } from '../utils/device';
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
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([]);
  const [supportsShaderF16, setSupportsShaderF16] = useState<boolean>(true);

  useEffect(() => {
    async function detectResources() {
      try {
        // Check if device should use low resource mode (mobile phones)
        const limitForMobile = shouldUseLowResourceMode();

        // Check GPU support and shader-f16 capability
        const gpuStatus = await checkGPUSupport();
        const shaderF16Support = gpuStatus.supportsShaderF16;
        setSupportsShaderF16(shaderF16Support);

        // Get models compatible with the GPU and device type
        const models = getAvailableModels(shaderF16Support, limitForMobile);
        setAvailableModels(models);

        // Estimate VRAM
        const vram = await estimateAvailableVRAM();
        setAvailableVRAM(vram);

        // Get recommended model based on VRAM and shader support
        const recommended = await recommendModel(shaderF16Support, limitForMobile);
        setRecommendedModelId(recommended.id);
      } catch (err) {
        console.error('Failed to detect resources:', err);
        // Default to f32 models on error for better compatibility
        const limitForMobile = shouldUseLowResourceMode();
        const fallbackModels = getAvailableModels(false, limitForMobile);
        setAvailableModels(fallbackModels);
        setRecommendedModelId(fallbackModels[0].id);
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
    const shaderInfo = supportsShaderF16 ? 'shader-f16 supported' : 'f32 only (no shader-f16)';
    return `Estimated GPU Memory: ~${vramGB}GB (${shaderInfo})`;
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
        {availableModels.map((model) => (
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
                onClick={() => onModelSelect(recommendedModelId)}
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
