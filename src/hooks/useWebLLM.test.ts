import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useWebLLM } from './useWebLLM';
import * as storage from '../utils/storage';

// Mock the @mlc-ai/web-llm module
vi.mock('@mlc-ai/web-llm', () => ({
  CreateMLCEngine: vi.fn(),
}));

// Mock the GPU utils
vi.mock('../utils/gpu', () => ({
  checkGPUSupport: vi.fn().mockResolvedValue({ hasGPU: false, webGPUSupported: false }),
  isTestEnvironment: vi.fn().mockReturnValue(true),
}));

// Mock storage utilities
vi.mock('../utils/storage', () => ({
  saveMessages: vi.fn().mockResolvedValue(undefined),
  loadMessages: vi.fn().mockResolvedValue([]),
  clearMessages: vi.fn().mockResolvedValue(undefined),
}));

describe('useWebLLM', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('initializes with idle status', () => {
    const { result } = renderHook(() => useWebLLM());

    expect(result.current.status).toBe('idle');
    expect(result.current.messages).toEqual([]);
    expect(result.current.error).toBeNull();
    expect(result.current.isReady).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isGenerating).toBe(false);
    expect(result.current.isDemo).toBe(false);
  });

  test('returns initial loading progress', () => {
    const { result } = renderHook(() => useWebLLM());

    expect(result.current.loadingProgress).toEqual({
      text: '',
      progress: 0,
    });
  });

  test('provides initializeEngine function', () => {
    const { result } = renderHook(() => useWebLLM());

    expect(typeof result.current.initializeEngine).toBe('function');
  });

  test('provides sendMessage function', () => {
    const { result } = renderHook(() => useWebLLM());

    expect(typeof result.current.sendMessage).toBe('function');
  });

  test('provides stopGeneration function', () => {
    const { result } = renderHook(() => useWebLLM());

    expect(typeof result.current.stopGeneration).toBe('function');
  });

  test('provides clearMessages function', () => {
    const { result } = renderHook(() => useWebLLM());

    expect(typeof result.current.clearMessages).toBe('function');
  });

  test('provides reset function', () => {
    const { result } = renderHook(() => useWebLLM());

    expect(typeof result.current.reset).toBe('function');
  });

  test('clearMessages empties the messages array', () => {
    const { result } = renderHook(() => useWebLLM());

    act(() => {
      result.current.clearMessages();
    });

    expect(result.current.messages).toEqual([]);
  });

  test('reset clears engine state but preserves messages for persistence', () => {
    const { result } = renderHook(() => useWebLLM());

    act(() => {
      result.current.reset();
    });

    expect(result.current.status).toBe('idle');
    expect(result.current.mode).toBeNull();
    // Messages should NOT be cleared - they persist across model changes
    expect(result.current.messages).toEqual([]);
    expect(result.current.loadingProgress).toEqual({ text: '', progress: 0 });
    expect(result.current.error).toBeNull();
    expect(result.current.gpuInfo).toBeNull();
  });

  test('enters demo mode in test environment', async () => {
    const { result } = renderHook(() => useWebLLM());

    await act(async () => {
      await result.current.initializeEngine();
    });

    await waitFor(() => {
      expect(result.current.status).toBe('demo');
      expect(result.current.isDemo).toBe(true);
      expect(result.current.isReady).toBe(true);
      expect(result.current.mode).toBe('demo');
    });
  });

  test('can send messages in demo mode', async () => {
    const { result } = renderHook(() => useWebLLM());

    await act(async () => {
      await result.current.initializeEngine();
    });

    await waitFor(() => {
      expect(result.current.isDemo).toBe(true);
    });

    // Should not throw in demo mode
    await act(async () => {
      await result.current.sendMessage('Hello');
    });

    expect(result.current.messages.length).toBeGreaterThan(0);
    expect(result.current.messages[0].content).toBe('Hello');
    expect(result.current.messages[0].role).toBe('user');
  });

  describe('chat persistence', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    test('loads messages from storage on mount', async () => {
      const mockMessages = [
        {
          id: '1',
          role: 'user' as const,
          content: 'Previous message',
          timestamp: new Date('2024-01-01'),
        },
      ];

      vi.mocked(storage.loadMessages).mockResolvedValueOnce(mockMessages);

      const { result } = renderHook(() => useWebLLM());

      await waitFor(() => {
        expect(storage.loadMessages).toHaveBeenCalledTimes(1);
        expect(result.current.messages).toEqual(mockMessages);
      });
    });

    test('does not load messages if storage is empty', async () => {
      vi.mocked(storage.loadMessages).mockResolvedValueOnce([]);

      const { result } = renderHook(() => useWebLLM());

      await waitFor(() => {
        expect(storage.loadMessages).toHaveBeenCalledTimes(1);
      });

      expect(result.current.messages).toEqual([]);
    });

    test('saves messages to storage whenever they change', async () => {
      const { result } = renderHook(() => useWebLLM());

      await act(async () => {
        await result.current.initializeEngine();
      });

      await waitFor(() => {
        expect(result.current.isDemo).toBe(true);
      });

      await act(async () => {
        await result.current.sendMessage('Test message');
      });

      await waitFor(() => {
        expect(storage.saveMessages).toHaveBeenCalled();
        expect(result.current.messages.length).toBeGreaterThan(0);
      });
    });

    test('saves empty array to storage when messages are cleared', async () => {
      const { result } = renderHook(() => useWebLLM());

      await act(async () => {
        await result.current.initializeEngine();
      });

      await waitFor(() => {
        expect(result.current.isDemo).toBe(true);
      });

      // Send a message first
      await act(async () => {
        await result.current.sendMessage('Test');
      });

      // Clear messages
      await act(async () => {
        await result.current.clearMessages();
      });

      await waitFor(() => {
        // Should save empty array instead of calling clearMessages
        expect(storage.saveMessages).toHaveBeenCalledWith([]);
        expect(result.current.messages).toEqual([]);
      });
    });

    test('reset does NOT clear messages (maintains persistence across model changes)', async () => {
      const mockMessages = [
        {
          id: '1',
          role: 'user' as const,
          content: 'Existing message',
          timestamp: new Date('2024-01-01'),
        },
      ];

      vi.mocked(storage.loadMessages).mockResolvedValueOnce(mockMessages);

      const { result } = renderHook(() => useWebLLM());

      await waitFor(() => {
        expect(result.current.messages).toEqual(mockMessages);
      });

      // Reset should NOT clear messages
      act(() => {
        result.current.reset();
      });

      expect(result.current.messages).toEqual(mockMessages);
      expect(result.current.status).toBe('idle');
    });

    test('messages persist across multiple save operations', async () => {
      const { result } = renderHook(() => useWebLLM());

      await act(async () => {
        await result.current.initializeEngine();
      });

      await waitFor(() => {
        expect(result.current.isDemo).toBe(true);
      });

      // Send a message
      await act(async () => {
        await result.current.sendMessage('Test message');
      });

      // Wait for message to be added and saved
      await waitFor(() => {
        expect(result.current.messages.length).toBeGreaterThan(0);
        expect(storage.saveMessages).toHaveBeenCalled();
      });
    });

    test('handles storage errors gracefully', async () => {
      // Mock error BEFORE rendering hook
      vi.mocked(storage.loadMessages).mockRejectedValueOnce(new Error('Storage error'));

      const { result } = renderHook(() => useWebLLM());

      // Wait a bit for the load attempt
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Should not crash, messages should be empty
      expect(result.current.messages).toEqual([]);
    });
  });
});
