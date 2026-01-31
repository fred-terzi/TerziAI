import { useRef, useEffect, useCallback } from 'react';
import { ChatMessage, ChatInput, LoadingIndicator } from './components';
import { useWebLLM } from './hooks/useWebLLM';
import './App.css';

/**
 * TerziAI - Local AI Chat Application
 * A Progressive Web App for running LLMs directly in the browser
 */
function App() {
  const {
    messages,
    status,
    loadingProgress,
    error,
    gpuInfo,
    initializeEngine,
    sendMessage,
    stopGeneration,
    clearMessages,
    isReady,
    isLoading,
    isGenerating,
    isDemo,
  } = useWebLLM();

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
        await sendMessage(content);
      } catch (err) {
        console.error('Failed to send message:', err);
      }
    },
    [sendMessage]
  );

  return (
    <div className="app">
      <header className="app-header">
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
        {status === 'idle' && (
          <div className="welcome-screen" data-testid="welcome-screen">
            <div className="welcome-icon">🚀</div>
            <h2>Welcome to TerziAI</h2>
            <p>
              Run AI models locally in your browser. Your conversations stay private and work
              offline.
            </p>
            <button className="start-button" onClick={initializeEngine} data-testid="start-button">
              Load AI Model
            </button>
            <p className="model-info">Using SmolLM2-360M (lightweight model for fast responses)</p>
            <p className="model-info">Falls back to demo mode if no GPU is detected</p>
          </div>
        )}

        {isLoading && <LoadingIndicator progress={loadingProgress} visible={true} />}

        {error && (
          <div className="error-message" data-testid="error-message">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
            <button onClick={initializeEngine} className="retry-button">
              Retry
            </button>
          </div>
        )}

        {isReady && (
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
        )}
      </main>

      {isReady && (
        <footer className="app-footer">
          <ChatInput
            onSend={handleSendMessage}
            disabled={isLoading}
            isGenerating={isGenerating}
            onStop={stopGeneration}
            placeholder={isDemo ? 'Try a message (demo mode)...' : 'Ask TerziAI anything...'}
          />
          {messages.length > 0 && (
            <button className="clear-button" onClick={clearMessages} data-testid="clear-button">
              Clear Chat
            </button>
          )}
        </footer>
      )}
    </div>
  );
}

export default App;
