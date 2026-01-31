import type { ChatMessage as ChatMessageType } from '../types/chat';
import './ChatMessage.css';

interface ChatMessageProps {
  /** The message to display */
  message: ChatMessageType;
}

/**
 * Component for displaying a single chat message
 */
export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  return (
    <div
      className={`chat-message ${isUser ? 'user' : ''} ${isAssistant ? 'assistant' : ''}`}
      data-testid={`message-${message.id}`}
    >
      <div className="message-avatar">{isUser ? '👤' : '🤖'}</div>
      <div className="message-content">
        <div className="message-role">{isUser ? 'You' : 'TerziAI'}</div>
        <div className="message-text">{message.content || (isAssistant ? '...' : '')}</div>
        <div className="message-time">{message.timestamp.toLocaleTimeString()}</div>
      </div>
    </div>
  );
}

export default ChatMessage;
