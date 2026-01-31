/**
 * Tests for ChatPage component
 */

import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatPage } from './ChatPage';
import type { ChatMessage } from './types/chat';

describe('ChatPage', () => {
  const defaultProps = {
    messages: [] as ChatMessage[],
    status: 'ready' as const,
    isGenerating: false,
    isDemo: false,
    onSendMessage: vi.fn(),
    onStopGeneration: vi.fn(),
    onClearMessages: vi.fn(),
  };

  test('renders empty state when no messages', () => {
    render(<ChatPage {...defaultProps} />);
    expect(screen.getByText(/Model loaded! Start chatting/i)).toBeInTheDocument();
  });

  test('renders demo mode empty state', () => {
    render(<ChatPage {...defaultProps} isDemo={true} />);
    expect(screen.getByText(/Demo mode active!/i)).toBeInTheDocument();
  });

  test('renders messages when provided', () => {
    const messages: ChatMessage[] = [
      {
        id: '1',
        role: 'user',
        content: 'Hello',
        timestamp: new Date(),
      },
      {
        id: '2',
        role: 'assistant',
        content: 'Hi there!',
        timestamp: new Date(),
      },
    ];

    render(<ChatPage {...defaultProps} messages={messages} />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Hi there!')).toBeInTheDocument();
  });

  test('shows clear button when messages exist', () => {
    const messages: ChatMessage[] = [
      {
        id: '1',
        role: 'user',
        content: 'Hello',
        timestamp: new Date(),
      },
    ];

    render(<ChatPage {...defaultProps} messages={messages} />);
    expect(screen.getByTestId('clear-button')).toBeInTheDocument();
  });

  test('does not show clear button when no messages', () => {
    render(<ChatPage {...defaultProps} />);
    expect(screen.queryByTestId('clear-button')).not.toBeInTheDocument();
  });

  test('calls onClearMessages when clear button is clicked', async () => {
    const user = userEvent.setup();
    const messages: ChatMessage[] = [
      {
        id: '1',
        role: 'user',
        content: 'Hello',
        timestamp: new Date(),
      },
    ];

    render(<ChatPage {...defaultProps} messages={messages} />);
    await user.click(screen.getByTestId('clear-button'));
    expect(defaultProps.onClearMessages).toHaveBeenCalledTimes(1);
  });

  test('renders chat input', () => {
    render(<ChatPage {...defaultProps} />);
    expect(screen.getByTestId('chat-input')).toBeInTheDocument();
  });

  test('renders messages list', () => {
    render(<ChatPage {...defaultProps} />);
    expect(screen.getByTestId('messages-list')).toBeInTheDocument();
  });
});
