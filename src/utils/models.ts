/**
 * Model configuration and recommendation utilities
 */

/**
 * Represents a model available in WebLLM
 */
export interface ModelInfo {
  /** WebLLM model ID */
  id: string;
  /** Display name for the model */
  name: string;
  /** Size category (small, medium, large) */
  size: 'small' | 'medium' | 'large';
  /** VRAM required in MB */
  vramMB: number;
  /** Brief description of the model */
  description: string;
  /** Whether this is a low-resource model */
  lowResource: boolean;
  /** Shader type required (f16 or f32) */
  shaderType: 'f16' | 'f32';
}

/**
 * Error information for model loading failures
 */
export interface ModelLoadError {
  /** The model that failed to load */
  failedModelId: string;
  /** Error message */
  message: string;
  /** Suggested smaller model to try */
  suggestedModel: ModelInfo | null;
}

/**
 * Available models sorted by VRAM requirements
 * Models are grouped by shader type (f32 first for better compatibility, then f16)
 */
export const AVAILABLE_MODELS: ModelInfo[] = [
  // F32 models (better compatibility, work without shader-f16 support)
  {
    id: 'Llama-3.2-1B-Instruct-q4f32_1-MLC',
    name: 'Llama 3.2 1B (f32)',
    size: 'small',
    vramMB: 1130,
    description: 'Modern small model from Meta (f32, compatible)',
    lowResource: true,
    shaderType: 'f32',
  },
  {
    id: 'Llama-3.2-3B-Instruct-q4f32_1-MLC',
    name: 'Llama 3.2 3B (f32)',
    size: 'medium',
    vramMB: 2950,
    description: 'Medium model with better reasoning (f32, compatible)',
    lowResource: true,
    shaderType: 'f32',
  },
  {
    id: 'Phi-3.5-mini-instruct-q4f32_1-MLC',
    name: 'Phi 3.5 Mini (f32)',
    size: 'medium',
    vramMB: 3200,
    description: 'High-quality medium model from Microsoft (f32)',
    lowResource: true,
    shaderType: 'f32',
  },
  {
    id: 'Llama-3.1-8B-Instruct-q4f32_1-MLC-1k',
    name: 'Llama 3.1 8B (1k, f32)',
    size: 'large',
    vramMB: 5300,
    description: 'Large model (shorter context, f32 compatible)',
    lowResource: true,
    shaderType: 'f32',
  },
  {
    id: 'Llama-3.1-8B-Instruct-q4f32_1-MLC',
    name: 'Llama 3.1 8B (f32)',
    size: 'large',
    vramMB: 6100,
    description: 'Large model with excellent quality (f32, more memory)',
    lowResource: false,
    shaderType: 'f32',
  },
  // F16 models (require shader-f16 support, more efficient)
  {
    id: 'SmolLM2-360M-Instruct-q4f16_1-MLC',
    name: 'SmolLM2-360M',
    size: 'small',
    vramMB: 376.06,
    description: 'Smallest model, fastest responses (needs shader-f16)',
    lowResource: true,
    shaderType: 'f16',
  },
  {
    id: 'TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC-1k',
    name: 'TinyLlama-1.1B',
    size: 'small',
    vramMB: 675.24,
    description: 'Small model with better quality (needs shader-f16)',
    lowResource: true,
    shaderType: 'f16',
  },
  {
    id: 'Llama-3.2-1B-Instruct-q4f16_1-MLC',
    name: 'Llama 3.2 1B',
    size: 'small',
    vramMB: 879.04,
    description: 'Modern small model from Meta (needs shader-f16)',
    lowResource: true,
    shaderType: 'f16',
  },
  {
    id: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC',
    name: 'Qwen 2.5 1.5B',
    size: 'small',
    vramMB: 1629.75,
    description: 'High quality small model (needs shader-f16)',
    lowResource: true,
    shaderType: 'f16',
  },
  {
    id: 'Llama-3.2-3B-Instruct-q4f16_1-MLC',
    name: 'Llama 3.2 3B',
    size: 'medium',
    vramMB: 2263.69,
    description: 'Medium model with better reasoning (needs shader-f16)',
    lowResource: true,
    shaderType: 'f16',
  },
  {
    id: 'Qwen2.5-3B-Instruct-q4f16_1-MLC',
    name: 'Qwen 2.5 3B',
    size: 'medium',
    vramMB: 2504.76,
    description: 'Excellent medium-sized model (needs shader-f16)',
    lowResource: true,
    shaderType: 'f16',
  },
  {
    id: 'Phi-3.5-mini-instruct-q4f16_1-MLC-1k',
    name: 'Phi 3.5 Mini',
    size: 'medium',
    vramMB: 2520.07,
    description: 'High-quality medium model from Microsoft (needs shader-f16)',
    lowResource: true,
    shaderType: 'f16',
  },
  {
    id: 'Llama-3.1-8B-Instruct-q4f16_1-MLC-1k',
    name: 'Llama 3.1 8B (1k)',
    size: 'large',
    vramMB: 4598.34,
    description: 'Large model (shorter context, needs shader-f16)',
    lowResource: true,
    shaderType: 'f16',
  },
  {
    id: 'Llama-3.1-8B-Instruct-q4f16_1-MLC',
    name: 'Llama 3.1 8B',
    size: 'large',
    vramMB: 5001,
    description: 'Large model with excellent quality (needs shader-f16)',
    lowResource: false,
    shaderType: 'f16',
  },
  {
    id: 'Qwen2.5-7B-Instruct-q4f16_1-MLC',
    name: 'Qwen 2.5 7B',
    size: 'large',
    vramMB: 5106.67,
    description: 'High-quality large model for complex tasks (needs shader-f16)',
    lowResource: false,
    shaderType: 'f16',
  },
];

