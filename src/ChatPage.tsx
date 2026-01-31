/**
 * Chat Page - Main chat interface
 */

import { useRef, useEffect, useCallback } from 'react';
import { ChatMessage, ChatInput } from './components';
import type { ChatMessage as ChatMessageType, LLMStatus } from './types/chat';

export interface ChatPageProps {
  messages: ChatMessageType[];
  status: LLMStatus;
  isGenerating: boolean;
  isDemo: boolean;
  onSendMessage: (content: string) => Promise<void>;
  onStopGeneration: () => void;
  onClearMessages: () => void;
}

/**
 * Chat page for conversation interface
 */
export function ChatPage({
  messages,
  status,
  isGenerating,
  isDemo,
  onSendMessage,
  onStopGeneration,
  onClearMessages,
}: ChatPageProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    // scrollIntoView may not be available in test environments
    if (messagesEndRef.current?.scrollIntoView) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = useCallback(
    async (content: string) => {
      try {
        await onSendMessage(content);
      } catch (err) {
        console.error('Failed to send message:', err);
      }
    },
    [onSendMessage]
  );

  return (
    <div className="chat-page">
      <div className="chat-container">
        <div className="messages-list" data-testid="messages-list">
          {messages.length === 0 ? (
            <div className="empty-state">
              <p>
                {isDemo
                  ? '⚡ Demo mode active! Try chatting to see how TerziAI works.'
                  : '✨ Model loaded! Start chatting with TerziAI.'}
              </p>
            </div>
          ) : (
            messages.map((message) => <ChatMessage key={message.id} message={message} />)
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="chat-footer">
        <ChatInput
          onSend={handleSendMessage}
          disabled={status === 'loading'}
          isGenerating={isGenerating}
          onStop={onStopGeneration}
          placeholder={isDemo ? 'Try a message (demo mode)...' : 'Ask TerziAI anything...'}
        />
        {messages.length > 0 && (
          <button className="clear-button" onClick={onClearMessages} data-testid="clear-button">
            Clear Chat
          </button>
        )}
      </div>
    </div>
  );
}
