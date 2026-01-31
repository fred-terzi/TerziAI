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
 * Estimate memory usage based on storage quota (Safari/iOS fallback)
 */
async function estimateMemoryFromStorage(): Promise<MemoryInfo> {
  try {
    if (!navigator.storage || !navigator.storage.estimate) {
      return {
        used: 0,
        total: 0,
        percentUsed: 0,
        available: false,
      };
    }

    const estimate = await navigator.storage.estimate();
    const storageUsed = estimate.usage || 0;
    const storageQuota = estimate.quota || 0;

    // Estimate memory based on storage usage
    // Typical mobile browsers allocate memory proportional to storage
    // Use a conservative estimate: assume app uses ~15% of storage as active memory
    const estimatedUsed = Math.min(storageUsed * 0.15, 100 * 1024 * 1024); // Cap at 100MB

    // Estimate total available memory based on device characteristics
    // For mobile devices (iPhone), typical heap limits are 300-700MB depending on device
    // Use storage quota as a proxy indicator
    let estimatedTotal: number;
    if (storageQuota > 5 * 1024 * 1024 * 1024) {
      // > 5GB quota suggests modern device with more memory
      estimatedTotal = 512 * 1024 * 1024; // 512MB estimate
    } else if (storageQuota > 1 * 1024 * 1024 * 1024) {
      // > 1GB quota
      estimatedTotal = 384 * 1024 * 1024; // 384MB estimate
    } else {
      // Lower quota, more conservative
      estimatedTotal = 256 * 1024 * 1024; // 256MB estimate
    }

    const percentUsed = estimatedTotal > 0 ? (estimatedUsed / estimatedTotal) * 100 : 0;

    return {
      used: estimatedUsed,
      total: estimatedTotal,
      percentUsed,
      available: true,
    };
  } catch (error) {
    console.error('Failed to estimate memory:', error);
    return {
      used: 0,
      total: 0,
      percentUsed: 0,
      available: false,
    };
  }
}

/**
 * Get memory usage information
 * Uses performance.memory on Chrome, estimates based on storage on Safari/iOS
 */
export async function getMemoryInfo(): Promise<MemoryInfo> {
  // Check if performance.memory is available (Chrome/Edge)
  if (typeof performance !== 'undefined' && 'memory' in performance && performance.memory) {
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

  // Fallback to storage-based estimation for Safari/iOS
  return estimateMemoryFromStorage();
}

/**
 * Get cache information
 * Estimates the size of cached models by examining IndexedDB
 * Uses indexedDB.databases() on supported browsers (Chrome, Firefox, Edge)
 * Falls back to attempting to open known WebLLM databases on Safari
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
    // Try modern API first (Chrome, Firefox, Edge)
    // Safari does not support indexedDB.databases()
    if (typeof indexedDB.databases === 'function') {
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
    }

    // Fallback for Safari: attempt to open known WebLLM databases
    // WebLLM uses various database names depending on version
    const knownDatabases = ['webllm-model-cache', 'webllm', 'mlc-models'];
    for (const dbName of knownDatabases) {
      try {
        const db = await new Promise<IDBDatabase | null>((resolve, reject) => {
          const request = indexedDB.open(dbName);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
          // Database doesn't exist - this is not an error for our purposes
          request.onupgradeneeded = () => {
            // New database being created, doesn't exist yet
            request.transaction?.abort();
            resolve(null);
          };
        });

        if (db) {
          db.close();
          // Found an existing database, there's a cached model
          return {
            modelCacheSize: 0,
            hasCachedModel: true,
            available: true,
          };
        }
      } catch {
        // Database doesn't exist or error opening it, continue to next
        continue;
      }
    }

    // No cached models found
    return {
      modelCacheSize: 0,
      hasCachedModel: false,
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
 * Uses indexedDB.databases() on supported browsers (Chrome, Firefox, Edge)
 * Falls back to attempting to delete known WebLLM databases on Safari
 */
export async function clearModelCache(): Promise<void> {
  if (typeof indexedDB === 'undefined') {
    throw new Error('IndexedDB not available');
  }

  try {
    // Try modern API first (Chrome, Firefox, Edge)
    if (typeof indexedDB.databases === 'function') {
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
    } else {
      // Fallback for Safari: attempt to delete known WebLLM databases
      const knownDatabases = ['webllm-model-cache', 'webllm', 'mlc-models'];
      for (const dbName of knownDatabases) {
        await new Promise<void>((resolve, reject) => {
          const request = indexedDB.deleteDatabase(dbName);
          request.onsuccess = () => resolve();
          request.onerror = () => {
            // Ignore errors for databases that don't exist
            resolve();
          };
          request.onblocked = () => {
            console.warn(`Database ${dbName} is blocked, retrying...`);
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
