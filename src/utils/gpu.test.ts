import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkGPUSupport, isTestEnvironment, shouldUseDemoMode } from './gpu';

describe('GPU Utils', () => {
  const originalNavigator = globalThis.navigator;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore navigator
    Object.defineProperty(globalThis, 'navigator', {
      value: originalNavigator,
      writable: true,
      configurable: true,
    });
    vi.restoreAllMocks();
  });

  describe('isTestEnvironment', () => {
    test('returns true when running in Vitest', () => {
      // We're running in Vitest, so this should return true
      expect(isTestEnvironment()).toBe(true);
    });
  });

  describe('checkGPUSupport', () => {
    test('returns no GPU support when WebGPU not available', async () => {
      Object.defineProperty(globalThis, 'navigator', {
        value: {},
        writable: true,
        configurable: true,
      });

      const result = await checkGPUSupport();
      expect(result.webGPUSupported).toBe(false);
      expect(result.hasGPU).toBe(false);
    });

    test('returns no GPU when adapter not available', async () => {
      Object.defineProperty(globalThis, 'navigator', {
        value: {
          gpu: {
            requestAdapter: vi.fn().mockResolvedValue(null),
          },
        },
        writable: true,
        configurable: true,
      });

      const result = await checkGPUSupport();
      expect(result.webGPUSupported).toBe(true);
      expect(result.hasGPU).toBe(false);
    });

    test('returns GPU info when adapter available', async () => {
      const mockAdapter = {
        info: {
          vendor: 'NVIDIA',
          architecture: 'Ampere',
        },
      };

      Object.defineProperty(globalThis, 'navigator', {
        value: {
          gpu: {
            requestAdapter: vi.fn().mockResolvedValue(mockAdapter),
          },
        },
        writable: true,
        configurable: true,
      });

      const result = await checkGPUSupport();
      expect(result.webGPUSupported).toBe(true);
      expect(result.hasGPU).toBe(true);
      expect(result.vendor).toBe('NVIDIA');
      expect(result.architecture).toBe('Ampere');
    });

    test('handles errors gracefully', async () => {
      Object.defineProperty(globalThis, 'navigator', {
        value: {
          gpu: {
            requestAdapter: vi.fn().mockRejectedValue(new Error('GPU Error')),
          },
        },
        writable: true,
        configurable: true,
      });

      const result = await checkGPUSupport();
      expect(result.webGPUSupported).toBe(true);
      expect(result.hasGPU).toBe(false);
      expect(result.error).toBe('GPU Error');
    });
  });

  describe('shouldUseDemoMode', () => {
    test('returns true in test environment', async () => {
      const result = await shouldUseDemoMode();
      expect(result).toBe(true);
    });
  });
});
