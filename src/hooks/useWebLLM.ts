import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import type {
  ChatMessage,
  LLMStatus,
  LoadingProgress,
  ChatConfig,
  EngineMode,
} from '../types/chat';
import { DEFAULT_CHAT_CONFIG } from '../types/chat';
import { checkGPUSupport, isTestEnvironment } from '../utils/gpu';
import { getNextSmallerModel, getSmallestModel, getModelById } from '../utils/models';
import {
  saveMessages as saveMessagesToStorage,
  loadMessages as loadMessagesFromStorage,
} from '../utils/storage';
import { shouldUseLowResourceMode } from '../utils/device';

// Simplified types for WebLLM engine to avoid strict type checking issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type WebLLMEngine = any;

/**
 * Demo responses for when GPU is not available
 */
const DEMO_RESPONSES = [
  "Hello! I'm TerziAI running in demo mode. Your device doesn't have WebGPU support, so I'm providing simulated responses. To use the full AI capabilities, please use a browser with WebGPU support (like Chrome 113+ or Edge 113+) on a device with a compatible GPU.",
  "I'm currently in demo mode because WebGPU isn't available on your device. This is a preview of how TerziAI works. For actual AI responses, you'll need a WebGPU-compatible browser and GPU.",
  'Great question! In demo mode, I can show you the chat interface, but real AI processing requires WebGPU. Try Chrome or Edge on a device with a GPU for the full experience.',
  "TerziAI demo mode is active. While I can't process your message with AI right now, this shows how the interface works. WebGPU support is needed for local LLM inference.",
  'Thanks for trying TerziAI! Demo mode is active due to missing WebGPU support. The full version runs AI models directly in your browser for complete privacy.',
];

/**
 * Maximum number of messages to keep in conversation history
 * This prevents memory issues with very long conversations
 * Keeps last N message pairs (user + assistant)
 */
const MAX_CONVERSATION_MESSAGES = 50;

/**
 * Format VRAM from MB to GB for display
 */
function formatVRAMToGB(vramMB: number): string {
  return (Math.round((vramMB / 1024) * 10) / 10).toString();
}

/**
 * Custom hook for managing WebLLM chat interactions
 * Provides state management for chat messages and LLM operations
 * Supports both GPU-accelerated and demo mode
 */