/**
 * Get models available for the current GPU capabilities
 * @param supportsShaderF16 Whether the GPU supports shader-f16
 * @param limitForMobile Whether to limit models for mobile devices (defaults to false)
 * @returns Array of compatible models
 */
export function getAvailableModels(
  supportsShaderF16: boolean,
  limitForMobile: boolean = false
): ModelInfo[] {
  let models = supportsShaderF16
    ? AVAILABLE_MODELS
    : AVAILABLE_MODELS.filter((m) => m.shaderType === 'f32');

  // On mobile devices, limit to the 3 smallest models to prevent memory issues
  if (limitForMobile) {
    models = models.slice(0, 3);
  }

  return models;
}

/**
 * Get model information by ID
 */
export function getModelById(modelId: string): ModelInfo | undefined {
  return AVAILABLE_MODELS.find((m) => m.id === modelId);
}

/**
 * Estimate available GPU memory
 * Note: WebGPU doesn't provide direct VRAM info, so we use heuristics
 */
export async function estimateAvailableVRAM(): Promise<number> {
  try {
    if (typeof navigator === 'undefined' || !navigator.gpu) {
      return 0;
    }

    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
      return 0;
    }

    // WebGPU doesn't expose VRAM directly, so we use conservative estimates
    // based on common GPU configurations and device memory
    const deviceMemory =
      'deviceMemory' in navigator && typeof navigator.deviceMemory === 'number'
        ? navigator.deviceMemory
        : undefined;

    if (deviceMemory) {
      // If device memory API is available, estimate VRAM
      // Conservative estimate: assume 25-50% of device RAM is available for GPU
      if (deviceMemory <= 4) {
        return 2000; // Low-end device: ~2GB VRAM
      } else if (deviceMemory <= 8) {
        return 4000; // Mid-range: ~4GB VRAM
      } else {
        return 8000; // High-end: ~8GB+ VRAM
      }
    }

    // Default conservative estimate for unknown devices
    return 4000; // Assume 4GB VRAM as a safe middle ground
  } catch {
    return 4000; // Default if detection fails
  }
}

/**
 * Recommend a model based on available resources
 * @param supportsShaderF16 Whether the GPU supports shader-f16
 * @param limitForMobile Whether to limit models for mobile devices
 */
export async function recommendModel(
  supportsShaderF16: boolean = true,
  limitForMobile: boolean = false
): Promise<ModelInfo> {
  const availableVRAM = await estimateAvailableVRAM();

  // Get models compatible with the GPU shader support
  const compatibleModels = getAvailableModels(supportsShaderF16, limitForMobile);

  // Find the largest model that fits in available VRAM
  // with a conservative safety margin (use only 60% of available VRAM)
  // This is more conservative to prevent crashes with larger models
  const safeVRAM = availableVRAM * 0.6;

  // Filter models that fit in available VRAM
  const fittingModels = compatibleModels.filter((m) => m.vramMB <= safeVRAM);

  if (fittingModels.length === 0) {
    // If no models fit, return the smallest compatible one
    return compatibleModels[0];
  }

  // Return the largest compatible model
  return fittingModels[fittingModels.length - 1];
}

/**
 * Get the next smaller model than the current one
 * Used for fallback when a model fails to load
 * @param currentModelId Current model ID
 * @param supportsShaderF16 Whether the GPU supports shader-f16
 * @param limitForMobile Whether to limit models for mobile devices
 */
export function getNextSmallerModel(
  currentModelId: string,
  supportsShaderF16: boolean = true,
  limitForMobile: boolean = false
): ModelInfo | null {
  const availableModels = getAvailableModels(supportsShaderF16, limitForMobile);
  const currentIndex = availableModels.findIndex((m) => m.id === currentModelId);

  if (currentIndex <= 0) {
    // Already at smallest model or model not found
    return null;
  }

  // Return the previous model in the list (which is smaller)
  return availableModels[currentIndex - 1];
}

/**
 * Get the smallest available model
 * @param supportsShaderF16 Whether the GPU supports shader-f16
 * @param limitForMobile Whether to limit models for mobile devices
 */
export function getSmallestModel(
  supportsShaderF16: boolean = true,
  limitForMobile: boolean = false
): ModelInfo {
  const availableModels = getAvailableModels(supportsShaderF16, limitForMobile);
  return availableModels[0];
}
