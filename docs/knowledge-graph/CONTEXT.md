# Latent Knowledge Graph - Comprehensive Context

**Last Updated**: October 13, 2025  
**Status**: Proof of Concept (POC) - Ready for Production Hardening  
**Version**: 1.0.0

---

## Table of Contents

1. [Feature Overview](#feature-overview)
2. [Architecture & Design Decisions](#architecture--design-decisions)
3. [Code Structure](#code-structure)
4. [Database Schema](#database-schema)
5. [API Integrations](#api-integrations)
6. [Configuration & Environment](#configuration--environment)
7. [Processing Pipeline](#processing-pipeline)
8. [UI Components](#ui-components)
9. [Extension Points](#extension-points)
10. [Known Limitations & TODOs](#known-limitations--todos)
11. [Cost & Performance](#cost--performance)
12. [Security Considerations](#security-considerations)

---

## Feature Overview

### What is the Latent Knowledge Graph (LKG)?

The LKG transforms a user's ChatGPT conversation history into an **interactive semantic network** where:

- **Nodes** = Individual conversations with AI-generated summaries
- **Edges** = Semantic relationships computed via k-nearest neighbors (kNN) using embedding similarity
- **Visualization** = Interactive force-directed graph with temporal coloring

### Purpose

The LKG serves as the foundation for AI-enhanced features in Seeds Habits:

1. **Knowledge Discovery**: Visualize topics you've explored with AI
2. **Concept Evolution**: Track how your interests and questions change over time
3. **Semantic Search**: Find related conversations by semantic similarity (future)
4. **Habit Suggestions**: Derive habits from recurring themes in conversations (future)
5. **Dynamic Task Generation**: Create learning tasks from knowledge gaps (future)

### Key Innovation: "Latent" Relationships

Unlike traditional knowledge graphs with explicit, manually-labeled relationships, the LKG uses **latent relationships** that emerge automatically from semantic similarity:

- No manual labeling required
- Scales to thousands of conversations
- Adapts to each user's unique knowledge landscape
- Preserves continuous semantic space (not discrete categories)

---

## Architecture & Design Decisions

### Why Latent Over Explicit?

**Problem with Explicit Graphs:**
- Requires manual relationship labeling (e.g., "relates_to", "extends", "contradicts")
- Doesn't scale: N conversations → N² potential relationships to label
- Brittle: Hard to change ontology after labeling
- Misses nuanced relationships

**Latent Graph Approach:**
- Relationships computed from high-dimensional embeddings
- Continuous similarity scores (not binary connections)
- Automatically adapts to new conversations
- Captures semantic nuance

### Why kNN + Threshold?

**Strategy**: Find k-nearest neighbors with cosine similarity ≥ threshold

**Rationale:**
- **Sparse but connected**: Each node has ~5-10 connections (not N-1)
- **Local topology preserved**: Similar conversations cluster together
- **Computational efficiency**: O(N²) similarity calculation, manageable for N<10K
- **Tuneable**: Adjust k and threshold to control graph density

**Alternatives Considered:**
1. **Fully connected graph**: Too dense, loses signal
2. **Distance threshold only**: Risk of isolated nodes
3. **Hierarchical clustering**: Loses continuous space, rigid structure
4. **Community detection**: Overkill for POC, can add later

### Why UMAP for Visualization?

**UMAP** (Uniform Manifold Approximation and Projection) projects 3072-dimensional embeddings → 2D

**Advantages:**
- Preserves **both** local and global structure (better than t-SNE)
- Faster than t-SNE for large datasets
- Theoretically grounded (Riemannian geometry)
- Configurable (n_neighbors, min_dist control preservation vs. compression)

**Fallback**: Force-directed layout if UMAP unavailable (still shows graph structure, just no manifold projection)

### Why Supabase for Storage?

**Decision**: Store nodes and edges in Supabase PostgreSQL with pgvector extension

**Rationale:**
1. **Consistency**: Already using Supabase for app data
2. **pgvector**: Native vector similarity search (future: query by embedding)
3. **RLS**: Row-level security ties data to users
4. **Relational**: Easy to join nodes, edges, and user data
5. **Real-time subscriptions**: Future feature (live graph updates)

**Alternative Considered**: Neo4j or other graph DB → Overkill, adds complexity

### Why OpenAI Embeddings?

**Model**: `text-embedding-3-large` (3072 dimensions)

**Rationale:**
- State-of-the-art semantic quality
- Large dimension → rich representation
- Fixed dimension → consistent graph structure
- Cost-effective ($0.00013 per 1K tokens)

**Alternative**: Open-source models (e.g., Sentence-BERT) → Lower quality, self-hosting complexity

### Why GPT-4o-mini for Summarization?

**Rationale:**
- Fast and cost-effective ($0.00015 per 1K input tokens)
- Good quality for 2-3 sentence summaries
- Same provider as embeddings (simpler integration)

**Alternative**: Claude → More expensive, unnecessary for summaries

---

## Code Structure

### Directory Layout

```
src/
├── lib/knowledge/              # Core LKG logic
│   ├── conversationParser.ts  # Parse ChatGPT export JSON
│   ├── embeddingService.ts    # OpenAI summarization & embedding
│   ├── knnBuilder.ts           # kNN graph construction
│   └── queries.ts              # React Query hooks for data fetching
├── components/knowledge/       # UI components
│   ├── GraphVisualization.tsx  # Main force-directed graph
│   ├── NodeDetailPanel.tsx     # Side panel with node details
│   └── InsightStats.tsx        # Graph metrics dashboard
├── pages/
│   └── KnowledgeGraph.tsx      # Full-page LKG interface
└── scripts/
    ├── buildLKG.ts             # Main build orchestration
    ├── umapProjection.py       # Python UMAP projection
    └── verifyConversations.ts  # Validate conversations.txt

docs/knowledge-graph/           # Documentation
├── CONTEXT.md                  # This file
├── README.md                   # Quick start guide
├── SETUP.md                    # Detailed setup
└── ARCHITECTURE.md             # Technical deep-dive

supabase/migrations/
└── 20250120000008_create_lkg_tables.sql  # Database schema
```

### Module Responsibilities

#### `conversationParser.ts` (164 lines)

**Purpose**: Parse ChatGPT's complex nested JSON format

**Key Functions:**
- `parseConversations()`: Main entry point, returns `ParsedConversation[]`
- `extractMessages()`: Traverse conversation tree (DFS), handle branching
- `formatConversationText()`: Convert to LLM-friendly text format
- `loadConversationsFromFile()`: File I/O wrapper

**Input**: `conversations.txt` (ChatGPT export JSON)  
**Output**: Array of conversations with extracted messages

**Edge Cases Handled:**
- Conversations with no messages (skipped)
- Branching conversations (follows first child, main thread)
- Missing timestamps (graceful degradation)
- Malformed JSON (logged, skipped)

#### `embeddingService.ts` (150 lines)

**Purpose**: AI processing (summarization + embedding)

**Key Functions:**
- `summarizeConversation()`: GPT-4o-mini → 2-3 sentence summary
- `generateEmbedding()`: text-embedding-3-large → 3072-dim vector
- `processConversation()`: Combines summarization + embedding
- `processBatch()`: Batch processing with rate limiting

**Rate Limiting Strategy:**
- Batch size: 5 conversations
- Delay between batches: 1000ms
- Prevents OpenAI rate limit errors

**Error Handling:**
- API errors: Logged, fallback to first message as summary
- Retry logic: None (POC simplicity, add later)

#### `knnBuilder.ts` (165 lines)

**Purpose**: Compute kNN graph from embeddings

**Key Functions:**
- `cosineSimilarity()`: Efficient dot product implementation
- `findKNearestNeighbors()`: Brute-force O(N²) similarity, top-k selection
- `buildKNNGraph()`: Main orchestration, returns edges
- `calculateGraphStats()`: Degree distribution, density, top nodes

**Algorithm:**
```
For each node i:
  1. Compute cosine similarity with all nodes j≠i
  2. Filter: keep similarities ≥ threshold
  3. Sort descending, take top k
  4. Create edges: (i, j, weight=similarity)
```

**Performance**: O(N² × D) where D=3072 (embedding dimension)
- N=50: ~3-5 seconds
- N=1000: ~5-10 minutes
- Future optimization: Approximate NN (FAISS, Annoy)

#### `queries.ts` (120 lines)

**Purpose**: React Query data layer

**Hooks:**
- `useLKGNodes()`: Fetch all conversation nodes
- `useLKGEdges()`: Fetch all graph edges
- `useLKGGraph()`: Combined nodes + edges
- `useNodeNeighbors()`: Fetch similar conversations for a node

**Features:**
- Automatic caching (5 minutes default)
- Refetch on window focus
- Error handling with React Query retry logic
- TypeScript types for all data structures

#### `buildLKG.ts` (319 lines)

**Purpose**: Main build script, orchestrates entire pipeline

**Process Flow:**
1. Validate environment variables (OpenAI key, Supabase URL, user ID)
2. Load conversations from `conversations.txt`
3. Summarize conversations (batched, rate-limited)
4. Generate embeddings (batched)
5. Build kNN graph (cosine similarity + threshold)
6. Store nodes in Supabase (`lkg_nodes` table)
7. Store edges in Supabase (`lkg_edges` table)
8. Run UMAP projection (optional, Python subprocess)
9. Update nodes with UMAP coordinates
10. Display statistics

**Configuration:**
```typescript
const MAX_CONVERSATIONS = 50;        // Limit for POC
const K_NEIGHBORS = 5;               // k for kNN
const SIMILARITY_THRESHOLD = 0.25;   // Min cosine similarity
```

**Error Handling:**
- User ID validation: Try auth, fallback to env var, else error
- Database errors: Logged, script continues (partial success)
- UMAP errors: Warn, continue without coordinates

#### `umapProjection.py` (80 lines)

**Purpose**: Dimensionality reduction for visualization

**Algorithm**: UMAP (Uniform Manifold Approximation and Projection)

**Parameters:**
```python
n_neighbors=15,      # Larger = more global structure
min_dist=0.1,        # Smaller = tighter clusters
metric='cosine',     # Match graph edge metric
n_components=2       # 2D for visualization
```

**Input/Output**: JSON via stdin/stdout (Node.js ↔ Python)

**Optional Dependency**: `pip install umap-learn numpy`

---

## Database Schema

### Tables

#### `lkg_nodes` - Conversation Nodes

```sql
CREATE TABLE lkg_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id TEXT NOT NULL,        -- ChatGPT conversation ID
  title TEXT NOT NULL,
  summary TEXT NOT NULL,                -- GPT-4o-mini generated
  embedding vector(3072),               -- text-embedding-3-large
  timestamp TIMESTAMPTZ NOT NULL,       -- Conversation create_time
  umap_x REAL,                          -- UMAP 2D projection (optional)
  umap_y REAL,
  metadata JSONB DEFAULT '{}',          -- {message_count, ...}
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes:**
- `idx_lkg_nodes_user` on `user_id` (RLS queries)
- `idx_lkg_nodes_timestamp` on `timestamp` (temporal queries)
- `idx_lkg_nodes_conversation` on `conversation_id` (uniqueness)

#### `lkg_edges` - Graph Relationships

```sql
CREATE TABLE lkg_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_id UUID NOT NULL REFERENCES lkg_nodes(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES lkg_nodes(id) ON DELETE CASCADE,
  weight REAL NOT NULL,                 -- cosine similarity [0, 1]
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes:**
- `idx_lkg_edges_source` on `source_id` (neighbor queries)
- `idx_lkg_edges_target` on `target_id` (bidirectional queries)
- `idx_lkg_edges_user` on `user_id` (RLS queries)

### Row-Level Security (RLS)

**Policies:**
```sql
-- Users can only access their own nodes
CREATE POLICY "Users manage their own nodes" 
ON lkg_nodes FOR ALL 
USING (auth.uid() = user_id);

-- Users can only access their own edges
CREATE POLICY "Users manage their own edges" 
ON lkg_edges FOR ALL 
USING (auth.uid() = user_id);
```

**Security Model**: All data is user-scoped. No cross-user visibility.

### pgvector Extension

**Purpose**: Enables native vector operations in PostgreSQL

**Used For:**
- Storing embeddings efficiently (vector(3072) column type)
- Future: Cosine similarity search directly in SQL

**Future Optimization:**
```sql
-- Create vector index for fast similarity search
CREATE INDEX ON lkg_nodes USING ivfflat (embedding vector_cosine_ops);
```

---

## API Integrations

### OpenAI API

**Endpoints Used:**

1. **Chat Completions** (`/v1/chat/completions`)
   - Model: `gpt-4o-mini`
   - Purpose: Summarize conversations
   - Cost: ~$0.00015 per 1K input tokens
   - Rate limit: 500 requests/minute (Tier 1)

2. **Embeddings** (`/v1/embeddings`)
   - Model: `text-embedding-3-large`
   - Purpose: Generate semantic embeddings
   - Output dimension: 3072
   - Cost: ~$0.00013 per 1K input tokens
   - Rate limit: 3,000 requests/minute

**Authentication**: API key via `OPENAI_API_KEY` environment variable

**Error Handling:**
- Rate limit errors: Batch delay (1000ms) prevents this
- API errors: Logged, fallback to basic summary
- Network errors: Unhandled (script fails, re-run from checkpoint)

**Future Improvements:**
- Retry logic with exponential backoff
- Checkpoint system (save progress, resume on failure)
- Cost tracking (log tokens used per conversation)

### Supabase API

**Client**: `@supabase/supabase-js`

**Authentication**: Anon key with RLS (user-scoped queries)

**Queries:**
1. **Insert nodes**: Batch insert to `lkg_nodes`
2. **Insert edges**: Batch insert (100 per batch) to `lkg_edges`
3. **Fetch graph**: Select all nodes + edges for user
4. **Fetch neighbors**: Join `lkg_edges` → `lkg_nodes` on target_id

**Error Handling:**
- RLS errors: Validate user_id before insert
- Network errors: Unhandled (re-run script)

---

## Configuration & Environment

### Required Environment Variables

```bash
# OpenAI API (for LKG build)
OPENAI_API_KEY=sk-...

# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...

# LKG Build Configuration
LKG_USER_ID=uuid-of-user                # User to associate data with
LKG_MAX_CONVERSATIONS=50                # Limit for processing
```

### Setup Files

1. **`.env.example`**: Template for required variables
2. **`.env`**: User-specific credentials (gitignored)
3. **`run-lkg.sh`**: Helper script that loads .env and runs build

### Build Configuration

**In `src/scripts/buildLKG.ts`:**

```typescript
const MAX_CONVERSATIONS = process.env.LKG_MAX_CONVERSATIONS 
  ? parseInt(process.env.LKG_MAX_CONVERSATIONS) 
  : 50;
const K_NEIGHBORS = 5;
const SIMILARITY_THRESHOLD = 0.25;
```

**Tuning Guidelines:**
- **k**: Higher = denser graph, lower = sparser (typical: 5-15)
- **threshold**: Higher = fewer edges (typical: 0.2-0.4)
- Start with defaults, adjust based on graph density

---

## Processing Pipeline

### End-to-End Flow

```
conversations.txt
    ↓
[conversationParser.ts]
ParsedConversation[]
    ↓
[embeddingService.ts]
Summarize (GPT-4o-mini) → ConversationSummary[]
    ↓
[embeddingService.ts]
Embed (text-embedding-3-large) → ConversationEmbedding[]
    ↓
[knnBuilder.ts]
Compute kNN graph → GraphEdge[]
    ↓
[buildLKG.ts]
Store nodes in lkg_nodes
    ↓
[buildLKG.ts]
Store edges in lkg_edges
    ↓
[umapProjection.py] (optional)
UMAP projection → (x, y) coordinates
    ↓
[buildLKG.ts]
Update lkg_nodes.umap_x, umap_y
    ↓
Done ✓
```

### Processing Stages

**Stage 1: Parsing** (1-2 seconds)
- Read `conversations.txt` (JSON file)
- Parse nested conversation structure
- Extract user/assistant messages
- Output: ~1152 conversations

**Stage 2: Summarization** (1-3 minutes for 50 convs)
- Batch: 5 conversations at a time
- Call GPT-4o-mini with prompt template
- Fallback on API errors
- Output: 2-3 sentence summaries

**Stage 3: Embedding** (1-2 minutes for 50 convs)
- Batch: 5 conversations at a time
- Call text-embedding-3-large
- Output: 3072-dimensional vectors

**Stage 4: kNN Graph** (3-10 seconds for 50 convs)
- Brute-force cosine similarity: O(N²)
- For each node: find k nearest neighbors ≥ threshold
- Output: ~125-250 edges (depends on similarity distribution)

**Stage 5: Database Insert** (5-10 seconds)
- Insert nodes (one by one, map conversation_id → db id)
- Batch insert edges (100 per batch)
- Handle RLS constraints

**Stage 6: UMAP Projection** (5-15 seconds, optional)
- Spawn Python subprocess
- Send embeddings via stdin (JSON)
- Receive 2D coordinates via stdout
- Update lkg_nodes with coordinates

**Total Time:** 2-5 minutes for 50 conversations

---

## UI Components

### Page: `KnowledgeGraph.tsx`

**Layout:**
```
+------------------+------------------+
|                  |                  |
|  Graph           |   Sidebar        |
|  Visualization   |   (Details or    |
|                  |    Insights)     |
|                  |                  |
+------------------+------------------+
```

**State Management:**
- `selectedNode`: Currently clicked node (for detail panel)
- `useLKGGraph()`: Fetches nodes + edges via React Query

**Features:**
- Loading state with spinner
- Error state with retry button
- Refresh button to refetch data

### Component: `GraphVisualization.tsx`

**Library**: `react-force-graph-2d`

**Node Rendering:**
- **Color**: Temporal gradient (blue → purple → red)
  - Computed from `timestamp` (oldest=blue, newest=red)
- **Size**: Degree-based (more connections = larger)
  - Radius: 4 + (degree / maxDegree) * 6

**Edge Rendering:**
- **Color**: Light gray (#999)
- **Opacity**: Based on weight (similarity)
- **Width**: Fixed (1px)

**Interactions:**
- **Click node**: Trigger `onNodeClick()` callback → show details
- **Drag node**: Repositioning (temporary, resets on reload)
- **Pan**: Click-drag background
- **Zoom**: Mouse wheel (limits: 0.5x - 4x)

**Layout:**
- **With UMAP**: Use `umap_x`, `umap_y` coordinates
- **Without UMAP**: Force-directed layout (d3-force)

**Legend:**
- Color gradient visualization
- Size explanation text

### Component: `NodeDetailPanel.tsx`

**Purpose**: Display details of selected node

**Content:**
- Conversation title
- Summary (AI-generated)
- Timestamp (formatted)
- Message count
- List of k-nearest neighbors:
  - Title
  - Similarity score (0-1, formatted as percentage)
  - Click to navigate to that node

**Data Fetching:**
- `useNodeNeighbors(nodeId)`: Queries edges + joins nodes
- Real-time fetch when node selected

### Component: `InsightStats.tsx`

**Purpose**: Dashboard of graph metrics

**Metrics Displayed:**
- Node count
- Edge count
- Average degree (edges per node)
- Graph density (actual edges / max possible edges)
- Time span (first to last conversation)
- Top 5 most connected conversations (by degree)

**Calculations:**
- All computed client-side from `nodes[]` and `edges[]`
- Degree map: Count edges per node
- Density: edges / (N * (N-1) / 2)

---

## Extension Points

### Short-Term Extensions (1-2 weeks)

#### 1. Semantic Search
**Goal**: Search graph by natural language query

**Implementation:**
1. Embed user query with text-embedding-3-large
2. Compute cosine similarity with all node embeddings
3. Return top-k most similar conversations
4. Highlight matching nodes in graph

**Files to modify:**
- New: `src/components/knowledge/SearchBar.tsx`
- Update: `src/pages/KnowledgeGraph.tsx` (add search UI)
- New: `src/lib/knowledge/search.ts` (search logic)

#### 2. Time Range Filtering
**Goal**: Filter graph to show conversations from specific time period

**Implementation:**
1. Add date range picker UI
2. Filter `nodes` array by `timestamp`
3. Filter `edges` to only those between filtered nodes
4. Re-render graph

**Files to modify:**
- New: `src/components/knowledge/TimeRangeFilter.tsx`
- Update: `src/pages/KnowledgeGraph.tsx` (add filter state)

#### 3. Cluster Detection & Labeling
**Goal**: Automatically identify topic clusters, label with LLM

**Implementation:**
1. Run HDBSCAN or Louvain clustering on embeddings
2. For each cluster: extract representative summaries
3. Send to GPT-4o-mini: "Label this cluster in 2-3 words"
4. Display cluster labels on graph (color-coded regions)

**Files to modify:**
- New: `src/lib/knowledge/clustering.ts`
- Update: `src/components/knowledge/GraphVisualization.tsx` (cluster colors)
- Update: Database schema (add `cluster_id` to `lkg_nodes`)

### Medium-Term Extensions (1-2 months)

#### 4. Habit Suggestions from Knowledge
**Goal**: Suggest new habits based on recurring themes in conversations

**Implementation:**
1. Identify high-degree nodes (central topics)
2. Extract keywords/themes from summaries
3. Prompt GPT-4: "Suggest a habit related to learning [theme]"
4. Present suggestions in UI
5. One-click create habit

**Files to modify:**
- New: `src/lib/knowledge/habitSuggestions.ts`
- New: `src/components/knowledge/SuggestedHabits.tsx`
- Update: `src/pages/KnowledgeGraph.tsx` (integrate UI)

#### 5. Dynamic Task Generation
**Goal**: Generate learning tasks from knowledge gaps

**Implementation:**
1. Detect sparse regions in graph (low-density areas)
2. Identify "bridge" topics (connect distant clusters)
3. Prompt GPT-4: "Generate learning task to connect [topic A] and [topic B]"
4. Add tasks to Seeds Habits task list

**Files to modify:**
- New: `src/lib/knowledge/taskGeneration.ts`
- Update: `src/hooks/useTasks.tsx` (add generated tasks)

#### 6. Export & Sharing
**Goal**: Export graph as JSON, share via link

**Implementation:**
1. Add export button → download graph as JSON
2. (Optional) Generate shareable link (public graph view)
3. (Optional) PDF export with static graph image

**Files to modify:**
- New: `src/lib/knowledge/export.ts`
- Update: `src/pages/KnowledgeGraph.tsx` (export button)

### Long-Term Extensions (3-6 months)

#### 7. Live Conversation Capture
**Goal**: Browser extension to capture new ChatGPT conversations in real-time

**Implementation:**
1. Build Chrome/Firefox extension
2. Inject script into ChatGPT page
3. Listen for new messages → post to Seeds Habits API
4. Real-time graph updates (Supabase subscriptions)

**New repos:**
- `seeds-chatgpt-extension` (browser extension)
- `seeds-api` (backend API for ingestion)

#### 8. Multi-Modal Knowledge Graph
**Goal**: Include images, code snippets, files from conversations

**Implementation:**
1. Parse non-text content from ChatGPT export
2. Use CLIP embeddings for images
3. Use code embeddings (e.g., CodeBERT) for code
4. Multi-modal graph (different node types)

**Challenges:**
- Embedding alignment across modalities
- Increased storage (images)

#### 9. Collaborative Knowledge Graphs
**Goal**: Shared graphs for teams, cross-user connections

**Implementation:**
1. Add `team_id` to database schema
2. Update RLS policies for team-based access
3. Privacy controls (which conversations to share)
4. Merge multiple users' graphs

---

## Known Limitations & TODOs

### Current Limitations

1. **No Incremental Updates**
   - **Issue**: Re-running build processes ALL conversations again
   - **Impact**: Costly ($2-4) and slow (30-40 min) to rebuild full graph
   - **TODO**: Add incremental mode (process only new conversations)

2. **No Error Recovery**
   - **Issue**: If script fails mid-processing, must restart from beginning
   - **Impact**: Wasted API costs
   - **TODO**: Checkpoint system (save progress, resume on failure)

3. **No Cost Tracking**
   - **Issue**: Don't know exactly how much each build costs
   - **Impact**: Budget uncertainty
   - **TODO**: Log tokens used, calculate cost per conversation

4. **Brute-Force kNN is Slow**
   - **Issue**: O(N²) cosine similarity doesn't scale beyond ~10K conversations
   - **Impact**: >10K conversations = very slow
   - **TODO**: Use approximate NN library (FAISS, Annoy)

5. **No Bidirectional Edges**
   - **Issue**: Graph is directed (A→B doesn't imply B→A)
   - **Impact**: Asymmetric neighbor relationships
   - **TODO**: Add reverse edges or treat as undirected

6. **UMAP is Optional But Valuable**
   - **Issue**: Requires Python dependency, some users skip it
   - **Impact**: Lose manifold projection, fall back to less informative layout
   - **TODO**: Make UMAP installation easier (Docker?) or use JS implementation

7. **No Conversation Content Search**
   - **Issue**: Can only search by title/summary, not full conversation text
   - **Impact**: Miss relevant conversations if summary doesn't capture key term
   - **TODO**: Add full-text search (PostgreSQL FTS or Elasticsearch)

### Security TODOs

1. **Exposed API Keys in Scripts**
   - **Status**: ✅ FIXED (moved to .env, added .gitignore)

2. **No Supabase Service Role Key**
   - **Issue**: Build script uses anon key, which requires auth session
   - **Impact**: Complex workaround (LKG_USER_ID env var)
   - **TODO**: Use service role key for admin operations (careful: don't commit!)

3. **No Rate Limit Handling**
   - **Issue**: If OpenAI rate limit hit, script crashes
   - **TODO**: Detect 429 errors, retry with exponential backoff

### Performance TODOs

1. **Optimize Embedding Storage**
   - **Issue**: Storing 3072-float embeddings as JSONB (inefficient)
   - **Status**: Using pgvector (vector(3072)) ✅
   - **TODO**: Add ivfflat index for fast similarity search

2. **Parallelize Processing**
   - **Issue**: Conversations processed sequentially (batches of 5)
   - **TODO**: Increase batch size or add parallelism (careful: rate limits)

3. **Precompute Expensive Queries**
   - **Issue**: Calculating graph stats on every page load
   - **TODO**: Cache stats in database (update on graph rebuild)

### UI/UX TODOs

1. **Better Error Messages**
   - **Issue**: Generic error messages, hard to debug
   - **TODO**: Specific error codes, user-friendly explanations

2. **Loading Progress**
   - **Issue**: Long load times with no progress indication
   - **TODO**: Add progress bar for build script, skeleton loading for UI

3. **Mobile Optimization**
   - **Issue**: Force-graph interactions awkward on mobile
   - **TODO**: Add mobile-specific controls (pinch-zoom, tap interactions)

4. **Graph Performance for Large Datasets**
   - **Issue**: 1000+ nodes may lag in browser
   - **TODO**: Add virtualization, level-of-detail rendering

---

## Cost & Performance

### Processing Costs (OpenAI API)

**Assumptions:**
- Average conversation: 11.1 messages (from 1,152 conversations)
- Average tokens per message: 100 (estimate)

**Per Conversation:**
- Summarization: ~1,110 input tokens × $0.00015 = $0.00017
- Embedding: ~200 input tokens (title + summary) × $0.00013 = $0.000026
- **Total: ~$0.0002 per conversation**

**Batch Estimates:**
- 50 conversations: $0.10
- 100 conversations: $0.20
- 500 conversations: $1.00
- 1,152 conversations: $2.30

### Processing Time

**Breakdown (for 50 conversations):**
- Parsing: 1-2 seconds
- Summarization: 60-90 seconds (batch of 5, 1s delay)
- Embedding: 60-90 seconds
- kNN graph: 5-10 seconds
- Database insert: 5-10 seconds
- UMAP: 10-15 seconds
- **Total: 2-4 minutes**

**Scaling:**
- 100 conversations: ~4-7 minutes
- 500 conversations: ~15-25 minutes
- 1,152 conversations: ~30-45 minutes

### Storage Costs (Supabase)

**Per Conversation:**
- Node row: ~10 KB (embedding as JSONB or vector)
- Edge rows (avg 5): ~5 × 0.1 KB = 0.5 KB
- **Total: ~10.5 KB per conversation**

**Batch Estimates:**
- 50 conversations: ~525 KB
- 1,152 conversations: ~12 MB

**Conclusion**: Storage is negligible (Supabase free tier: 500 MB)

### Query Performance

**Current Performance (No Indexes):**
- Fetch all nodes: ~50ms for 50 nodes
- Fetch all edges: ~100ms for 250 edges
- Fetch neighbors: ~20ms per node

**With pgvector Index (Future):**
- Semantic search: ~10-50ms per query

---

## Security Considerations

### Data Privacy

**User Conversations:**
- Contain personal information, thoughts, questions
- **Risk**: If database compromised, conversations exposed
- **Mitigation**: Supabase RLS ensures user-scoped access only

**OpenAI API:**
- Conversations sent to OpenAI for summarization/embedding
- **Risk**: OpenAI sees conversation content
- **Mitigation**: OpenAI's data policy (no training on API data as of March 2023)
- **Alternative**: Use local models (lower quality, self-hosting complexity)

### API Key Security

**OpenAI API Key:**
- ✅ Stored in .env (gitignored)
- ✅ Not hardcoded in source
- ❌ Script requires API key as env var (user must manage)
- **Best Practice**: Rotate keys periodically, use scoped keys if available

**Supabase Keys:**
- ✅ Publishable (anon) key is public (intended for client-side)
- ✅ Service role key (if used) must be kept secret
- ✅ RLS policies prevent unauthorized access

### Row-Level Security (RLS)

**Current Policies:**
```sql
-- Only authenticated users can access their own data
USING (auth.uid() = user_id)
```

**Attack Scenarios:**
1. **User A tries to read User B's nodes**
   - **Blocked**: RLS policy filters out rows where `user_id ≠ A`
2. **Unauthenticated user tries to read**
   - **Blocked**: `auth.uid()` returns null, no rows match
3. **User A tries to insert with User B's ID**
   - **Blocked**: RLS WITH CHECK fails if `user_id ≠ auth.uid()`

**Edge Case**: Build script runs without auth session
- **Workaround**: Provide `LKG_USER_ID` manually
- **Better**: Use service role key for build (bypasses RLS, must trust script)

### Future: Team/Shared Graphs

**Challenge**: How to securely share graphs between users?

**Approach 1**: Explicit Sharing
- Add `shared_with_user_ids` JSONB column
- Update RLS: `user_id = auth.uid() OR auth.uid() = ANY(shared_with_user_ids)`

**Approach 2**: Team-Based
- Add `team_id` column, `team_members` table
- Update RLS: Join on team membership

---

## Quick Reference

### Common Commands

```bash
# Verify conversations file
npm run verify-conversations

# Build knowledge graph (50 conversations)
./run-lkg.sh 50

# Build with more conversations
./run-lkg.sh 100

# Start dev server
npm run dev

# View graph
# Navigate to app → Click "Knowledge" button
```

### Key Files

- **Build script**: `src/scripts/buildLKG.ts`
- **Configuration**: `run-lkg.sh`, `.env`
- **Database schema**: `supabase/migrations/20250120000008_create_lkg_tables.sql`
- **Core logic**: `src/lib/knowledge/*`
- **UI**: `src/pages/KnowledgeGraph.tsx`, `src/components/knowledge/*`

### Debugging

**Graph is empty:**
1. Check build script completed successfully
2. Check database: `SELECT COUNT(*) FROM lkg_nodes;`
3. Check browser console for errors
4. Verify `LKG_USER_ID` matches logged-in user

**API errors:**
1. Verify `OPENAI_API_KEY` is set
2. Check OpenAI account has credits
3. Check rate limits (wait 1 minute, retry)

**UMAP errors:**
1. Optional feature, can skip
2. Install: `pip install umap-learn numpy`
3. Verify Python 3 is in PATH

---

## Next Steps for Production

1. **Add Error Recovery**
   - Checkpoint system for build script
   - Retry logic for API calls

2. **Performance Optimization**
   - Add pgvector ivfflat index
   - Use approximate NN for kNN (FAISS)

3. **Incremental Updates**
   - Process only new conversations
   - Update graph without full rebuild

4. **Cost Tracking**
   - Log tokens used per build
   - Display cost estimates in UI

5. **Testing**
   - Unit tests for kNN builder, parser
   - Integration tests for build script
   - E2E tests for UI

6. **Monitoring**
   - Add logging (structured logs)
   - Track build success rate
   - Alert on errors

---

**End of Context Document**

*This document should be updated as the feature evolves. Treat it as the source of truth for architecture decisions and future development.*

