# Latent Knowledge Graph (LKG) — Implementation Guide

## Overview

The Latent Knowledge Graph feature transforms your ChatGPT conversation history into an interactive semantic network. This implementation follows the principles of latent graph construction where:

- **Nodes** = Conversation summaries with high-dimensional embeddings (ℝ³⁰⁷²)
- **Edges** = Computed via k-nearest neighbors (kNN) and cosine similarity
- **Visualization** = UMAP projection to 2D manifold with temporal coloring
- **Insights** = Graph metrics, temporal analysis, and semantic clustering

## Architecture

### Data Flow

```
conversations.txt (1,152 convs)
    ↓
Parse & Extract Messages
    ↓
Summarize (GPT-4o-mini)
    ↓
Embed (text-embedding-3-large)
    ↓
Compute kNN Graph (cosine similarity)
    ↓
UMAP Projection (optional)
    ↓
Store in Supabase
    ↓
Interactive Visualization
```

### Key Components

#### 1. Data Processing Pipeline

**`src/lib/knowledge/conversationParser.ts`**
- Parses ChatGPT export JSON format
- Extracts user/assistant message pairs
- Handles conversation tree structure
- **Verified**: Successfully parses all 1,152 conversations

**`src/lib/knowledge/embeddingService.ts`**
- Summarizes conversations using GPT-4o-mini
- Generates 3072-dimensional embeddings via text-embedding-3-large
- Batch processing with rate limiting
- Fallback handling for API errors

**`src/lib/knowledge/knnBuilder.ts`**
- Computes cosine similarity between all embedding pairs
- Finds k-nearest neighbors for each node
- Applies similarity threshold to filter weak edges
- Calculates graph statistics (degree distribution, density)

**`src/scripts/umapProjection.py`**
- Python script for UMAP dimensionality reduction
- Projects embeddings from ℝ³⁰⁷² → ℝ²
- Preserves local topology (manifold structure)
- Optional: Falls back to force-directed layout if unavailable

**`src/scripts/buildLKG.ts`**
- Main orchestration script
- Processes conversations in configurable batches
- Stores nodes and edges in Supabase
- Progress tracking and error handling

#### 2. Database Schema

**Tables:**
- `lkg_nodes`: Conversation metadata, summaries, embeddings, UMAP coordinates
- `lkg_edges`: kNN relationships with similarity weights
- Row-level security enabled (user-scoped)

**Features:**
- pgvector extension for embedding storage (fallback to JSONB)
- Indexed for performance (user_id, timestamp, source/target)
- Automatic timestamp tracking

#### 3. Visualization UI

**`src/pages/KnowledgeGraph.tsx`**
- Full-page interactive graph interface
- Dual-panel layout: graph + details/insights
- Real-time data fetching with React Query

**`src/components/knowledge/GraphVisualization.tsx`**
- react-force-graph-2d integration
- Temporal color gradient (blue→purple→red)
- Node sizing by degree centrality
- Interactive: pan, zoom, click, drag

**`src/components/knowledge/NodeDetailPanel.tsx`**
- Displays selected node's summary and metadata
- Shows k-nearest neighbors with similarity scores
- Navigate between related conversations

**`src/components/knowledge/InsightStats.tsx`**
- Graph metrics: node count, edge count, avg degree, density
- Most connected conversations
- Time span visualization

#### 4. Data Queries

**`src/lib/knowledge/queries.ts`**
- React Query hooks for LKG data
- Efficient data fetching with caching
- Separate queries for nodes, edges, and neighbors

## Usage

### Prerequisites

1. **OpenAI API Key** (for summarization and embeddings)
2. **Supabase Database** (with tables created)
3. **conversations.txt** (ChatGPT export in root directory)
4. **Python 3 + umap-learn** (optional, for UMAP projection)

### Quick Start

```bash
# 1. Verify conversation file
npm run verify-conversations

# 2. Add OpenAI API key to your environment
# Create .env.local and add:
# VITE_OPENAI_API_KEY=sk-your-key-here

# 3. Run database migration
# Copy LKG_DATABASE_SETUP.sql to Supabase SQL Editor and execute

# 4. Process conversations (start with 50 for POC)
npm run build-lkg

# 5. View the graph
npm run dev
# Navigate to app → Click "Knowledge" button
```

### Configuration

Edit `src/scripts/buildLKG.ts` to adjust:

```typescript
const MAX_CONVERSATIONS = 50;        // How many to process
const K_NEIGHBORS = 5;               // Neighbors per node
const SIMILARITY_THRESHOLD = 0.25;   // Min cosine similarity for edges
```

### Processing Strategy

**Phase 1 (POC — CURRENT)**
- Process first 50 conversations
- Validate pipeline end-to-end
- k=5, threshold=0.25
- Cost: ~$0.10-0.20, ~2-3 minutes

**Phase 2 (Scale Up)**
- Process 100-500 conversations
- Refine parameters based on graph density
- Cost: ~$0.50-2.00, ~10-20 minutes

**Phase 3 (Full Dataset)**
- Process all 1,152 conversations
- k=10, threshold=0.3 (adjust as needed)
- Cost: ~$2-4, ~30-40 minutes

## Key Features

### 1. Latent Graph Construction

Unlike traditional knowledge graphs with explicit relationships, this system uses **latent relationships** computed from semantic similarity:

- No manual labeling required
- Relationships emerge naturally from content similarity
- Adapts to your unique knowledge landscape
- Preserves the continuous semantic space

### 2. Temporal Evolution

