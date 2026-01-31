/**
 * Tests for IndexedDB storage utilities
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { saveMessages, loadMessages, clearMessages } from './storage';
import type { ChatMessage } from '../types/chat';

describe('storage utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('when IndexedDB is not available', () => {
    test('saveMessages handles missing IndexedDB gracefully', async () => {
      const messages: ChatMessage[] = [
        {
          id: '1',
          role: 'user',
          content: 'Hello',
          timestamp: new Date('2024-01-01'),
        },
      ];

      // Should not throw
      await expect(saveMessages(messages)).resolves.toBeUndefined();
    });

    test('loadMessages returns empty array when IndexedDB is not available', async () => {
      const messages = await loadMessages();
      expect(messages).toEqual([]);
    });

    test('clearMessages handles missing IndexedDB gracefully', async () => {
      // Should not throw
      await expect(clearMessages()).resolves.toBeUndefined();
    });
  });
});
