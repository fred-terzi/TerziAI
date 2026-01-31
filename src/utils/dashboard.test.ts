import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getStorageInfo,
  getMemoryInfo,
  getCacheInfo,
  clearModelCache,
  formatBytes,
  formatPercentage,
} from './dashboard';

describe('formatBytes', () => {
  test('formats 0 bytes', () => {
    expect(formatBytes(0)).toBe('0 B');
  });

  test('formats bytes', () => {
    expect(formatBytes(512)).toBe('512.00 B');
  });

  test('formats kilobytes', () => {
    expect(formatBytes(1024)).toBe('1.00 KB');
    expect(formatBytes(2048)).toBe('2.00 KB');
  });

  test('formats megabytes', () => {
    expect(formatBytes(1024 * 1024)).toBe('1.00 MB');
    expect(formatBytes(5 * 1024 * 1024)).toBe('5.00 MB');
  });

  test('formats gigabytes', () => {
    expect(formatBytes(1024 * 1024 * 1024)).toBe('1.00 GB');
    expect(formatBytes(2.5 * 1024 * 1024 * 1024)).toBe('2.50 GB');
  });
});

describe('formatPercentage', () => {
  test('formats percentage with 1 decimal place', () => {
    expect(formatPercentage(0)).toBe('0.0%');
    expect(formatPercentage(50.5)).toBe('50.5%');
    expect(formatPercentage(100)).toBe('100.0%');
  });

  test('rounds to 1 decimal place', () => {
    expect(formatPercentage(33.333)).toBe('33.3%');
    expect(formatPercentage(66.666)).toBe('66.7%');
  });
});

describe('getStorageInfo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('returns unavailable when storage API is not available', async () => {
    // Mock navigator.storage as undefined
    const originalStorage = navigator.storage;
    Object.defineProperty(navigator, 'storage', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    const info = await getStorageInfo();

    expect(info.available).toBe(false);
    expect(info.used).toBe(0);
    expect(info.quota).toBe(0);

    // Restore
    Object.defineProperty(navigator, 'storage', {
      value: originalStorage,
      writable: true,
      configurable: true,
    });
  });

  test('returns storage info when API is available', async () => {
    // Mock navigator.storage.estimate
    const mockEstimate = vi.fn().mockResolvedValue({
      usage: 1024 * 1024 * 100, // 100 MB
      quota: 1024 * 1024 * 1024, // 1 GB
    });

    Object.defineProperty(navigator, 'storage', {
      value: {
        estimate: mockEstimate,
      },
      writable: true,
      configurable: true,
    });

    const info = await getStorageInfo();

    expect(info.available).toBe(true);
    expect(info.used).toBe(1024 * 1024 * 100);
    expect(info.quota).toBe(1024 * 1024 * 1024);
    expect(info.percentUsed).toBeCloseTo(9.77, 1);
  });

  test('handles errors gracefully', async () => {
    const mockEstimate = vi.fn().mockRejectedValue(new Error('Test error'));

    Object.defineProperty(navigator, 'storage', {
      value: {
        estimate: mockEstimate,
      },
      writable: true,
      configurable: true,
    });

    const info = await getStorageInfo();

    expect(info.available).toBe(false);
    expect(info.used).toBe(0);
  });
});

describe('getMemoryInfo', () => {
  test('returns unavailable when performance.memory is not available', () => {
    // Mock performance without memory
    const originalPerformance = global.performance;
    Object.defineProperty(global, 'performance', {
      value: {},
      writable: true,
      configurable: true,
    });

    const info = getMemoryInfo();

    expect(info.available).toBe(false);
    expect(info.used).toBe(0);
    expect(info.total).toBe(0);

    // Restore
    Object.defineProperty(global, 'performance', {
      value: originalPerformance,
      writable: true,
      configurable: true,
    });
  });

  test('returns memory info when available', () => {
    // Mock performance.memory
    Object.defineProperty(global.performance, 'memory', {
      value: {
        usedJSHeapSize: 50 * 1024 * 1024, // 50 MB
        totalJSHeapSize: 100 * 1024 * 1024, // 100 MB
        jsHeapSizeLimit: 200 * 1024 * 1024, // 200 MB
      },
      writable: true,
      configurable: true,
    });

    const info = getMemoryInfo();

    expect(info.available).toBe(true);
    expect(info.used).toBe(50 * 1024 * 1024);
    expect(info.total).toBe(200 * 1024 * 1024);
    expect(info.percentUsed).toBe(25);
  });
});

