/**
 * Dashboard Page - System monitoring and data management
 */

import { useState, useEffect, useCallback } from 'react';
import type { StorageInfo, MemoryInfo, CacheInfo } from './utils/dashboard';
import {
  getStorageInfo,
  getMemoryInfo,
  getCacheInfo,
  clearModelCache,
  formatBytes,
  formatPercentage,
} from './utils/dashboard';
import { clearMessages } from './utils/storage';
import './DashboardPage.css';

export interface DashboardPageProps {
  onClearCache?: () => void;
  onClearHistory?: () => void;
}

/**
 * Dashboard page for monitoring app usage and managing data
 */
export function DashboardPage({ onClearCache, onClearHistory }: DashboardPageProps) {
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [memoryInfo, setMemoryInfo] = useState<MemoryInfo | null>(null);
  const [cacheInfo, setCacheInfo] = useState<CacheInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [clearingCache, setClearingCache] = useState(false);
  const [clearingHistory, setClearingHistory] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [storage, memory, cache] = await Promise.all([
        getStorageInfo(),
        Promise.resolve(getMemoryInfo()),
        getCacheInfo(),
      ]);

      setStorageInfo(storage);
      setMemoryInfo(memory);
      setCacheInfo(cache);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setMessage({
        text: 'Failed to load dashboard data',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleClearCache = async () => {
    if (
      !confirm(
        'Are you sure you want to clear the model cache? This will require re-downloading models.'
      )
    ) {
      return;
    }

    setClearingCache(true);
    setMessage(null);

    try {
      await clearModelCache();
      setMessage({
        text: 'Model cache cleared successfully. Please reload the page.',
        type: 'success',
      });

      // Call the callback if provided
      if (onClearCache) {
        onClearCache();
      }

      // Reload dashboard data
      await loadDashboardData();
    } catch (error) {
      console.error('Failed to clear cache:', error);
      setMessage({
        text: 'Failed to clear model cache',
        type: 'error',
      });
    } finally {
      setClearingCache(false);
    }
  };

  const handleClearHistory = async () => {
    if (!confirm('Are you sure you want to clear your chat history? This cannot be undone.')) {
      return;
    }

    setClearingHistory(true);
    setMessage(null);

    try {
      await clearMessages();
      setMessage({
        text: 'Chat history cleared successfully',
        type: 'success',
      });

      // Call the callback if provided
      if (onClearHistory) {
        onClearHistory();
      }

      // Reload dashboard data
      await loadDashboardData();
    } catch (error) {
      console.error('Failed to clear history:', error);
      setMessage({
        text: 'Failed to clear chat history',
        type: 'error',
      });
    } finally {
      setClearingHistory(false);
    }
  };

  const handleRefresh = () => {
    loadDashboardData();
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-loading">
          <div className="loading-spinner" />
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h2>📊 Dashboard</h2>
        <button
          className="refresh-button"
          onClick={handleRefresh}
          aria-label="Refresh dashboard"
          data-testid="refresh-button"
        >
          🔄 Refresh
        </button>
      </div>

      {message && (
        <div className={`dashboard-message ${message.type}`} data-testid="dashboard-message">
          {message.text}
        </div>
      )}

      <div className="dashboard-content">
        {/* Storage Section */}
        <section className="dashboard-section">
          <h3>💾 Storage Usage</h3>
          {storageInfo?.available ? (
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Used:</span>
                <span className="info-value" data-testid="storage-used">
                  {formatBytes(storageInfo.used)}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Available:</span>
                <span className="info-value" data-testid="storage-quota">
                  {formatBytes(storageInfo.quota)}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Usage:</span>
                <span className="info-value" data-testid="storage-percent">
                  {formatPercentage(storageInfo.percentUsed)}
                </span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${Math.min(storageInfo.percentUsed, 100)}%` }}
                  data-testid="storage-progress"
                />
              </div>
            </div>
          ) : (
            <p className="info-unavailable" data-testid="storage-unavailable">
              Storage information not available
            </p>
          )}
        </section>

        {/* Memory Section */}
        <section className="dashboard-section">
          <h3>🧠 Memory Usage</h3>
          {memoryInfo?.available ? (
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Used:</span>
                <span className="info-value" data-testid="memory-used">
                  {formatBytes(memoryInfo.used)}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Limit:</span>
                <span className="info-value" data-testid="memory-total">
                  {formatBytes(memoryInfo.total)}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Usage:</span>
                <span className="info-value" data-testid="memory-percent">
                  {formatPercentage(memoryInfo.percentUsed)}
                </span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${Math.min(memoryInfo.percentUsed, 100)}%` }}
                  data-testid="memory-progress"
                />
              </div>
            </div>
          ) : (
            <p className="info-unavailable" data-testid="memory-unavailable">
              Memory information not available (Chrome-only feature)
            </p>
          )}
        </section>

        {/* Cache Section */}
        <section className="dashboard-section">
          <h3>🗄️ Model Cache</h3>
          {cacheInfo?.available ? (
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Status:</span>
                <span className="info-value" data-testid="cache-status">
                  {cacheInfo.hasCachedModel ? '✓ Cached models found' : 'No cached models'}
                </span>
              </div>
            </div>
          ) : (
            <p className="info-unavailable" data-testid="cache-unavailable">
              Cache information not available
            </p>
          )}
        </section>

        {/* Actions Section */}
        <section className="dashboard-section dashboard-actions">
          <h3>🛠️ Data Management</h3>
          <div className="action-buttons">
            <button
              className="action-button danger"
              onClick={handleClearCache}
              disabled={clearingCache || !cacheInfo?.hasCachedModel}
              data-testid="clear-cache-button"
            >
              {clearingCache ? 'Clearing...' : '🗑️ Clear Model Cache'}
            </button>
            <button
              className="action-button danger"
              onClick={handleClearHistory}
              disabled={clearingHistory}
              data-testid="clear-history-button"
            >
              {clearingHistory ? 'Clearing...' : '🗑️ Clear Chat History'}
            </button>
          </div>
          <p className="action-description">
            Clearing the model cache will free up storage space but require re-downloading models.
            Clearing chat history will permanently delete all your conversations.
          </p>
        </section>
      </div>
    </div>
  );
}
