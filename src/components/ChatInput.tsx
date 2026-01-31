import { useState, useCallback, type FormEvent, type KeyboardEvent } from 'react';
import './ChatInput.css';

interface ChatInputProps {
  /** Callback when a message is submitted */
  onSend: (message: string) => void;
  /** Whether the input should be disabled */
  disabled?: boolean;
  /** Whether a message is currently being generated */
  isGenerating?: boolean;
  /** Callback to stop generation */
  onStop?: () => void;
  /** Placeholder text */
  placeholder?: string;
}

/**
 * Chat input component with send functionality
 */
export function ChatInput({
  onSend,
  disabled = false,
  isGenerating = false,
  onStop,
  placeholder = 'Type a message...',
}: ChatInputProps) {
  const [input, setInput] = useState('');

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      const trimmedInput = input.trim();
      if (trimmedInput && !disabled && !isGenerating) {
        onSend(trimmedInput);
        setInput('');
      }
    },
    [input, disabled, isGenerating, onSend]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const trimmedInput = input.trim();
        if (trimmedInput && !disabled && !isGenerating) {
          onSend(trimmedInput);
          setInput('');
        }
      }
    },
    [input, disabled, isGenerating, onSend]
  );

  return (
    <form className="chat-input-form" onSubmit={handleSubmit}>
      <div className="chat-input-container">
        <textarea
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          aria-label="Chat message input"
          data-testid="chat-input"
        />
        {isGenerating ? (
          <button
            type="button"
            className="chat-button stop"
            onClick={onStop}
            aria-label="Stop generation"
            data-testid="stop-button"
          >
            ⏹️ Stop
          </button>
        ) : (
          <button
            type="submit"
            className="chat-button send"
            disabled={disabled || !input.trim()}
            aria-label="Send message"
            data-testid="send-button"
          >
            ➤ Send
          </button>
        )}
      </div>
      <div className="chat-input-hint">Press Enter to send, Shift+Enter for new line</div>
    </form>
  );
}

export default ChatInput;
