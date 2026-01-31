import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ModelSelector } from './ModelSelector';
import * as modelsUtil from '../utils/models';
import * as gpuUtil from '../utils/gpu';

// Mock the models utility
vi.mock('../utils/models', async () => {
  const actual = await vi.importActual('../utils/models');
  return {
    ...actual,
    estimateAvailableVRAM: vi.fn(),
    recommendModel: vi.fn(),
  };
});

// Mock the GPU utility
vi.mock('../utils/gpu', async () => {
  const actual = await vi.importActual('../utils/gpu');
  return {
    ...actual,
    checkGPUSupport: vi.fn(),
  };
});

describe('ModelSelector', () => {
  const mockOnModelSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Default mocks
    vi.mocked(gpuUtil.checkGPUSupport).mockResolvedValue({
      webGPUSupported: true,
      hasGPU: true,
      supportsShaderF16: true,
    });
    vi.mocked(modelsUtil.estimateAvailableVRAM).mockResolvedValue(4000);
    vi.mocked(modelsUtil.recommendModel).mockResolvedValue({
      id: 'Llama-3.2-3B-Instruct-q4f16_1-MLC',
      name: 'Llama 3.2 3B',
      size: 'medium',
      vramMB: 2263.69,
      description: 'Medium model with better reasoning capabilities',
      lowResource: true,
      shaderType: 'f16',
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('renders the model selector', async () => {
    render(
      <ModelSelector
        selectedModelId="SmolLM2-360M-Instruct-q4f16_1-MLC"
        onModelSelect={mockOnModelSelect}
      />
    );

    expect(screen.getByTestId('model-selector')).toBeInTheDocument();
    expect(screen.getByLabelText('Select AI Model:')).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    render(
      <ModelSelector
        selectedModelId="SmolLM2-360M-Instruct-q4f16_1-MLC"
        onModelSelect={mockOnModelSelect}
      />
    );

    expect(screen.getByText('Detecting resources...')).toBeInTheDocument();
  });

  it('displays resource information after detection', async () => {
    render(
      <ModelSelector
        selectedModelId="SmolLM2-360M-Instruct-q4f16_1-MLC"
        onModelSelect={mockOnModelSelect}
      />
    );

    await waitFor(() => {
      expect(
        screen.getByText(/Estimated GPU Memory: ~3.9GB \(shader-f16 supported\)/)
      ).toBeInTheDocument();
    });
  });

  it('calls onModelSelect when a model is selected', async () => {
    const user = userEvent.setup();
    render(
      <ModelSelector
        selectedModelId="SmolLM2-360M-Instruct-q4f16_1-MLC"
        onModelSelect={mockOnModelSelect}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('model-select-dropdown')).not.toBeDisabled();
    });

    const select = screen.getByTestId('model-select-dropdown');
    await user.selectOptions(select, 'Llama-3.2-1B-Instruct-q4f16_1-MLC');

    expect(mockOnModelSelect).toHaveBeenCalledWith('Llama-3.2-1B-Instruct-q4f16_1-MLC');
  });

  it('shows "Use Recommended" button when not using recommended model', async () => {
    render(
      <ModelSelector
        selectedModelId="SmolLM2-360M-Instruct-q4f16_1-MLC"
        onModelSelect={mockOnModelSelect}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('use-recommended-button')).toBeInTheDocument();
    });
  });

  it('does not show "Use Recommended" button when using recommended model', async () => {
    render(
      <ModelSelector
        selectedModelId="Llama-3.2-3B-Instruct-q4f16_1-MLC"
        onModelSelect={mockOnModelSelect}
      />
    );

    await waitFor(() => {
      expect(screen.queryByTestId('use-recommended-button')).not.toBeInTheDocument();
    });
  });

  it('calls onModelSelect when "Use Recommended" is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ModelSelector
        selectedModelId="SmolLM2-360M-Instruct-q4f16_1-MLC"
        onModelSelect={mockOnModelSelect}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('use-recommended-button')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('use-recommended-button'));

    expect(mockOnModelSelect).toHaveBeenCalledWith('Llama-3.2-3B-Instruct-q4f16_1-MLC');
  });

  it('disables selector when disabled prop is true', () => {
    render(
      <ModelSelector
        selectedModelId="SmolLM2-360M-Instruct-q4f16_1-MLC"
        onModelSelect={mockOnModelSelect}
        disabled={true}
      />
    );

    const select = screen.getByTestId('model-select-dropdown');
    expect(select).toBeDisabled();
  });

  it('shows appropriate message when no GPU is detected', async () => {
    vi.mocked(modelsUtil.estimateAvailableVRAM).mockResolvedValue(0);

    render(
      <ModelSelector
        selectedModelId="SmolLM2-360M-Instruct-q4f16_1-MLC"
        onModelSelect={mockOnModelSelect}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/No GPU detected - models may not work/)).toBeInTheDocument();
    });
  });

  it('handles errors in resource detection gracefully', async () => {
    vi.mocked(modelsUtil.estimateAvailableVRAM).mockRejectedValue(new Error('Detection failed'));
    vi.mocked(modelsUtil.recommendModel).mockRejectedValue(new Error('Recommendation failed'));

    render(
      <ModelSelector
        selectedModelId="SmolLM2-360M-Instruct-q4f16_1-MLC"
        onModelSelect={mockOnModelSelect}
      />
    );

    // Should not crash and should eventually show the dropdown
    await waitFor(() => {
      expect(screen.getByTestId('model-select-dropdown')).not.toBeDisabled();
    });
  });
});
