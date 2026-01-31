/**
 * GPU Detection and WebGPU Support Utilities
 */

// Declare WebGPU types for TypeScript
declare global {
  interface Navigator {
    gpu?: {
      requestAdapter(): Promise<GPUAdapter | null>;
    };
  }

  interface GPUAdapter {
    requestAdapterInfo?(): Promise<GPUAdapterInfo>;
    info?: GPUAdapterInfo;
    features?: Set<string>;
  }

  interface GPUAdapterInfo {
    vendor?: string;
    architecture?: string;
    device?: string;
    description?: string;
  }
}

export interface GPUStatus {
  /** Whether WebGPU is supported in this browser */
  webGPUSupported: boolean;
  /** Whether a compatible GPU adapter was found */
  hasGPU: boolean;
  /** Whether shader-f16 is supported */
  supportsShaderF16: boolean;
  /** GPU vendor name if available */
  vendor?: string;
  /** GPU architecture if available */
  architecture?: string;
  /** Error message if GPU detection failed */
  error?: string;
}

/**
 * Check if WebGPU is supported and a compatible GPU is available
 */
export async function checkGPUSupport(): Promise<GPUStatus> {
  // Check if WebGPU API is available
  if (typeof navigator === 'undefined' || !navigator.gpu) {
    return {
      webGPUSupported: false,
      hasGPU: false,
      supportsShaderF16: false,
      error: 'WebGPU is not supported in this browser',
    };
  }

  try {
    // Try to get a GPU adapter
    const adapter = await navigator.gpu.requestAdapter();

    if (!adapter) {
      return {
        webGPUSupported: true,
        hasGPU: false,
        supportsShaderF16: false,
        error: 'No compatible GPU adapter found',
      };
    }

    // Get adapter info - try both methods
    let vendor: string | undefined;
    let architecture: string | undefined;

    if (adapter.requestAdapterInfo) {
      const info = await adapter.requestAdapterInfo();
      vendor = info?.vendor;
      architecture = info?.architecture;
    } else if (adapter.info) {
      vendor = adapter.info.vendor;
      architecture = adapter.info.architecture;
    }

    // Check if shader-f16 is supported
    const supportsShaderF16 = adapter.features?.has('shader-f16') ?? false;

    return {
      webGPUSupported: true,
      hasGPU: true,
      supportsShaderF16,
      vendor,
      architecture,
    };
  } catch (err) {
    return {
      webGPUSupported: true,
      hasGPU: false,
      supportsShaderF16: false,
      error: err instanceof Error ? err.message : 'Failed to detect GPU',
    };
  }
}

/**
 * Check if we're in a test environment
 */
export function isTestEnvironment(): boolean {
  // Check for Vitest/Jest globals without using process
  try {
    // Use import.meta.env which is available in Vite
    return (
      import.meta.env?.MODE === 'test' ||
      import.meta.env?.VITEST === 'true' ||
      // @ts-expect-error - Check for vi global from Vitest
      typeof vi !== 'undefined'
    );
  } catch {
    return false;
  }
}

/**
 * Check if we should use demo mode (no GPU or testing)
 */
export async function shouldUseDemoMode(): Promise<boolean> {
  if (isTestEnvironment()) {
    return true;
  }

  const gpuStatus = await checkGPUSupport();
  return !gpuStatus.hasGPU;
}
