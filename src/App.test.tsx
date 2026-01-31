import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';
import * as useWebLLMModule from './hooks/useWebLLM';

// Mock the WebLLM hook
vi.mock('./hooks/useWebLLM', () => ({
  useWebLLM: vi.fn(() => ({
    messages: [],
    status: 'idle',
    mode: null,
    loadingProgress: { text: '', progress: 0 },
    error: null,
    gpuInfo: null,
    suggestedModelId: null,
    initializeEngine: vi.fn(),
    sendMessage: vi.fn(),
    stopGeneration: vi.fn(),
    clearMessages: vi.fn(),
    reset: vi.fn(),
    isReady: false,
    isLoading: false,
    isGenerating: false,
    isDemo: false,
  })),
}));

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('renders TerziAI heading', () => {
    render(<App />);
    expect(screen.getByText('TerziAI')).toBeInTheDocument();
  });

  test('renders welcome screen when status is idle', () => {
    render(<App />);
    expect(screen.getByTestId('welcome-screen')).toBeInTheDocument();
    expect(screen.getByText('Welcome to TerziAI')).toBeInTheDocument();
  });

  test('renders start button on welcome screen', () => {
    render(<App />);
    const startButton = screen.getByTestId('start-button');
    expect(startButton).toBeInTheDocument();
    expect(startButton).toHaveTextContent('Load AI Model');
  });

  test('displays correct status indicator', () => {
    render(<App />);
    expect(screen.getByText('idle')).toBeInTheDocument();
  });
});

describe('App - Loading State', () => {
  beforeEach(() => {
    vi.mocked(useWebLLMModule.useWebLLM).mockReturnValue({
      messages: [],
      status: 'loading',
      mode: null,
      loadingProgress: { text: 'Loading model...', progress: 50 },
      error: null,
      gpuInfo: null,
      suggestedModelId: null,
      initializeEngine: vi.fn(),
      sendMessage: vi.fn(),
      stopGeneration: vi.fn(),
      clearMessages: vi.fn(),
      reset: vi.fn(),
      isReady: false,
      isLoading: true,
      isGenerating: false,
      isDemo: false,
    });
  });

  test('shows loading indicator when loading', () => {
    render(<App />);
    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
    expect(screen.getByText('Loading model...')).toBeInTheDocument();
  });
});

describe('App - Ready State', () => {
  beforeEach(() => {
    vi.mocked(useWebLLMModule.useWebLLM).mockReturnValue({
      messages: [],
      status: 'ready',
      mode: 'gpu',
      loadingProgress: { text: 'Ready', progress: 100 },
      error: null,
      gpuInfo: 'GPU detected',
      suggestedModelId: null,
      initializeEngine: vi.fn(),
      sendMessage: vi.fn(),
      stopGeneration: vi.fn(),
      clearMessages: vi.fn(),
      reset: vi.fn(),
      isReady: true,
      isLoading: false,
      isGenerating: false,
      isDemo: false,
    });
  });

  test('shows chat interface when ready', () => {
    render(<App />);
    expect(screen.getByTestId('messages-list')).toBeInTheDocument();
    expect(screen.getByTestId('chat-input')).toBeInTheDocument();
    expect(screen.getByTestId('send-button')).toBeInTheDocument();
  });

  test('shows empty state when no messages', () => {
    render(<App />);
    expect(screen.getByText(/Model loaded! Start chatting/i)).toBeInTheDocument();
  });
});

describe('App - Demo Mode', () => {
  beforeEach(() => {
    vi.mocked(useWebLLMModule.useWebLLM).mockReturnValue({
      messages: [],
      status: 'demo',
      mode: 'demo',
      loadingProgress: { text: 'Demo mode active', progress: 100 },
      error: null,
      gpuInfo: 'No GPU detected',
      suggestedModelId: null,
      initializeEngine: vi.fn(),
      sendMessage: vi.fn(),
      stopGeneration: vi.fn(),
      clearMessages: vi.fn(),
      reset: vi.fn(),
      isReady: true,
      isLoading: false,
      isGenerating: false,
      isDemo: true,
    });
  });

  test('shows demo banner in demo mode', () => {
    render(<App />);
    expect(screen.getByTestId('demo-banner')).toBeInTheDocument();
    expect(screen.getByText(/No GPU detected/i)).toBeInTheDocument();
  });

  test('shows demo-specific empty state message', () => {
    render(<App />);
    expect(screen.getByText(/Demo mode active/i)).toBeInTheDocument();
  });
});

describe('App - With Messages', () => {
  const mockMessages = [
    { id: '1', role: 'user' as const, content: 'Hello', timestamp: new Date() },
    { id: '2', role: 'assistant' as const, content: 'Hi there!', timestamp: new Date() },
  ];

  beforeEach(() => {
    vi.mocked(useWebLLMModule.useWebLLM).mockReturnValue({
      messages: mockMessages,
      status: 'ready',
      mode: 'gpu',
      loadingProgress: { text: 'Ready', progress: 100 },
      error: null,
      gpuInfo: 'GPU detected',
      suggestedModelId: null,
      initializeEngine: vi.fn(),
      sendMessage: vi.fn(),
      stopGeneration: vi.fn(),
      clearMessages: vi.fn(),
      reset: vi.fn(),
      isReady: true,
      isLoading: false,
      isGenerating: false,
      isDemo: false,
    });
  });

  test('renders messages', () => {
    render(<App />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Hi there!')).toBeInTheDocument();
  });

  test('shows clear button when messages exist', () => {
    render(<App />);
    expect(screen.getByTestId('clear-button')).toBeInTheDocument();
  });
});

describe('App - Error State', () => {
  beforeEach(() => {
    vi.mocked(useWebLLMModule.useWebLLM).mockReturnValue({
      messages: [],
      status: 'error',
      mode: null,
      loadingProgress: { text: '', progress: 0 },
      error: 'Failed to load model',
      gpuInfo: null,
      suggestedModelId: null,
      initializeEngine: vi.fn(),
      sendMessage: vi.fn(),
      stopGeneration: vi.fn(),
      clearMessages: vi.fn(),
      reset: vi.fn(),
      isReady: false,
      isLoading: false,
      isGenerating: false,
      isDemo: false,
    });
  });

  test('shows error message', () => {
    render(<App />);
    expect(screen.getByTestId('error-message')).toBeInTheDocument();
    expect(screen.getByText('Failed to load model')).toBeInTheDocument();
  });

  test('shows retry button on error', () => {
    render(<App />);
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });
});
