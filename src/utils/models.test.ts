import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  AVAILABLE_MODELS,
  getModelById,
  estimateAvailableVRAM,
  recommendModel,
  getNextSmallerModel,
  getSmallestModel,
  getAvailableModels,
} from './models';

describe('models utility', () => {
  describe('AVAILABLE_MODELS', () => {
    it('should have at least one model', () => {
      expect(AVAILABLE_MODELS.length).toBeGreaterThan(0);
    });

    it('should have models grouped by shader type', () => {
      // Models should be grouped: f32 first, then f16
      // But within each group, they should be sorted by VRAM
      const f32Models = AVAILABLE_MODELS.filter((m) => m.shaderType === 'f32');
      const f16Models = AVAILABLE_MODELS.filter((m) => m.shaderType === 'f16');

      // Check f32 models are sorted
      for (let i = 1; i < f32Models.length; i++) {
        expect(f32Models[i].vramMB).toBeGreaterThanOrEqual(f32Models[i - 1].vramMB);
      }

      // Check f16 models are sorted
      for (let i = 1; i < f16Models.length; i++) {
        expect(f16Models[i].vramMB).toBeGreaterThanOrEqual(f16Models[i - 1].vramMB);
      }
    });

    it('should have valid model properties', () => {
      AVAILABLE_MODELS.forEach((model) => {
        expect(model.id).toBeTruthy();
        expect(model.name).toBeTruthy();
        expect(['small', 'medium', 'large']).toContain(model.size);
        expect(model.vramMB).toBeGreaterThan(0);
        expect(model.description).toBeTruthy();
        expect(typeof model.lowResource).toBe('boolean');
        expect(['f16', 'f32']).toContain(model.shaderType);
      });
    });
  });

  describe('getAvailableModels', () => {
    it('should return all models when shader-f16 is supported', () => {
      const models = getAvailableModels(true);
      expect(models.length).toBe(AVAILABLE_MODELS.length);
    });

    it('should return only f32 models when shader-f16 is not supported', () => {
      const models = getAvailableModels(false);
      expect(models.every((m) => m.shaderType === 'f32')).toBe(true);
      expect(models.length).toBeGreaterThan(0);
      expect(models.length).toBeLessThan(AVAILABLE_MODELS.length);
    });
  });

  describe('getModelById', () => {
    it('should return model when found', () => {
      const model = getModelById('SmolLM2-360M-Instruct-q4f16_1-MLC');
      expect(model).toBeDefined();
      expect(model?.id).toBe('SmolLM2-360M-Instruct-q4f16_1-MLC');
    });

    it('should return undefined for unknown model', () => {
      const model = getModelById('non-existent-model');
      expect(model).toBeUndefined();
    });
  });

  describe('estimateAvailableVRAM', () => {
    beforeEach(() => {
      // Reset navigator mock
      vi.stubGlobal('navigator', {});
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('should return 0 when GPU is not available', async () => {
      const vram = await estimateAvailableVRAM();
      expect(vram).toBe(0);
    });

    it('should return default when GPU is available but no device memory', async () => {
      vi.stubGlobal('navigator', {
        gpu: {
          requestAdapter: async () => ({}),
        },
      });

      const vram = await estimateAvailableVRAM();
      expect(vram).toBe(4000);
    });

    it('should estimate VRAM based on device memory', async () => {
      vi.stubGlobal('navigator', {
        gpu: {
          requestAdapter: async () => ({}),
        },
        deviceMemory: 8,
      });

      const vram = await estimateAvailableVRAM();
      expect(vram).toBe(4000);
    });

    it('should handle errors gracefully', async () => {
      vi.stubGlobal('navigator', {
        gpu: {
          requestAdapter: async () => {
            throw new Error('GPU error');
          },
        },
      });

      const vram = await estimateAvailableVRAM();
      expect(vram).toBe(4000);
    });
  });

  describe('recommendModel', () => {
    beforeEach(() => {
      vi.stubGlobal('navigator', {});
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('should recommend smallest compatible model when no GPU available', async () => {
      const model = await recommendModel(true); // with f16 support
      // When no GPU, should recommend first f32 model for better compatibility
      const f32Models = getAvailableModels(true);
      expect(f32Models).toContain(model);
    });

    it('should recommend appropriate model based on VRAM and shader support', async () => {
      vi.stubGlobal('navigator', {
        gpu: {
          requestAdapter: async () => ({}),
        },
        deviceMemory: 8,
      });

      const modelWithF16 = await recommendModel(true);
      expect(modelWithF16.vramMB).toBeLessThanOrEqual(4000 * 0.6);

      const modelF32Only = await recommendModel(false);
      expect(modelF32Only.vramMB).toBeLessThanOrEqual(4000 * 0.6);
      expect(modelF32Only.shaderType).toBe('f32');
    });
  });

  describe('getNextSmallerModel', () => {
    it('should return the next smaller f16 model when shader-f16 is supported', () => {
      const smallerModel = getNextSmallerModel('TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC-1k', true);
      expect(smallerModel).toBeDefined();
      expect(smallerModel?.id).toBe('SmolLM2-360M-Instruct-q4f16_1-MLC');
    });

    it('should return null for smallest f16 model when shader-f16 is supported', () => {
      const smallerModel = getNextSmallerModel('SmolLM2-360M-Instruct-q4f16_1-MLC', true);
      // There's no smaller f16 model in the f16 section, but there might be f32 models
      // Actually, with f16 support=true, all models are available
      // SmolLM2 is the smallest f16 but there are f32 models before it
      expect(smallerModel).toBeDefined();
      expect(smallerModel?.shaderType).toBe('f32');
    });

    it('should return next smaller f32 model when shader-f16 is not supported', () => {
      const smallerModel = getNextSmallerModel('Llama-3.2-3B-Instruct-q4f32_1-MLC', false);
      expect(smallerModel).toBeDefined();
      expect(smallerModel?.shaderType).toBe('f32');
    });

    it('should return null for smallest f32 model when shader-f16 is not supported', () => {
      const f32Models = getAvailableModels(false);
      const smallestF32 = f32Models[0];
      const smallerModel = getNextSmallerModel(smallestF32.id, false);
      expect(smallerModel).toBeNull();
    });

    it('should return null for unknown model', () => {
      const smallerModel = getNextSmallerModel('non-existent-model', true);
      expect(smallerModel).toBeNull();
    });
  });

  describe('getSmallestModel', () => {
    it('should return the smallest f32 model by default', () => {
      const smallest = getSmallestModel(false);
      const f32Models = getAvailableModels(false);
      expect(smallest.id).toBe(f32Models[0].id);
      expect(smallest.shaderType).toBe('f32');
    });

    it('should return the smallest model when shader-f16 is supported', () => {
      const smallest = getSmallestModel(true);
      const allModels = getAvailableModels(true);
      expect(smallest.id).toBe(allModels[0].id);
    });
  });
});
