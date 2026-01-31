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
}

/**
 * Available models sorted by VRAM requirements
 */
export const AVAILABLE_MODELS: ModelInfo[] = [
  {
    id: 'SmolLM2-360M-Instruct-q4f16_1-MLC',
    name: 'SmolLM2-360M',
    size: 'small',
    vramMB: 376.06,
    description: 'Smallest model, fastest responses, good for low-end devices',
    lowResource: true,
  },
  {
    id: 'TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC-1k',
    name: 'TinyLlama-1.1B',
    size: 'small',
    vramMB: 675.24,
    description: 'Small model with better quality than SmolLM',
    lowResource: true,
  },
  {
    id: 'Llama-3.2-1B-Instruct-q4f16_1-MLC',
    name: 'Llama 3.2 1B',
    size: 'small',
    vramMB: 879.04,
    description: 'Modern small model from Meta, good balance',
    lowResource: true,
  },
  {
    id: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC',
    name: 'Qwen 2.5 1.5B',
    size: 'small',
    vramMB: 1629.75,
    description: 'High quality small model, good for most tasks',
    lowResource: true,
  },
  {
    id: 'Llama-3.2-3B-Instruct-q4f16_1-MLC',
    name: 'Llama 3.2 3B',
    size: 'medium',
    vramMB: 2263.69,
    description: 'Medium model with better reasoning capabilities',
    lowResource: true,
  },
  {
    id: 'Qwen2.5-3B-Instruct-q4f16_1-MLC',
    name: 'Qwen 2.5 3B',
    size: 'medium',
    vramMB: 2504.76,
    description: 'Excellent medium-sized model for most tasks',
    lowResource: true,
  },
  {
    id: 'Phi-3.5-mini-instruct-q4f16_1-MLC-1k',
    name: 'Phi 3.5 Mini',
    size: 'medium',
    vramMB: 2520.07,
    description: 'High-quality medium model from Microsoft',
    lowResource: true,
  },
  {
    id: 'Llama-3.1-8B-Instruct-q4f16_1-MLC-1k',
    name: 'Llama 3.1 8B (1k)',
    size: 'large',
    vramMB: 4598.34,
    description: 'Large model with excellent quality (shorter context)',
    lowResource: true,
  },
  {
    id: 'Llama-3.1-8B-Instruct-q4f16_1-MLC',
    name: 'Llama 3.1 8B',
    size: 'large',
    vramMB: 5001,
    description: 'Large model with excellent quality and longer context',
    lowResource: false,
  },
  {
    id: 'Qwen2.5-7B-Instruct-q4f16_1-MLC',
    name: 'Qwen 2.5 7B',
    size: 'large',
    vramMB: 5106.67,
    description: 'High-quality large model for complex tasks',
    lowResource: false,
  },
];

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
    const deviceMemory = (navigator as { deviceMemory?: number }).deviceMemory;

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
 */
export async function recommendModel(): Promise<ModelInfo> {
  const availableVRAM = await estimateAvailableVRAM();

  // Find the largest model that fits in available VRAM
  // with a safety margin (use only 80% of available VRAM)
  const safeVRAM = availableVRAM * 0.8;

  // Filter models that fit in available VRAM
  const compatibleModels = AVAILABLE_MODELS.filter((m) => m.vramMB <= safeVRAM);

  if (compatibleModels.length === 0) {
    // If no models fit, return the smallest one
    return AVAILABLE_MODELS[0];
  }

  // Return the largest compatible model
  return compatibleModels[compatibleModels.length - 1];
}

/**
 * Get recommended model description
 */
export function getRecommendedModelDescription(availableVRAM: number): string {
  const safeVRAM = availableVRAM * 0.8;

  if (safeVRAM < 1000) {
    return 'Low resources detected - recommended: SmolLM2-360M';
  } else if (safeVRAM < 2000) {
    return 'Moderate resources - recommended: Llama 3.2 1B or Qwen 2.5 1.5B';
  } else if (safeVRAM < 4000) {
    return 'Good resources - recommended: Llama 3.2 3B or Qwen 2.5 3B';
  } else {
    return 'Great resources - recommended: Llama 3.1 8B or Qwen 2.5 7B';
  }
}
