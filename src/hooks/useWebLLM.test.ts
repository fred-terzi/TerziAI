import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useWebLLM } from './useWebLLM';

// Mock the @mlc-ai/web-llm module
vi.mock('@mlc-ai/web-llm', () => ({
  CreateMLCEngine: vi.fn(),
}));

// Mock the GPU utils
vi.mock('../utils/gpu', () => ({
  checkGPUSupport: vi.fn().mockResolvedValue({ hasGPU: false, webGPUSupported: false }),
  isTestEnvironment: vi.fn().mockReturnValue(true),
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

  test('reset clears all state', () => {
    const { result } = renderHook(() => useWebLLM());

    act(() => {
      result.current.reset();
    });

    expect(result.current.status).toBe('idle');
    expect(result.current.mode).toBeNull();
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
});
