import { describe, test, expect } from 'vitest';
import type { ChatMessage, ChatConfig, LLMStatus, LoadingProgress } from './chat';
import { DEFAULT_CHAT_CONFIG } from './chat';

describe('Chat Types', () => {
  describe('ChatMessage', () => {
    test('can create a valid user message', () => {
      const message: ChatMessage = {
        id: '123',
        role: 'user',
        content: 'Hello',
        timestamp: new Date(),
      };

      expect(message.id).toBe('123');
      expect(message.role).toBe('user');
      expect(message.content).toBe('Hello');
      expect(message.timestamp).toBeInstanceOf(Date);
    });

    test('can create a valid assistant message', () => {
      const message: ChatMessage = {
        id: '456',
        role: 'assistant',
        content: 'Hi there!',
        timestamp: new Date(),
      };

      expect(message.role).toBe('assistant');
    });

    test('can create a valid system message', () => {
      const message: ChatMessage = {
        id: '789',
        role: 'system',
        content: 'You are a helpful assistant',
        timestamp: new Date(),
      };

      expect(message.role).toBe('system');
    });
  });

  describe('LLMStatus', () => {
    test('all status values are valid', () => {
      const statuses: LLMStatus[] = ['idle', 'loading', 'ready', 'generating', 'error'];

      statuses.forEach((status) => {
        expect(['idle', 'loading', 'ready', 'generating', 'error']).toContain(status);
      });
    });
  });

  describe('LoadingProgress', () => {
    test('can create valid loading progress', () => {
      const progress: LoadingProgress = {
        text: 'Loading model...',
        progress: 50,
      };

      expect(progress.text).toBe('Loading model...');
      expect(progress.progress).toBe(50);
    });
  });

  describe('ChatConfig', () => {
    test('DEFAULT_CHAT_CONFIG has required properties', () => {
      expect(DEFAULT_CHAT_CONFIG).toHaveProperty('modelId');
      expect(DEFAULT_CHAT_CONFIG).toHaveProperty('systemPrompt');
      expect(DEFAULT_CHAT_CONFIG).toHaveProperty('maxTokens');
      expect(DEFAULT_CHAT_CONFIG).toHaveProperty('temperature');
    });

    test('DEFAULT_CHAT_CONFIG has valid values', () => {
      expect(typeof DEFAULT_CHAT_CONFIG.modelId).toBe('string');
      expect(typeof DEFAULT_CHAT_CONFIG.systemPrompt).toBe('string');
      expect(typeof DEFAULT_CHAT_CONFIG.maxTokens).toBe('number');
      expect(typeof DEFAULT_CHAT_CONFIG.temperature).toBe('number');
      expect(DEFAULT_CHAT_CONFIG.maxTokens).toBeGreaterThan(0);
      expect(DEFAULT_CHAT_CONFIG.temperature).toBeGreaterThanOrEqual(0);
      expect(DEFAULT_CHAT_CONFIG.temperature).toBeLessThanOrEqual(2);
    });

    test('can create custom config', () => {
      const customConfig: ChatConfig = {
        modelId: 'custom-model',
        systemPrompt: 'Custom system prompt',
        maxTokens: 1024,
        temperature: 0.5,
      };

      expect(customConfig.modelId).toBe('custom-model');
      expect(customConfig.maxTokens).toBe(1024);
    });
  });
});
