/**
 * Tests for HomePage component
 */

import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HomePage } from './HomePage';

describe('HomePage', () => {
  const defaultProps = {
    selectedModelId: 'Llama-3.2-1B-Instruct-q4f32_1-MLC',
    onModelSelect: vi.fn(),
    onLoadModel: vi.fn(),
    cachedModelId: null,
    status: 'idle' as const,
    gpuInfo: null,
  };

  test('renders welcome message', () => {
    render(<HomePage {...defaultProps} />);
    expect(screen.getByText('Welcome to TerziAI')).toBeInTheDocument();
  });

  test('renders start button', () => {
    render(<HomePage {...defaultProps} />);
    const button = screen.getByTestId('start-button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Load AI Model');
  });

  test('shows cached model info when model is cached', () => {
    render(<HomePage {...defaultProps} cachedModelId="Llama-3.2-1B-Instruct-q4f32_1-MLC" />);
    expect(screen.getByTestId('cached-model-info')).toBeInTheDocument();
  });

  test('does not show cached model info when no model is cached', () => {
    render(<HomePage {...defaultProps} />);
    expect(screen.queryByTestId('cached-model-info')).not.toBeInTheDocument();
  });

  test('shows warning when selected model differs from cached model', () => {
    render(<HomePage {...defaultProps} cachedModelId="SmolLM2-360M-Instruct-q4f16_1-MLC" />);
    expect(screen.getByText(/will clear cached model/i)).toBeInTheDocument();
  });

  test('shows "Clear Cache & Load Model" when cached model differs', () => {
    render(<HomePage {...defaultProps} cachedModelId="SmolLM2-360M-Instruct-q4f16_1-MLC" />);
    expect(screen.getByText('Clear Cache & Load Model')).toBeInTheDocument();
  });

  test('calls onLoadModel when start button is clicked', async () => {
    const user = userEvent.setup();
    render(<HomePage {...defaultProps} />);
    await user.click(screen.getByTestId('start-button'));
    expect(defaultProps.onLoadModel).toHaveBeenCalledTimes(1);
  });

  test('disables start button when loading', () => {
    render(<HomePage {...defaultProps} status="loading" />);
    expect(screen.getByTestId('start-button')).toBeDisabled();
  });

  test('shows GPU info when provided', () => {
    render(<HomePage {...defaultProps} gpuInfo="NVIDIA GPU" />);
    expect(screen.getByTestId('gpu-info')).toBeInTheDocument();
    expect(screen.getByText(/NVIDIA GPU/i)).toBeInTheDocument();
  });
});
