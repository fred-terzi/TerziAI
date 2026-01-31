import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatInput } from './ChatInput';

describe('ChatInput', () => {
  test('renders input field', () => {
    render(<ChatInput onSend={() => {}} />);
    expect(screen.getByTestId('chat-input')).toBeInTheDocument();
  });

  test('renders send button', () => {
    render(<ChatInput onSend={() => {}} />);
    expect(screen.getByTestId('send-button')).toBeInTheDocument();
  });

  test('send button is disabled when input is empty', () => {
    render(<ChatInput onSend={() => {}} />);
    const sendButton = screen.getByTestId('send-button');
    expect(sendButton).toBeDisabled();
  });

  test('send button is enabled when input has text', () => {
    render(<ChatInput onSend={() => {}} />);
    const input = screen.getByTestId('chat-input');
    fireEvent.change(input, { target: { value: 'Hello' } });
    const sendButton = screen.getByTestId('send-button');
    expect(sendButton).not.toBeDisabled();
  });

  test('calls onSend when form is submitted', () => {
    const mockOnSend = vi.fn();
    render(<ChatInput onSend={mockOnSend} />);

    const input = screen.getByTestId('chat-input');
    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.submit(input.closest('form')!);

    expect(mockOnSend).toHaveBeenCalledWith('Hello');
  });

  test('clears input after sending', () => {
    const mockOnSend = vi.fn();
    render(<ChatInput onSend={mockOnSend} />);

    const input = screen.getByTestId('chat-input') as HTMLTextAreaElement;
    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.submit(input.closest('form')!);

    expect(input.value).toBe('');
  });

  test('shows stop button when generating', () => {
    render(<ChatInput onSend={() => {}} isGenerating={true} onStop={() => {}} />);
    expect(screen.getByTestId('stop-button')).toBeInTheDocument();
  });

  test('calls onStop when stop button is clicked', () => {
    const mockOnStop = vi.fn();
    render(<ChatInput onSend={() => {}} isGenerating={true} onStop={mockOnStop} />);

    fireEvent.click(screen.getByTestId('stop-button'));
    expect(mockOnStop).toHaveBeenCalled();
  });

  test('input is disabled when disabled prop is true', () => {
    render(<ChatInput onSend={() => {}} disabled={true} />);
    expect(screen.getByTestId('chat-input')).toBeDisabled();
  });

  test('displays custom placeholder', () => {
    render(<ChatInput onSend={() => {}} placeholder="Custom placeholder" />);
    expect(screen.getByPlaceholderText('Custom placeholder')).toBeInTheDocument();
  });

  test('sends message on Enter key', () => {
    const mockOnSend = vi.fn();
    render(<ChatInput onSend={mockOnSend} />);

    const input = screen.getByTestId('chat-input');
    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: false });

    expect(mockOnSend).toHaveBeenCalledWith('Hello');
  });

  test('does not send message on Shift+Enter', () => {
    const mockOnSend = vi.fn();
    render(<ChatInput onSend={mockOnSend} />);

    const input = screen.getByTestId('chat-input');
    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: true });

    expect(mockOnSend).not.toHaveBeenCalled();
  });
});