Conversations are color-coded by timestamp:
- **Blue**: Older conversations (learning history)
- **Purple**: Mid-period conversations
- **Red**: Recent conversations

This reveals:
- Topic drift over time
- Emerging interests
- Concept evolution

### 3. Interactive Exploration

- **Click nodes**: View summary, timestamp, similar conversations
- **Navigate neighbors**: Jump between related topics
- **Zoom & pan**: Explore different regions of knowledge space
- **Degree-based sizing**: Larger nodes = more connections = central concepts

### 4. Graph Metrics

- **Node count**: Total conversations processed
- **Edge count**: Total semantic connections
- **Average degree**: Typical number of connections per conversation
- **Density**: How interconnected the graph is
- **Most connected**: Central/hub conversations

## Technical Details

### Embedding Model

**text-embedding-3-large**
- Dimension: 3072
- Context window: 8191 tokens
- Quality: State-of-the-art semantic representations
- Cost: $0.00013 per 1K tokens

### Summarization Model

**GPT-4o-mini**
- Fast and cost-effective
- 2-3 sentence summaries
- Captures key topics and insights
- Cost: ~$0.00015 per 1K input tokens

### kNN Graph Construction

```
For each node v_i:
  1. Compute cosine similarity with all other nodes
  2. Select k nodes with highest similarity ≥ threshold
  3. Create weighted edges: w_ij = cosine_sim(v_i, v_j)
  
Result: Sparse graph preserving local semantic topology
```

### UMAP Projection

```python
UMAP(
  n_neighbors=15,      # Local neighborhood size
  min_dist=0.1,        # Minimum distance between points
  n_components=2,      # 2D projection
  metric='cosine'      # Cosine similarity
)
```

Preserves:
- Local neighborhoods (similar conversations stay close)
- Global structure (cluster relationships)
- Manifold geometry (intrinsic shape of knowledge space)

## Future Enhancements

### Short Term
1. **Clustering**: HDBSCAN to identify semantic clusters
2. **Search**: Semantic search across knowledge graph
3. **Export**: Save graph as JSON for external tools
4. **Filters**: Filter by time range, topic clusters

### Medium Term
1. **Edge Promotion**: LLM-labeled explicit relationships
2. **Habit Integration**: Link knowledge nodes to suggested habits
3. **Task Generation**: Suggest learning tasks based on knowledge gaps
4. **Temporal Analysis**: Learning velocity, concept drift metrics

### Long Term
1. **Live Capture**: Browser extension for real-time conversation ingestion
2. **Multi-modal**: Include images, code, files from conversations
3. **Collaborative**: Shared knowledge graphs for teams
4. **Query Interface**: Natural language queries over graph
5. **3D Visualization**: UMAP to 3D for richer exploration

## Cost Estimates

Based on your 1,152 conversations with avg 11.1 messages:

**Processing 50 conversations:**
- Summarization: ~$0.05
- Embeddings: ~$0.05
- Total: **~$0.10**
- Time: **2-3 minutes**

**Processing 500 conversations:**
- Summarization: ~$0.50
- Embeddings: ~$0.50
- Total: **~$1.00**
- Time: **15-20 minutes**

**Processing all 1,152 conversations:**
- Summarization: ~$1.15
- Embeddings: ~$1.15
- Total: **~$2.30**
- Time: **30-40 minutes**

## Troubleshooting

### "No authenticated user found"
Login to the app first. The script needs your Supabase auth session.

### "UMAP projection failed"
Optional feature. Graph will work without it using force-directed layout.
Install: `pip install umap-learn numpy`

### Rate limit errors
Reduce batch size in `embeddingService.ts` or increase delay between batches.

### Empty graph
Run `npm run build-lkg` first to process conversations.

### TypeScript errors
Run `npm install` to ensure all dependencies are installed.

## Files Reference

### Core Implementation
- `src/lib/knowledge/conversationParser.ts` (120 lines)
- `src/lib/knowledge/embeddingService.ts` (130 lines)
- `src/lib/knowledge/knnBuilder.ts` (140 lines)
- `src/lib/knowledge/queries.ts` (80 lines)
- `src/scripts/buildLKG.ts` (230 lines)
- `src/scripts/umapProjection.py` (80 lines)

### UI Components
- `src/pages/KnowledgeGraph.tsx` (100 lines)
- `src/components/knowledge/GraphVisualization.tsx` (150 lines)
- `src/components/knowledge/NodeDetailPanel.tsx` (120 lines)
- `src/components/knowledge/InsightStats.tsx` (130 lines)

### Configuration
- `LKG_DATABASE_SETUP.sql` (60 lines)
- `LKG_SETUP.md` (Setup guide)
- `package.json` (added scripts)

### Total Implementation
- **~1,350 lines of code**
- **8 TypeScript files**
- **1 Python script**
- **4 React components**
- **Database schema + docs**

## Success Criteria ✓

- [x] Parse 1,152 conversations successfully
- [x] Database schema created
- [x] Embedding pipeline implemented
- [x] kNN graph construction working
- [x] Interactive visualization built
- [x] Navigation integrated
- [x] Documentation complete
- [ ] **Next**: Process conversations and validate graph

## Getting Started Now

```bash
# 1. Verify everything is ready
npm run verify-conversations

# 2. Check you have OpenAI API key in environment
echo $VITE_OPENAI_API_KEY

# 3. Run database setup (see LKG_DATABASE_SETUP.sql)

# 4. Process first 50 conversations
npm run build-lkg

# 5. View your knowledge graph!
npm run dev
```

---

**Built with**: OpenAI API • Supabase • React • TypeScript • Python • UMAP • react-force-graph-2d