describe('getCacheInfo', () => {
  test('returns unavailable when indexedDB is not available', async () => {
    const originalIndexedDB = global.indexedDB;
    Object.defineProperty(global, 'indexedDB', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    const info = await getCacheInfo();

    expect(info.available).toBe(false);
    expect(info.hasCachedModel).toBe(false);

    // Restore
    Object.defineProperty(global, 'indexedDB', {
      value: originalIndexedDB,
      writable: true,
      configurable: true,
    });
  });

  test('detects cached models', async () => {
    const mockDatabases = vi.fn().mockResolvedValue([
      { name: 'TerziAI', version: 1 },
      { name: 'webllm-cache', version: 1 },
    ]);

    const originalIndexedDB = global.indexedDB;
    Object.defineProperty(global, 'indexedDB', {
      value: {
        databases: mockDatabases,
      },
      writable: true,
      configurable: true,
    });

    const info = await getCacheInfo();

    expect(info.available).toBe(true);
    expect(info.hasCachedModel).toBe(true);

    // Restore
    Object.defineProperty(global, 'indexedDB', {
      value: originalIndexedDB,
      writable: true,
      configurable: true,
    });
  });

  test('handles errors gracefully', async () => {
    const mockDatabases = vi.fn().mockRejectedValue(new Error('Test error'));

    const originalIndexedDB = global.indexedDB;
    Object.defineProperty(global, 'indexedDB', {
      value: {
        databases: mockDatabases,
      },
      writable: true,
      configurable: true,
    });

    const info = await getCacheInfo();

    expect(info.available).toBe(false);

    // Restore
    Object.defineProperty(global, 'indexedDB', {
      value: originalIndexedDB,
      writable: true,
      configurable: true,
    });
  });
});

describe('clearModelCache', () => {
  test('throws error when indexedDB is not available', async () => {
    const originalIndexedDB = global.indexedDB;
    Object.defineProperty(global, 'indexedDB', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    await expect(clearModelCache()).rejects.toThrow('IndexedDB not available');

    // Restore
    Object.defineProperty(global, 'indexedDB', {
      value: originalIndexedDB,
      writable: true,
      configurable: true,
    });
  });

  test('clears webllm databases', async () => {
    const mockDatabases = vi.fn().mockResolvedValue([
      { name: 'TerziAI', version: 1 },
      { name: 'webllm-cache', version: 1 },
    ]);

    const mockDeleteDatabase = vi.fn().mockReturnValue({
      onsuccess: null,
      onerror: null,
      onblocked: null,
    });

    const originalIndexedDB = global.indexedDB;
    Object.defineProperty(global, 'indexedDB', {
      value: {
        databases: mockDatabases,
        deleteDatabase: mockDeleteDatabase,
      },
      writable: true,
      configurable: true,
    });

    // Trigger onsuccess immediately
    mockDeleteDatabase.mockImplementation(() => {
      const request = {
        onsuccess: null as (() => void) | null,
        onerror: null,
        onblocked: null,
      };
      setTimeout(() => {
        if (request.onsuccess) request.onsuccess();
      }, 0);
      return request;
    });

    await clearModelCache();

    expect(mockDeleteDatabase).toHaveBeenCalledWith('webllm-cache');
    expect(mockDeleteDatabase).not.toHaveBeenCalledWith('TerziAI');

    // Restore
    Object.defineProperty(global, 'indexedDB', {
      value: originalIndexedDB,
      writable: true,
      configurable: true,
    });
  });
});
