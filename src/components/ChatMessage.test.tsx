import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChatMessage } from './ChatMessage';
import type { ChatMessage as ChatMessageType } from '../types/chat';

describe('ChatMessage', () => {
  const baseMessage: ChatMessageType = {
    id: 'test-id-1',
    role: 'user',
    content: 'Hello, world!',
    timestamp: new Date('2024-01-15T10:30:00'),
  };

  test('renders message content', () => {
    render(<ChatMessage message={baseMessage} />);
    expect(screen.getByText('Hello, world!')).toBeInTheDocument();
  });

  test('renders user message with correct styling', () => {
    render(<ChatMessage message={baseMessage} />);
    const messageElement = screen.getByTestId(`message-${baseMessage.id}`);
    expect(messageElement).toHaveClass('user');
  });

  test('renders assistant message with correct styling', () => {
    const assistantMessage: ChatMessageType = {
      ...baseMessage,
      id: 'test-id-2',
      role: 'assistant',
      content: 'Hi there!',
    };
    render(<ChatMessage message={assistantMessage} />);
    const messageElement = screen.getByTestId(`message-${assistantMessage.id}`);
    expect(messageElement).toHaveClass('assistant');
  });

  test('displays user label for user messages', () => {
    render(<ChatMessage message={baseMessage} />);
    expect(screen.getByText('You')).toBeInTheDocument();
  });

  test('displays TerziAI label for assistant messages', () => {
    const assistantMessage: ChatMessageType = {
      ...baseMessage,
      role: 'assistant',
    };
    render(<ChatMessage message={assistantMessage} />);
    expect(screen.getByText('TerziAI')).toBeInTheDocument();
  });

  test('displays timestamp', () => {
    render(<ChatMessage message={baseMessage} />);
    // Check that some time format is displayed
    const timeElement = screen.getByText(/\d{1,2}:\d{2}/);
    expect(timeElement).toBeInTheDocument();
  });

  test('displays user avatar emoji', () => {
    render(<ChatMessage message={baseMessage} />);
    expect(screen.getByText('👤')).toBeInTheDocument();
  });

  test('displays assistant avatar emoji', () => {
    const assistantMessage: ChatMessageType = {
      ...baseMessage,
      role: 'assistant',
    };
    render(<ChatMessage message={assistantMessage} />);
    expect(screen.getByText('🤖')).toBeInTheDocument();
  });

  test('shows typing animation for empty assistant message', () => {
    const assistantMessage: ChatMessageType = {
      ...baseMessage,
      role: 'assistant',
      content: '',
    };
    render(<ChatMessage message={assistantMessage} />);
    expect(screen.getByTestId('typing-indicator')).toBeInTheDocument();
  });

  test('typing indicator contains three animated dots', () => {
    const assistantMessage: ChatMessageType = {
      ...baseMessage,
      role: 'assistant',
      content: '',
    };
    render(<ChatMessage message={assistantMessage} />);
    const typingIndicator = screen.getByTestId('typing-indicator');
    const dots = typingIndicator.querySelectorAll('span');
    expect(dots).toHaveLength(3);
  });

  test('does not show typing animation when message has content', () => {
    const assistantMessage: ChatMessageType = {
      ...baseMessage,
      role: 'assistant',
      content: 'Hello there!',
    };
    render(<ChatMessage message={assistantMessage} />);
    expect(screen.queryByTestId('typing-indicator')).not.toBeInTheDocument();
    expect(screen.getByText('Hello there!')).toBeInTheDocument();
  });
});
