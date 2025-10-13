# Latent Knowledge Graph — Quick Start Checklist

## ✅ Pre-flight Checklist

### 1. Verify Installation
```bash
# Check that conversations file is present and valid
npm run verify-conversations
```

**Expected output**: 
```
✓ Successfully parsed 1152 conversations
```

### 2. Database Setup
```bash
# Open Supabase SQL Editor
# Copy entire contents of LKG_DATABASE_SETUP.sql
# Paste and execute
```

**Tables created**:
- ✅ `lkg_nodes` (with pgvector)
- ✅ `lkg_edges`
- ✅ Indexes and RLS policies

### 3. Environment Variables
```bash
# Add to your existing .env.local file:
VITE_OPENAI_API_KEY=sk-your-key-here
```

**Verify**:
```bash
# Should show your API key
echo $VITE_OPENAI_API_KEY
```

### 4. Install Python Dependencies (Optional)
```bash
# For UMAP projection (recommended but optional)
pip install umap-learn numpy
```

**Note**: Graph will work without UMAP using force-directed layout.

## 🚀 Launch Sequence

### Step 1: Process Conversations (First 50)
```bash
npm run build-lkg
```

**What happens**:
1. Loads first 50 conversations from conversations.txt
2. Summarizes each with GPT-4o-mini
3. Generates embeddings with text-embedding-3-large
4. Computes kNN graph (k=5, threshold=0.25)
5. Runs UMAP projection (if available)
6. Stores everything in Supabase

**Expected duration**: 2-3 minutes  
**Expected cost**: ~$0.10-0.20  
**Progress**: Displayed in terminal

### Step 2: Launch App
```bash
npm run dev
```

### Step 3: View Knowledge Graph
1. Open app in browser
2. Look for **"Knowledge"** button in header (Brain icon 🧠)
3. Click to open Knowledge Graph page
4. Explore!

## 🎯 What to Expect

### Graph Appearance
- **50 nodes** representing conversations
- **~125-250 edges** connecting similar conversations
- **Color gradient**: Blue (old) → Purple (mid) → Red (new)
- **Node size**: Bigger = more connections

### Interactions
- **Click node**: View summary and similar conversations
- **Drag node**: Move around graph
- **Pan**: Click and drag background
- **Zoom**: Mouse wheel or pinch
- **Navigate**: Click similar conversations to jump between related topics

### Sidebar
When no node selected:
- Graph statistics (nodes, edges, density)
- Most connected conversations
- Time span

When node selected:
- Conversation title and summary
- Timestamp and message count
- List of similar conversations with similarity scores

## 🔍 Validation Checklist

After processing and launching, verify:

- [ ] Graph displays with nodes and edges
- [ ] Nodes are color-coded (blue to red gradient visible)
- [ ] Can click nodes to see details
- [ ] Similar conversations list appears for selected node
- [ ] Statistics show reasonable numbers (50 nodes, ~125-250 edges)
- [ ] Can navigate between related conversations
- [ ] Pan and zoom work smoothly
- [ ] No console errors in browser

## 📊 Monitoring

### During Processing
Watch terminal for:
```
Loading conversations...
✓ Loaded 50 conversations

Processing conversations (summarizing + embedding)...
Progress: 5/50
Progress: 10/50
...
Progress: 50/50

Building kNN graph...
Progress: 50/50
Generated 237 edges
Average degree: 4.74

Storing nodes in database...
Stored 50 nodes

Storing edges in database...
Stored 237 edges

Running UMAP projection...
Projecting 50 embeddings from 3072D to 2D
UMAP projection complete

Updating UMAP coordinates...
Updated 50 nodes

=== Build Complete ===
```

### In Browser DevTools
Should see successful queries:
```
✓ lkg-nodes: 50 items
✓ lkg-edges: 237 items
```

## ⚠️ Troubleshooting

### "No authenticated user found"
**Solution**: Login to the app first, then run build script

### "UMAP projection failed"
**Solution**: Optional feature, graph will work without it
**Install**: `pip install umap-learn numpy`

### "Rate limit error from OpenAI"
**Solution**: Script includes rate limiting, but you can slow it down:
- Edit `src/lib/knowledge/embeddingService.ts`
- Increase `delayMs` from 1000 to 2000+
- Decrease `batchSize` from 5 to 3

### "No knowledge graph data yet"
**Solution**: Need to run `npm run build-lkg` first

### Graph is empty
**Check**:
1. Database tables exist? (Check Supabase dashboard)
2. Script completed successfully? (Check terminal output)
3. Logged in? (User ID must match processed data)

## 🎓 Next Steps

Once POC is validated:

### Scale Up (Optional)
```bash
# Process 100 conversations
LKG_MAX_CONVERSATIONS=100 npm run build-lkg

# Process 500 conversations
LKG_MAX_CONVERSATIONS=500 npm run build-lkg

# Process all 1,152 conversations (~$2-4, ~30-40 min)
LKG_MAX_CONVERSATIONS=1152 npm run build-lkg
```

### Experiment with Parameters
Edit `src/scripts/buildLKG.ts`:
```typescript
const K_NEIGHBORS = 10;              // More connections
const SIMILARITY_THRESHOLD = 0.3;    // Stronger connections only
```

Then reprocess:
```bash
npm run build-lkg
```

### Explore Features
- Find most connected topics
- Trace concept evolution over time
- Discover unexpected connections
- Navigate your knowledge landscape

## 📚 Documentation

- **Setup Guide**: `LKG_SETUP.md`
- **Implementation Details**: `KNOWLEDGE_GRAPH.md`
- **Summary**: `IMPLEMENTATION_SUMMARY.md`
- **Database Schema**: `LKG_DATABASE_SETUP.sql`

## 💡 Tips

1. **Start Small**: 50 conversations is perfect for POC validation
2. **Check Stats**: Graph should have avg degree 5-10 for good connectivity
3. **Temporal View**: Look for blue-to-red gradient showing knowledge evolution
4. **Navigate**: Use similar conversations to explore your knowledge graph organically
5. **Refine**: Adjust k and threshold based on how dense/sparse you want the graph

---

**Time to first graph**: ~5 minutes setup + 2-3 minutes processing = **~8 minutes total** ⚡

