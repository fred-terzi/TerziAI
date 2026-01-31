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

  const engineRef = useRef<WebLLMEngine | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const demoResponseIndex = useRef(0);

  /**
   * Initialize the WebLLM engine or enter demo mode
   */
  const initializeEngine = useCallback(async () => {
    if (engineRef.current || status === 'loading' || status === 'demo') {
      return;
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
      return;
    }

    // GPU available - try to load the model
    setMode('gpu');
    setGpuInfo(gpuStatus.vendor || 'GPU detected');
    setLoadingProgress({ text: 'Loading AI model...', progress: 10 });

    try {
      // Dynamic import to avoid issues during testing/SSR
      const webllm = await import('@mlc-ai/web-llm');

      const engine = await webllm.CreateMLCEngine(fullConfig.modelId, {
        initProgressCallback: (progress: { text: string; progress: number }) => {
          setLoadingProgress({
            text: progress.text,
            progress: Math.round(10 + progress.progress * 90),
          });
        },
      });

      engineRef.current = engine;
      setStatus('ready');
      setLoadingProgress({ text: 'Model loaded successfully!', progress: 100 });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize LLM';

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

      setError(errorMessage);
      setStatus('error');
      console.error('WebLLM initialization error:', err);
    }
  }, [fullConfig.modelId, status]);

  /**
   * Send a message and get a response (real or demo)
   */
  const sendMessage = useCallback(
    async (content: string): Promise<void> => {
      const isDemo = status === 'demo';
      const isReady = status === 'ready';

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
          await new Promise((resolve) => setTimeout(resolve, 15));
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessage.id ? { ...m, content: response.slice(0, i) } : m
            )
          );
        }

        return;
      }

      // GPU mode - real inference
      setStatus('generating');
      setError(null);
      abortControllerRef.current = new AbortController();

      try {
        const conversationHistory = [
          { role: 'system', content: fullConfig.systemPrompt },
          ...messages.map((m) => ({ role: m.role, content: m.content })),
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
    }
  }, [status]);

  /**
   * Clear all messages
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  /**
   * Reset the engine state
   */
  const reset = useCallback(() => {
    engineRef.current = null;
    setMessages([]);
    setStatus('idle');
    setMode(null);
    setLoadingProgress({ text: '', progress: 0 });
    setError(null);
    setGpuInfo(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  return {
    messages,
    status,
    mode,
    loadingProgress,
    error,
    gpuInfo,
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
