import { useCallback, useState } from 'react';
import { LoadingIndicator } from './components';
import { HomePage } from './HomePage';
import { ChatPage } from './ChatPage';
import { useWebLLM } from './hooks/useWebLLM';
import type { PageType } from './utils/navigation';
import './App.css';

/**
 * TerziAI - Local AI Chat Application
 * A Progressive Web App for running LLMs directly in the browser
 */
function App() {
  const [selectedModelId, setSelectedModelId] = useState('Llama-3.2-1B-Instruct-q4f32_1-MLC');
  const [currentPage, setCurrentPage] = useState<PageType>('home');
  const [menuOpen, setMenuOpen] = useState(false);

  const {
    messages,
    status,
    loadingProgress,
    error,
    gpuInfo,
    suggestedModelId,
    cachedModelId,
    initializeEngine,
    sendMessage,
    stopGeneration,
    clearMessages,
    reset,
    isReady,
    isLoading,
    isGenerating,
    isDemo,
  } = useWebLLM({ modelId: selectedModelId });

  const handleSendMessage = useCallback(
    async (content: string) => {
      try {
        await sendMessage(content);
      } catch (err) {
        console.error('Failed to send message:', err);
      }
    },
    [sendMessage]
  );

  const handleModelSelect = useCallback(
    (modelId: string) => {
      setSelectedModelId(modelId);
      // Reset the engine when changing models
      reset();
    },
    [reset]
  );

  const handleLoadModel = useCallback(() => {
    initializeEngine();
    // Navigate to chat page after loading starts
    setCurrentPage('chat');
  }, [initializeEngine]);

  const handleNavigate = useCallback((page: PageType) => {
    setCurrentPage(page);
    setMenuOpen(false);
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <div className="menu-container">
          <button
            className="menu-button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
            data-testid="menu-button"
          >
            ☰
          </button>
          {menuOpen && (
            <div className="menu-dropdown" data-testid="menu-dropdown">
              <button
                className="menu-item"
                onClick={() => handleNavigate('home')}
                data-testid="nav-home"
              >
                🏠 Home
              </button>
              <button
                className="menu-item"
                onClick={() => handleNavigate('chat')}
                disabled={!isReady && !isLoading}
                data-testid="nav-chat"
              >
                💬 Chat
              </button>
            </div>
          )}
        </div>
        <div className="app-logo">🤖</div>
        <div className="app-title">
          <h1>TerziAI</h1>
          <span className="app-subtitle">Local AI Chat</span>
        </div>
        <div className="app-status">
          <span className={`status-indicator ${status}`} />
          <span className="status-text">{isDemo ? 'demo' : status}</span>
        </div>
      </header>

      {isDemo && (
        <div className="demo-banner" data-testid="demo-banner">
          <span className="demo-icon">⚡</span>
          <span>Demo Mode - {gpuInfo || 'No GPU detected'}</span>
        </div>
      )}

      <main className="app-main">
        {isLoading && <LoadingIndicator progress={loadingProgress} visible={true} />}

        {error && (
          <div className="error-message" data-testid="error-message">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
            <div className="error-actions">
              <button onClick={initializeEngine} className="retry-button">
                Retry
              </button>
              {suggestedModelId && (
                <button
                  onClick={() => handleModelSelect(suggestedModelId)}
                  className="use-suggested-button"
                  data-testid="use-suggested-button"
                >
                  Try Suggested Model
                </button>
              )}
            </div>
          </div>
        )}

        {currentPage === 'home' && !isLoading && !error && (
          <HomePage
            selectedModelId={selectedModelId}
            onModelSelect={handleModelSelect}
            onLoadModel={handleLoadModel}
            cachedModelId={cachedModelId}
            status={status}
            gpuInfo={gpuInfo}
          />
        )}

        {currentPage === 'chat' && isReady && !error && (
          <ChatPage
            messages={messages}
            status={status}
            isGenerating={isGenerating}
            isDemo={isDemo}
            onSendMessage={handleSendMessage}
            onStopGeneration={stopGeneration}
            onClearMessages={clearMessages}
          />
        )}
      </main>
    </div>
  );
}

export default App;
