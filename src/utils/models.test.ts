import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  AVAILABLE_MODELS,
  getModelById,
  estimateAvailableVRAM,
  recommendModel,
  getRecommendedModelDescription,
} from './models';

describe('models utility', () => {
  describe('AVAILABLE_MODELS', () => {
    it('should have at least one model', () => {
      expect(AVAILABLE_MODELS.length).toBeGreaterThan(0);
    });

    it('should have models sorted by VRAM requirements', () => {
      for (let i = 1; i < AVAILABLE_MODELS.length; i++) {
        expect(AVAILABLE_MODELS[i].vramMB).toBeGreaterThanOrEqual(AVAILABLE_MODELS[i - 1].vramMB);
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
      });
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

    it('should recommend smallest model when no GPU available', async () => {
      const model = await recommendModel();
      expect(model.id).toBe(AVAILABLE_MODELS[0].id);
    });

    it('should recommend appropriate model based on VRAM', async () => {
      vi.stubGlobal('navigator', {
        gpu: {
          requestAdapter: async () => ({}),
        },
        deviceMemory: 8,
      });

      const model = await recommendModel();
      expect(model.vramMB).toBeLessThanOrEqual(4000 * 0.8);
    });
  });

  describe('getRecommendedModelDescription', () => {
    it('should return appropriate description for low VRAM', () => {
      const desc = getRecommendedModelDescription(500);
      expect(desc).toContain('Low resources');
      expect(desc).toContain('SmolLM2-360M');
    });

    it('should return appropriate description for moderate VRAM', () => {
      const desc = getRecommendedModelDescription(1500);
      expect(desc).toContain('Moderate resources');
      expect(desc).toContain('Llama 3.2 1B');
    });

    it('should return appropriate description for good VRAM', () => {
      const desc = getRecommendedModelDescription(3000);
      expect(desc).toContain('Good resources');
      expect(desc).toContain('3B');
    });

    it('should return appropriate description for great VRAM', () => {
      const desc = getRecommendedModelDescription(6000);
      expect(desc).toContain('Great resources');
      expect(desc).toContain('8B');
    });
  });
});
