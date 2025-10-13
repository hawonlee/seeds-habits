# Latent Knowledge Graph - Quick Start

Transform your ChatGPT conversation history into an interactive semantic network.

## What is This?

The **Latent Knowledge Graph (LKG)** visualizes the relationships between your AI conversations:

- **Nodes** = Conversations with AI-generated summaries  
- **Edges** = Semantic relationships (computed via embedding similarity)  
- **Colors** = Time progression (blue = old, red = recent)  
- **Size** = Connection count (larger = more related topics)

## Prerequisites

1. ChatGPT `conversations.txt` export file
2. OpenAI API key
3. Supabase project (already configured)
4. Python 3 (optional, for UMAP projection)

## Quick Start (5 minutes)

### 1. Setup Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env and add your credentials:
# - OPENAI_API_KEY (get from OpenAI dashboard)
# - LKG_USER_ID (get from steps below)
```

### 2. Get Your User ID

**Method A**: From the running app
```bash
# Start the app
npm run dev

# Login, then open browser console (F12) and run:
await supabase.auth.getUser().then(r => console.log(r.data.user.id))

# Copy the UUID that appears
```

**Method B**: From Supabase Dashboard
- Go to your Supabase project → Authentication → Users
- Find your user and copy the ID

### 3. Run Database Migration

```bash
# Open Supabase SQL Editor
# Copy contents of supabase/migrations/20250120000008_create_lkg_tables.sql
# Paste and execute
```

### 4. Verify Conversations File

```bash
# Check that your conversations.txt is valid
npm run verify-conversations

# Expected output: "✓ Successfully parsed [N] conversations"
```

### 5. Build the Graph

```bash
# Process first 50 conversations (recommended for testing)
./run-lkg.sh 50

# This will take 2-4 minutes and cost ~$0.10
```

Progress output:
```
=== Latent Knowledge Graph Builder ===
✓ Loading environment from .env file
Configuration:
  - User ID: 217d847a...
  - Conversations to process: 50
  - OpenAI API Key: sk-proj...b8A

Starting build...

Loading conversations...
✓ Loaded 50 conversations

Processing conversations (summarizing + embedding)...
Progress: 5/50
Progress: 10/50
...
Progress: 50/50

Building kNN graph...
Generated 237 edges
Average degree: 4.74

Storing nodes in database...
Stored 50 nodes

Storing edges in database...
Stored 237 edges

=== Build Complete ===
```

### 6. View Your Knowledge Graph

```bash
# Start the app (if not already running)
npm run dev

# In the browser:
# 1. Navigate to your Seeds Habits app
# 2. Click the "Knowledge" button (🧠 brain icon) in the header
# 3. Explore your knowledge graph!
```

## What You'll See

### Interactive Graph
- **Pan**: Click and drag the background
- **Zoom**: Mouse wheel or pinch
- **Click node**: View details and similar conversations
- **Drag node**: Reposition temporarily

### Sidebar
When no node is selected:
- Graph statistics (nodes, edges, density)
- Most connected conversations
- Time span

When a node is selected:
- Conversation title and summary
- Timestamp and message count
- Similar conversations with similarity scores
- Click similar conversations to navigate

### Color Legend
- **Blue** → **Purple** → **Red** = Old → Recent
- **Larger nodes** = More connections
- **Lines (edges)** = Semantic similarity

## Processing More Conversations

```bash
# Process 100 conversations (~$0.20, 4-7 minutes)
./run-lkg.sh 100

# Process 500 conversations (~$1.00, 15-25 minutes)
./run-lkg.sh 500

# Process all conversations (~$2-4, 30-45 minutes)
./run-lkg.sh 1152  # Or however many you have
```

## Configuration

### Adjust Graph Parameters

Edit `src/scripts/buildLKG.ts`:

```typescript
const K_NEIGHBORS = 5;              // More neighbors = denser graph
const SIMILARITY_THRESHOLD = 0.25;  // Higher threshold = fewer edges
```

Recommendations:
- **Sparse graph** (easier to read): k=3-5, threshold=0.3-0.4
- **Dense graph** (more connections): k=10-15, threshold=0.2-0.25

### Adjust Processing Speed

Edit `src/lib/knowledge/embeddingService.ts`:

```typescript
const batchSize = 5;      // Conversations per batch (increase for speed)
const delayMs = 1000;     // Delay between batches (increase if rate limited)
```

## Troubleshooting

### "Missing required environment variables"
- Make sure `.env` file exists with all required variables
- Check that you exported `LKG_USER_ID` or added it to `.env`

### "No authenticated user found"
- Run `./run-lkg.sh` with `LKG_USER_ID` set in `.env`
- Or login to the app first (the script will detect your session)

### "UMAP projection failed"
- **This is optional** - the graph will still work without it
- To fix: `pip install umap-learn numpy`

### "Rate limit error from OpenAI"
- Increase `delayMs` in `embeddingService.ts`
- Decrease `batchSize` for slower but safer processing

### "No knowledge graph data yet" in UI
- Make sure build script completed successfully
- Check database: Go to Supabase → Table Editor → `lkg_nodes` (should have rows)
- Verify `LKG_USER_ID` matches your logged-in user ID

### Graph appears empty
- Refresh the page
- Check browser console for errors
- Verify you're logged in as the same user who ran the build

## Cost Estimates

| Conversations | Time | Cost |
|---------------|------|------|
| 50 | 2-4 min | $0.10 |
| 100 | 4-7 min | $0.20 |
| 500 | 15-25 min | $1.00 |
| 1,152 | 30-45 min | $2-4 |

## Next Steps

Once you have the graph running:

1. **Explore connections**: Click nodes to discover related conversations
2. **Identify clusters**: Look for densely connected regions (topic clusters)
3. **Track evolution**: Follow the color gradient to see how your interests changed
4. **Find insights**: Use the "most connected" list to find central topics

## Documentation

- **CONTEXT.md**: Comprehensive technical context (architecture, design decisions)
- **SETUP.md**: Detailed setup instructions
- **ARCHITECTURE.md**: Deep-dive on implementation

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review `CONTEXT.md` for technical details
3. Check the browser console for error messages

---

**Ready to explore your knowledge landscape? Run `./run-lkg.sh 50` to get started!** 🚀

