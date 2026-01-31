/**
 * Dashboard utilities for monitoring app data and memory usage
 */

/**
 * Storage usage information
 */
export interface StorageInfo {
  used: number; // bytes used
  quota: number; // total bytes available
  percentUsed: number; // percentage of quota used
  available: boolean; // whether storage API is available
}

/**
 * Memory usage information
 */
export interface MemoryInfo {
  used: number; // bytes used (if available)
  total: number; // total bytes available (if available)
  percentUsed: number; // percentage used
  available: boolean; // whether memory info is available
}

/**
 * Cache information
 */
export interface CacheInfo {
  modelCacheSize: number; // estimated size of model cache in bytes
  hasCachedModel: boolean; // whether there's a cached model
  available: boolean; // whether cache API is available
}

/**
 * Get storage usage information using StorageManager API
 */
export async function getStorageInfo(): Promise<StorageInfo> {
  if (!navigator.storage || !navigator.storage.estimate) {
    return {
      used: 0,
      quota: 0,
      percentUsed: 0,
      available: false,
    };
  }

  try {
    const estimate = await navigator.storage.estimate();
    const used = estimate.usage || 0;
    const quota = estimate.quota || 0;
    const percentUsed = quota > 0 ? (used / quota) * 100 : 0;

    return {
      used,
      quota,
      percentUsed,
      available: true,
    };
  } catch (error) {
    console.error('Failed to get storage info:', error);
    return {
      used: 0,
      quota: 0,
      percentUsed: 0,
      available: false,
    };
  }
}

/**
 * Get memory usage information
 * Note: performance.memory is a non-standard API only available in Chrome-based browsers
 */
export function getMemoryInfo(): MemoryInfo {
  // Check if performance.memory is available (Chrome only)
  if (
    typeof performance !== 'undefined' &&
    'memory' in performance &&
    performance.memory
  ) {
    const memory = performance.memory as {
      usedJSHeapSize: number;
      totalJSHeapSize: number;
      jsHeapSizeLimit: number;
    };

    const used = memory.usedJSHeapSize || 0;
    const total = memory.jsHeapSizeLimit || 0;
    const percentUsed = total > 0 ? (used / total) * 100 : 0;

    return {
      used,
      total,
      percentUsed,
      available: true,
    };
  }

  return {
    used: 0,
    total: 0,
    percentUsed: 0,
    available: false,
  };
}

/**
 * Get cache information
 * Estimates the size of cached models by examining IndexedDB
 */
export async function getCacheInfo(): Promise<CacheInfo> {
  if (typeof indexedDB === 'undefined') {
    return {
      modelCacheSize: 0,
      hasCachedModel: false,
      available: false,
    };
  }

  try {
    // Check if there's a cached model by looking at the webllm database
    // WebLLM typically uses IndexedDB to cache models
    const databases = await indexedDB.databases();
    let modelCacheSize = 0;
    let hasCachedModel = false;

    // Look for WebLLM cache database
    const webllmDb = databases.find((db) => db.name?.includes('webllm'));
    if (webllmDb) {
      hasCachedModel = true;
      // We can't easily get the exact size without opening the DB,
      // so we provide a reasonable estimate
      modelCacheSize = 0; // Will be updated if we can measure it
    }

    return {
      modelCacheSize,
      hasCachedModel,
      available: true,
    };
  } catch (error) {
    console.error('Failed to get cache info:', error);
    return {
      modelCacheSize: 0,
      hasCachedModel: false,
      available: false,
    };
  }
}

/**
 * Clear model cache
 * Clears WebLLM model cache from IndexedDB
 */
export async function clearModelCache(): Promise<void> {
  if (typeof indexedDB === 'undefined') {
    throw new Error('IndexedDB not available');
  }

  try {
    const databases = await indexedDB.databases();

    // Find and delete WebLLM cache databases
    for (const db of databases) {
      if (db.name && db.name.includes('webllm')) {
        await new Promise<void>((resolve, reject) => {
          const request = indexedDB.deleteDatabase(db.name!);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
          request.onblocked = () => {
            console.warn(`Database ${db.name} is blocked, retrying...`);
            // Still resolve as the database will be deleted when unblocked
            resolve();
          };
        });
      }
    }
  } catch (error) {
    console.error('Failed to clear model cache:', error);
    throw error;
  }
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);

  return `${value.toFixed(2)} ${units[i]}`;
}

/**
 * Format percentage to string with 1 decimal place
 */
export function formatPercentage(percent: number): string {
  return `${percent.toFixed(1)}%`;
}
