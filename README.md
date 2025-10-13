# Seeds Habits

A comprehensive habit tracking and personal productivity application with AI-powered knowledge management.

## Overview

**Seeds Habits** combines habit management, task tracking, journaling, and AI-powered insights into a unified interface. Track your progress, visualize your knowledge, and let AI help you build better habits.

### Core Features

- **Habit Tracking**: Three-phase system (Future, Current, Adopted) with streak tracking
- **Task Management**: Organize tasks with lists and calendar scheduling
- **Diary/Journal**: Capture thoughts and reflections
- **Unified Calendar**: See all your habits, tasks, and diary entries in one view
- **Knowledge Graph** 🧠: Visualize semantic connections in your ChatGPT conversations (NEW!)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account (for database and authentication)

### Installation

```sh
# 1. Clone the repository
git clone <YOUR_GIT_URL>
cd seeds-habits-1

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# 4. Run database migrations
# See DATABASE_SETUP.md for instructions

# 5. Start the development server
npm run dev
```

## Knowledge Graph Feature 🧠

Transform your ChatGPT conversation history into an interactive knowledge network.

### Quick Start

```bash
# 1. Get your ChatGPT conversations export (conversations.txt)
# 2. Add OpenAI API key to .env
# 3. Run the knowledge graph builder
./run-lkg.sh 50

# 4. View in the app by clicking "Knowledge" in the header
```

📚 **Full documentation**: See [docs/knowledge-graph/](./docs/knowledge-graph/)

### What You Get

- **Interactive Graph**: Pan, zoom, click nodes to explore
- **Temporal Visualization**: See how your interests evolved over time
- **Semantic Search**: Find related conversations automatically
- **Insights**: Discover patterns and connections in your knowledge

## Project Structure

```
src/
├── components/         # React components
│   ├── auth/          # Authentication
│   ├── calendar/      # Unified calendar views
│   ├── diary/         # Journal entries
│   ├── habits/        # Habit tracking
│   ├── knowledge/     # Knowledge graph (NEW)
│   ├── layout/        # App layout
│   ├── tasks/         # Task management
│   └── ui/            # shadcn-ui components
├── hooks/             # Custom React hooks
├── lib/               # Utility functions
│   ├── knowledge/     # Knowledge graph logic (NEW)
│   └── ...
├── pages/             # Route pages
├── integrations/      # External service integrations
└── scripts/           # Build and utility scripts

docs/                  # Documentation
└── knowledge-graph/   # Knowledge graph docs
```

## Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI**: shadcn-ui, Tailwind CSS, Radix UI
- **Backend**: Supabase (PostgreSQL, Authentication, Storage)
- **State Management**: TanStack Query (React Query)
- **Graph Visualization**: react-force-graph-2d
- **AI**: OpenAI API (GPT-4o-mini, text-embedding-3-large)

## Available Scripts

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run lint             # Run ESLint
npm run preview          # Preview production build

# Knowledge Graph specific
npm run build-lkg        # Build knowledge graph from conversations
npm run verify-conversations  # Validate conversations.txt
```

## Documentation

- **Knowledge Graph**: [docs/knowledge-graph/](./docs/knowledge-graph/)
  - [Quick Start](./docs/knowledge-graph/README.md)
  - [Setup Guide](./docs/knowledge-graph/SETUP.md)
  - [Architecture](./docs/knowledge-graph/ARCHITECTURE.md)
  - [Context & Design](./docs/knowledge-graph/CONTEXT.md)
- **Database Setup**: See `DATABASE_SETUP.md` (root level)

## Development Workflow

### Using Lovable

Visit the [Lovable Project](https://lovable.dev/projects/649a1ac2-ab38-489a-bccb-97d1b98cb742) and start prompting. Changes made via Lovable will be committed automatically to this repo.

### Local Development

1. Make changes in your IDE
2. Test locally with `npm run dev`
3. Commit and push to trigger Lovable sync

### GitHub Codespaces

- Click "Code" → "Codespaces" → "New codespace"
- Full VS Code environment in your browser
- Changes sync back to the repository

## Deployment

**Quick Deploy**: Open [Lovable](https://lovable.dev/projects/649a1ac2-ab38-489a-bccb-97d1b98cb742) and click Share → Publish.

**Custom Domain**: Navigate to Project → Settings → Domains → Connect Domain

See [Lovable docs](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide) for details.

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

Private project - all rights reserved.

---

**Built with** ❤️ **using React, TypeScript, Supabase, and OpenAI**
