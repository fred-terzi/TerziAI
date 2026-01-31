# TerziAI

Terzi AI is a local AI environment built on web apps. The purpose is to provide ease of use, locally running AI models and tools.

## Features

- Download to your desktop and run locally in your browser.
- Peer to Peer connection via WebRTC for sharing data between users without a server.
- Use a QR code to connect your mobile device to your desktop app.
- **Progressive Web App (PWA)** - Install as a desktop app
- **Local LLM** - Run AI models directly in your browser using WebLLM

## Tech Stack

- **React 19** with TypeScript
- **Vite 7** for fast development and building
- **WebLLM** for browser-based LLM inference
- **Vitest** for testing with coverage
- **ESLint** & **Prettier** for code quality
- **TypeDoc** for documentation generation

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run all checks (lint, format, build, test, docs)
npm run all
```

## Available Scripts

| Script            | Description                                      |
| ----------------- | ------------------------------------------------ |
| `npm run dev`     | Start development server                         |
| `npm run build`   | Build for production                             |
| `npm run test`    | Run tests                                        |
| `npm run test:ci` | Run tests with coverage                          |
| `npm run lint`    | Run ESLint                                       |
| `npm run format`  | Format code with Prettier                        |
| `npm run docs`    | Generate documentation                           |
| `npm run all`     | Run all checks (lint, format, build, test, docs) |

## Project Structure

```
src/
├── components/          # React UI components
│   ├── ChatInput.tsx    # Message input with send/stop
│   ├── ChatMessage.tsx  # Individual message display
│   └── LoadingIndicator.tsx  # Model loading progress
├── hooks/
│   └── useWebLLM.ts     # WebLLM integration hook
├── types/
│   └── chat.ts          # TypeScript type definitions
├── App.tsx              # Main application component
└── main.tsx             # Application entry point
```

## License

See [LICENSE](LICENSE) for details.
