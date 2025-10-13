# Latent Knowledge Graph Setup

This guide will help you set up and run the Latent Knowledge Graph (LKG) feature.

## Prerequisites

1. **OpenAI API Key**: You'll need an OpenAI API key for summarization and embedding generation
2. **Supabase Setup**: Database tables must be created
3. **ChatGPT Export**: Your `conversations.txt` file in the root directory
4. **Python 3** (optional): For UMAP projection (can skip for initial testing)

## Step 1: Database Setup

Run the SQL script in your Supabase SQL Editor:

```bash
# Copy contents of LKG_DATABASE_SETUP.sql and paste into Supabase SQL Editor
# Or use Supabase CLI:
supabase db push
```

The script creates:
- `lkg_nodes` table: Stores conversation summaries and embeddings
- `lkg_edges` table: Stores kNN relationships
- Appropriate indexes and RLS policies

## Step 2: Environment Variables

Add your OpenAI API key to `.env.local`:

```bash
VITE_OPENAI_API_KEY=sk-your-api-key-here
```

Make sure you also have your Supabase credentials (should already be set):

```bash
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Step 3: Install Python Dependencies (Optional)

For UMAP visualization projection:

```bash
pip install umap-learn numpy
```

Note: UMAP is optional for POC. The graph will still work without it using force-directed layout.

## Step 4: Process Conversations

Run the build script to process your conversations:

```bash
# Process first 50 conversations (default for POC)
npm run build-lkg

# Or process more conversations:
LKG_MAX_CONVERSATIONS=100 npm run build-lkg

# Process all conversations:
LKG_MAX_CONVERSATIONS=1152 npm run build-lkg
```

The script will:
1. Parse `conversations.txt`
2. Summarize each conversation using GPT-4o-mini
3. Generate embeddings using text-embedding-3-large
4. Compute kNN graph with similarity threshold
5. (Optional) Run UMAP projection to 2D
6. Store everything in Supabase

**Note**: Processing takes time and costs money (OpenAI API). Estimate:
- ~50 conversations: $0.10-0.20, ~2-3 minutes
- ~1000 conversations: $2-4, ~30-40 minutes

Progress will be shown in the terminal.

## Step 5: View the Knowledge Graph

1. Start the dev server: `npm run dev`
2. Navigate to the app
3. Click the "Knowledge" button in the header
4. Explore your knowledge graph!

## Features

- **Interactive Graph**: Pan, zoom, click nodes
- **Temporal Coloring**: Blue (old) to Red (new) gradient
- **Node Details**: Click any node to see summary and similar conversations
- **Graph Statistics**: View metrics like edge density, most connected topics
- **Similarity Search**: See related conversations by clicking nodes

## Configuration

You can adjust parameters in `src/scripts/buildLKG.ts`:

```typescript
const K_NEIGHBORS = 5;              // Number of nearest neighbors
const SIMILARITY_THRESHOLD = 0.25;  // Minimum cosine similarity for edges
const MAX_CONVERSATIONS = 50;       // Number of conversations to process
```

## Troubleshooting

### "No authenticated user found"

Make sure you're logged into the app first. The script uses your Supabase auth to associate nodes with your user.

### Python/UMAP errors

UMAP is optional. The script will continue without it and use force-directed layout instead. To fix:

```bash
pip install umap-learn numpy
```

### API Rate Limits

The script includes rate limiting (5 conversations per batch, 1 second delay). If you hit limits, reduce batch size or add delays in `embeddingService.ts`.

### "No knowledge graph data yet"

Run `npm run build-lkg` first to process conversations.

## Future Enhancements

Once POC is validated:
- Increase to full conversation set
- Fine-tune k and threshold parameters
- Implement temporal analysis features
- Add semantic search
- Link knowledge nodes to suggested habits
- Browser extension for live conversation capture

