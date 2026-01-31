import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DashboardPage } from './DashboardPage';
import * as dashboardUtils from './utils/dashboard';
import * as storage from './utils/storage';

// Mock the dashboard utilities
vi.mock('./utils/dashboard', () => ({
  getStorageInfo: vi.fn(),
  getMemoryInfo: vi.fn(),
  getCacheInfo: vi.fn(),
  clearModelCache: vi.fn(),
  formatBytes: vi.fn((bytes) => `${bytes} bytes`),
  formatPercentage: vi.fn((percent) => `${percent}%`),
}));

// Mock the storage utilities
vi.mock('./utils/storage', () => ({
  clearMessages: vi.fn(),
}));

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    vi.mocked(dashboardUtils.getStorageInfo).mockResolvedValue({
      used: 1024 * 1024 * 100, // 100 MB
      quota: 1024 * 1024 * 1024, // 1 GB
      percentUsed: 9.77,
      available: true,
    });

    vi.mocked(dashboardUtils.getMemoryInfo).mockReturnValue({
      used: 50 * 1024 * 1024, // 50 MB
      total: 200 * 1024 * 1024, // 200 MB
      percentUsed: 25,
      available: true,
    });

    vi.mocked(dashboardUtils.getCacheInfo).mockResolvedValue({
      modelCacheSize: 0,
      hasCachedModel: true,
      available: true,
    });

    vi.mocked(dashboardUtils.formatBytes).mockImplementation((bytes) => `${bytes} bytes`);
    vi.mocked(dashboardUtils.formatPercentage).mockImplementation((percent) => `${percent}%`);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('renders dashboard heading', async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/Dashboard/)).toBeInTheDocument();
    });
  });

  test('shows loading state initially', () => {
    render(<DashboardPage />);
    expect(screen.getByText('Loading dashboard data...')).toBeInTheDocument();
  });

  test('displays storage information', async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByTestId('storage-used')).toBeInTheDocument();
      expect(screen.getByTestId('storage-quota')).toBeInTheDocument();
      expect(screen.getByTestId('storage-percent')).toBeInTheDocument();
    });
  });

  test('displays memory information', async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByTestId('memory-used')).toBeInTheDocument();
      expect(screen.getByTestId('memory-total')).toBeInTheDocument();
      expect(screen.getByTestId('memory-percent')).toBeInTheDocument();
    });
  });

  test('displays cache status', async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByTestId('cache-status')).toBeInTheDocument();
    });
  });

  test('shows unavailable message when storage is not available', async () => {
    vi.mocked(dashboardUtils.getStorageInfo).mockResolvedValue({
      used: 0,
      quota: 0,
      percentUsed: 0,
      available: false,
    });

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByTestId('storage-unavailable')).toBeInTheDocument();
    });
  });

  test('shows unavailable message when memory is not available', async () => {
    vi.mocked(dashboardUtils.getMemoryInfo).mockReturnValue({
      used: 0,
      total: 0,
      percentUsed: 0,
      available: false,
    });

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByTestId('memory-unavailable')).toBeInTheDocument();
    });
  });

  test('refresh button reloads data', async () => {
    const user = userEvent.setup();
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByTestId('refresh-button')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('refresh-button'));

    // Should call the functions again
    await waitFor(() => {
      expect(dashboardUtils.getStorageInfo).toHaveBeenCalledTimes(2);
    });
  });

  test('clear cache button calls clearModelCache', async () => {
    const user = userEvent.setup();
    const mockClearCache = vi.fn();
    vi.mocked(dashboardUtils.clearModelCache).mockResolvedValue(undefined);

    // Mock window.confirm
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<DashboardPage onClearCache={mockClearCache} />);

    await waitFor(() => {
      expect(screen.getByTestId('clear-cache-button')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('clear-cache-button'));

    await waitFor(() => {
      expect(dashboardUtils.clearModelCache).toHaveBeenCalled();
      expect(mockClearCache).toHaveBeenCalled();
    });

    confirmSpy.mockRestore();
  });

  test('clear cache shows confirmation dialog', async () => {
    const user = userEvent.setup();
    vi.mocked(dashboardUtils.clearModelCache).mockResolvedValue(undefined);

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByTestId('clear-cache-button')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('clear-cache-button'));

    expect(confirmSpy).toHaveBeenCalled();
    expect(dashboardUtils.clearModelCache).not.toHaveBeenCalled();

    confirmSpy.mockRestore();
  });

  test('clear history button calls clearMessages', async () => {
    const user = userEvent.setup();
    const mockClearHistory = vi.fn();
    vi.mocked(storage.clearMessages).mockResolvedValue(undefined);

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<DashboardPage onClearHistory={mockClearHistory} />);

    await waitFor(() => {
      expect(screen.getByTestId('clear-history-button')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('clear-history-button'));

    await waitFor(() => {
      expect(storage.clearMessages).toHaveBeenCalled();
      expect(mockClearHistory).toHaveBeenCalled();
    });

    confirmSpy.mockRestore();
  });

  test('shows success message after clearing cache', async () => {
    const user = userEvent.setup();
    vi.mocked(dashboardUtils.clearModelCache).mockResolvedValue(undefined);

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByTestId('clear-cache-button')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('clear-cache-button'));

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-message')).toBeInTheDocument();
      expect(screen.getByText(/Model cache cleared successfully/)).toBeInTheDocument();
    });

    confirmSpy.mockRestore();
  });

  test('shows error message when clearing cache fails', async () => {
    const user = userEvent.setup();
    vi.mocked(dashboardUtils.clearModelCache).mockRejectedValue(new Error('Test error'));

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByTestId('clear-cache-button')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('clear-cache-button'));

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-message')).toBeInTheDocument();
      expect(screen.getByText(/Failed to clear model cache/)).toBeInTheDocument();
    });

    confirmSpy.mockRestore();
  });

  test('disables clear cache button when no cached models', async () => {
    vi.mocked(dashboardUtils.getCacheInfo).mockResolvedValue({
      modelCacheSize: 0,
      hasCachedModel: false,
      available: true,
    });

    render(<DashboardPage />);

    await waitFor(() => {
      const button = screen.getByTestId('clear-cache-button');
      expect(button).toBeDisabled();
    });
  });

  test('shows loading text on buttons while clearing', async () => {
    const user = userEvent.setup();
    vi.mocked(dashboardUtils.clearModelCache).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByTestId('clear-cache-button')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('clear-cache-button'));

    // Should show "Clearing..." while in progress
    expect(screen.getByText('Clearing...')).toBeInTheDocument();

    confirmSpy.mockRestore();
  });
});
