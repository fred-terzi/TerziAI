/**
 * Represents a single chat message in the conversation
 */
export interface ChatMessage {
  /** Unique identifier for the message */
  id: string;
  /** Role of the message sender */
  role: 'user' | 'assistant' | 'system';
  /** Content of the message */
  content: string;
  /** Timestamp when the message was created */
  timestamp: Date;
}

/**
 * Status of the LLM engine
 */
export type LLMStatus = 'idle' | 'loading' | 'ready' | 'generating' | 'error' | 'demo';

/**
 * Engine mode - GPU accelerated or demo mode
 */
export type EngineMode = 'gpu' | 'demo';

/**
 * Progress information during model loading
 */
export interface LoadingProgress {
  /** Current loading step description */
  text: string;
  /** Progress percentage (0-100) */
  progress: number;
}

/**
 * Configuration for the chat engine
 */
export interface ChatConfig {
  /** Model ID to use */
  modelId: string;
  /** System prompt for the assistant */
  systemPrompt: string;
  /** Maximum tokens to generate */
  maxTokens: number;
  /** Temperature for generation (0-2) */
  temperature: number;
}

/**
 * Default chat configuration
 */
export const DEFAULT_CHAT_CONFIG: ChatConfig = {
  modelId: 'Llama-3.2-1B-Instruct-q4f32_1-MLC',
  systemPrompt:
    "You are TerziAI, a helpful local AI assistant. You are running directly in the user's browser using WebLLM. Be concise and helpful.",
  maxTokens: 512,
  temperature: 0.7,
};