export function useWebLLM(config: Partial<ChatConfig> = {}) {
  // Memoize the full config to avoid unnecessary re-renders
  const fullConfig: ChatConfig = useMemo(() => {
    return {
      modelId: config.modelId ?? DEFAULT_CHAT_CONFIG.modelId,
      systemPrompt: config.systemPrompt ?? DEFAULT_CHAT_CONFIG.systemPrompt,
      maxTokens: config.maxTokens ?? DEFAULT_CHAT_CONFIG.maxTokens,
      temperature: config.temperature ?? DEFAULT_CHAT_CONFIG.temperature,
    };
  }, [config.modelId, config.systemPrompt, config.maxTokens, config.temperature]);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<LLMStatus>('idle');
  const [mode, setMode] = useState<EngineMode | null>(null);
  const [loadingProgress, setLoadingProgress] = useState<LoadingProgress>({
    text: '',
    progress: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [gpuInfo, setGpuInfo] = useState<string | null>(null);
  const [suggestedModelId, setSuggestedModelId] = useState<string | null>(null);
  const [cachedModelId, setCachedModelId] = useState<string | null>(null);

  const engineRef = useRef<WebLLMEngine | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const initializingRef = useRef<boolean>(false); // Track if initialization is in progress
  const demoResponseIndex = useRef(0);

  // Load messages from IndexedDB on mount
  useEffect(() => {
    const loadStoredMessages = async () => {
      try {
        const stored = await loadMessagesFromStorage();
        if (stored.length > 0) {
          setMessages(stored);
        }
      } catch (err) {
        console.error('Failed to load stored messages:', err);
        // Continue with empty messages - don't crash the app
      }
    };
    loadStoredMessages();
  }, []);

  // Save messages to IndexedDB whenever they change (including when empty to clear storage)
  useEffect(() => {
    saveMessagesToStorage(messages).catch((err) => {
      console.error('Failed to save messages:', err);
    });
  }, [messages]);

  /**
   * Properly dispose of the WebLLM engine
   */
  const disposeEngine = useCallback(async () => {
    if (engineRef.current) {
      try {
        // Abort any pending generation
        abortControllerRef.current?.abort();

        // WebLLM engines may have internal cleanup needed
        // Check if the engine has an unload or dispose method
        const engine = engineRef.current;
        if (typeof engine.unload === 'function') {
          await engine.unload();
        } else if (typeof engine.dispose === 'function') {
          await engine.dispose();
        }
        // Clear the reference
        engineRef.current = null;
      } catch (err) {
        console.error('Error disposing engine:', err);
        // Still clear the reference even if disposal fails
        engineRef.current = null;
      }
    }
  }, []);

  /**
   * Initialize the WebLLM engine or enter demo mode
   */
  const initializeEngine = useCallback(async () => {
    // Prevent concurrent initializations
    if (initializingRef.current) {
      console.log('Initialization already in progress, skipping...');
      return;
    }

    if (engineRef.current || status === 'loading' || status === 'demo') {
      return;
    }

    initializingRef.current = true;

    // If there's a cached model different from the selected one, clear it first
    if (cachedModelId && cachedModelId !== fullConfig.modelId) {
      setLoadingProgress({ text: 'Clearing cached model...', progress: 5 });
      // Properly dispose of the old engine
      await disposeEngine();
      setCachedModelId(null);
    }

    setStatus('loading');
    setError(null);
    setLoadingProgress({ text: 'Checking GPU support...', progress: 5 });

    // Skip GPU check in test environment
    if (isTestEnvironment()) {
      setMode('demo');
      setStatus('demo');
      setGpuInfo('Test environment - Demo mode');
      setLoadingProgress({ text: 'Demo mode active (test environment)', progress: 100 });
      setCachedModelId(fullConfig.modelId);
      initializingRef.current = false;
      return;
    }

    // Check GPU support
    const gpuStatus = await checkGPUSupport();

    if (!gpuStatus.hasGPU) {
      // Enter demo mode
      setMode('demo');
      setStatus('demo');
      setGpuInfo(gpuStatus.error || 'No GPU available');
      setLoadingProgress({
        text: 'Demo mode active - No GPU detected',
        progress: 100,
      });
      setCachedModelId(fullConfig.modelId);
      initializingRef.current = false;
      return;
    }

    // GPU available - try to load the model
    setMode('gpu');
    setGpuInfo(gpuStatus.vendor || 'GPU detected');
    setLoadingProgress({ text: 'Loading AI model...', progress: 10 });

    try {
      // Dynamic import to avoid issues during testing/SSR
      const webllm = await import('@mlc-ai/web-llm');

      // Custom appConfig for SmolLM2-135M-Instruct-q4f32_1-MLC
      let engine;
      if (fullConfig.modelId === 'SmolLM2-135M-Instruct-q4f32_1-MLC') {
        const appConfig = {
          model_list: [
            {
              model: 'https://huggingface.co',
              model_id: 'SmolLM2-135M-Instruct-q4f32_1-MLC',
              model_lib:
                webllm.modelLibURLPrefix +
                webllm.modelVersion +
                '/SmolLM2-135M-Instruct-q4f32_1-ctx2k_cs1k-webgpu.wasm',
            },
          ],
        };
        engine = await webllm.CreateMLCEngine(fullConfig.modelId, {
          appConfig,
          initProgressCallback: (progress: { text: string; progress: number }) => {
            setLoadingProgress({
              text: progress.text,
              progress: Math.round(10 + progress.progress * 90),
            });
          },
        });
      } else {
        engine = await webllm.CreateMLCEngine(fullConfig.modelId, {
          initProgressCallback: (progress: { text: string; progress: number }) => {
            setLoadingProgress({
              text: progress.text,
              progress: Math.round(10 + progress.progress * 90),
            });
          },
        });
      }

      engineRef.current = engine;
      setStatus('ready');
      setLoadingProgress({ text: 'Model loaded successfully!', progress: 100 });
      setSuggestedModelId(null); // Clear any previous suggestions
      setCachedModelId(fullConfig.modelId); // Mark this model as cached
      initializingRef.current = false;
    } catch (err) {
      initializingRef.current = false;
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize LLM';

      // Check if it's a cache/network error (common with service worker issues)
      const errorMessageLower = errorMessage.toLowerCase();
      const isCacheError =
        errorMessageLower.includes('cache') ||
        errorMessageLower.includes('network error') ||
        errorMessageLower.includes('networkerror') ||
        errorMessageLower.includes('failed to fetch');

      // Check if it's a memory/resource error (model too large)
      const isMemoryError =
        errorMessage.includes('memory') ||
        errorMessage.includes('OOM') ||
        errorMessage.includes('Out of memory') ||
        errorMessage.includes('allocation') ||
        errorMessage.includes('buffer');

      // If it's a cache error, provide helpful guidance
      if (isCacheError) {
        setError(
          'Failed to download model files. This may be due to network issues, ' +
            'insufficient disk space, or browser cache limitations. ' +
            'Try: (1) Ensure you have sufficient disk space (2GB+), ' +
            '(2) Clear browser cache and reload, or (3) Try a different browser.'
        );
        setStatus('error');
        console.error('WebLLM cache/network error:', err);
        return;
      }

      // If it's a GPU error, fall back to demo mode
      if (
        errorMessage.includes('GPU') ||
        errorMessage.includes('WebGPU') ||
        errorMessage.includes('adapter')
      ) {
        setMode('demo');
        setStatus('demo');
        setGpuInfo(errorMessage);
        setLoadingProgress({
          text: 'Demo mode active - GPU initialization failed',
          progress: 100,
        });
        return;
      }

      // If it's a memory error, suggest a smaller model
      if (isMemoryError) {
        const supportsShaderF16 = gpuStatus.supportsShaderF16;
        const limitForMobile = shouldUseLowResourceMode();
        const nextSmaller = getNextSmallerModel(
          fullConfig.modelId,
          supportsShaderF16,
          limitForMobile
        );
        const smallestModel = getSmallestModel(supportsShaderF16, limitForMobile);
        const currentModel = getModelById(fullConfig.modelId);
        const currentModelName = currentModel?.name || 'Selected model';

        if (nextSmaller) {
          setSuggestedModelId(nextSmaller.id);
          setError(
            `Model "${currentModelName}" is too large for your device. ` +
              `Try "${nextSmaller.name}" instead (requires ${formatVRAMToGB(nextSmaller.vramMB)}GB). ` +
              `The smallest model "${smallestModel.name}" works on most devices.`
          );
        } else {
          // Already at smallest model, fall back to demo mode
          setMode('demo');
          setStatus('demo');
          setGpuInfo('Insufficient memory for AI models');
          setLoadingProgress({
            text: 'Demo mode active - Insufficient memory',
            progress: 100,
          });
          return;
        }
      } else {
        setError(errorMessage);
      }

      setStatus('error');
      console.error('WebLLM initialization error:', err);
    }
  }, [fullConfig.modelId, status, cachedModelId, disposeEngine]);

  /**
   * Send a message and get a response (real or demo)
   */
  const sendMessage = useCallback(
    async (content: string): Promise<void> => {
      const isDemo = status === 'demo';
      const isReady = status === 'ready';
      const isGeneratingNow = status === 'generating';

      // Prevent concurrent generation - critical race condition fix
      if (isGeneratingNow) {
        console.warn('Generation already in progress, ignoring new request');
        return;
      }

      if (!isDemo && (!engineRef.current || !isReady)) {
        throw new Error('Engine not ready');
      }

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);

      if (isDemo) {
        // Demo mode - provide simulated response
        setStatus('generating'); // Set generating state even in demo
        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: '',
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);

        // Simulate typing effect
        const response = DEMO_RESPONSES[demoResponseIndex.current % DEMO_RESPONSES.length];
        demoResponseIndex.current++;

        for (let i = 0; i <= response.length; i++) {
          // Check if aborted during typing
          if (abortControllerRef.current?.signal.aborted) {
            break;
          }
          await new Promise((resolve) => setTimeout(resolve, 15));
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessage.id ? { ...m, content: response.slice(0, i) } : m
            )
          );
        }

        setStatus('demo'); // Return to demo status
        return;
      }

      // GPU mode - real inference
      setStatus('generating');
      setError(null);
      abortControllerRef.current = new AbortController();

      try {
        // Limit conversation history to prevent memory issues
        // Keep only the most recent messages
        const recentMessages =
          messages.length > MAX_CONVERSATION_MESSAGES
            ? messages.slice(-MAX_CONVERSATION_MESSAGES)
            : messages;

        const conversationHistory = [
          { role: 'system', content: fullConfig.systemPrompt },
          ...recentMessages.map((m) => ({ role: m.role, content: m.content })),
          { role: 'user', content },
        ];

        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: '',
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);

        const completion = await engineRef.current.chat.completions.create({
          messages: conversationHistory,
          max_tokens: fullConfig.maxTokens,
          temperature: fullConfig.temperature,
          stream: true,
        });

        let fullResponse = '';
        for await (const chunk of completion) {
          if (abortControllerRef.current?.signal.aborted) {
            break;
          }
          const delta = chunk.choices[0]?.delta?.content || '';
          fullResponse += delta;

          setMessages((prev) =>
            prev.map((m) => (m.id === assistantMessage.id ? { ...m, content: fullResponse } : m))
          );
        }

        setStatus('ready');
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          setStatus('ready');
          return;
        }

        const errorMessage = err instanceof Error ? err.message : 'Failed to generate response';
        setError(errorMessage);
        setStatus('ready');
        console.error('WebLLM generation error:', err);
      }
    },
    [fullConfig, messages, status]
  );

  /**
   * Stop the current generation
   */
  const stopGeneration = useCallback(() => {
    abortControllerRef.current?.abort();
    if (status === 'generating') {
      setStatus('ready');
    } else if (status === 'demo' && abortControllerRef.current) {
      // In demo mode, return to demo status
      setStatus('demo');
    }
  }, [status]);

  /**
   * Clear all messages from state and storage
   */
  const clearMessages = useCallback(async () => {
    setMessages([]);
    // Clear from storage using the centralized storage utility
    await saveMessagesToStorage([]);
  }, []);

  /**
   * Reset the engine state
   * Note: Does NOT clear messages to maintain chat persistence across model changes
   */
  const reset = useCallback(async () => {
    // Abort any pending operations
    abortControllerRef.current?.abort();
    initializingRef.current = false;

    // Properly dispose of the engine
    await disposeEngine();

    setStatus('idle');
    setMode(null);
    setLoadingProgress({ text: '', progress: 0 });
    setError(null);
    setGpuInfo(null);
    setSuggestedModelId(null);
    setCachedModelId(null);
  }, [disposeEngine]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      initializingRef.current = false;
      // Dispose engine on unmount - note: async cleanup in useEffect is tricky
      // but we can at least try to abort operations
      if (engineRef.current) {
        disposeEngine().catch((err) => {
          console.error('Error disposing engine on unmount:', err);
        });
      }
    };
  }, [disposeEngine]);

  return {
    messages,
    status,
    mode,
    loadingProgress,
    error,
    gpuInfo,
    suggestedModelId,
    cachedModelId,
    initializeEngine,
    sendMessage,
    stopGeneration,
    clearMessages,
    reset,
    isReady: status === 'ready' || status === 'demo' || status === 'generating',
    isLoading: status === 'loading',
    isGenerating: status === 'generating',
    isDemo: status === 'demo',
  };
}

export default useWebLLM;
