# UMAP Local Processing Guide

**Purpose**: This guide explains how to run UMAP projection locally to generate semantic 3D coordinates for your Knowledge Graph nodes.

**When to use**: After clicking "Recompute Graph" in the UI, follow these steps to complete the semantic layout update.

---

## Prerequisites

### 1. Python 3.8+ with `umap-learn`

Install UMAP and dependencies:

```bash
pip install umap-learn numpy
```

Verify installation:

```bash
python3 -c "import umap; print(umap.__version__)"
```

### 2. Node.js

Already installed if you're running the Seeds Habits app locally.

### 3. Supabase Service Role Key

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Settings → API**
4. Copy the **service_role** key (⚠️ **Keep this secret!**)

---

## Running UMAP Projection

### Step 1: Get Your User ID

From the project root:

```bash
cd /Users/jwen/seeds-habits-1
./get-user-id.sh
```

Or manually:
```bash
supabase auth admin list-users --project-ref qqnidhikbczcudesoisc
```

Copy your user UUID (e.g., `6a18aafb-7097-4901-aafb-57aa9b6c8e26`).

### Step 2: Export Supabase Service Key

```bash
export SUPABASE_SERVICE_KEY="your-service-role-key-here"
```

⚠️ **Security Note**: 
- Never commit this key to git
- Never share it publicly
- Use it only locally for this script

### Step 3: Run the UMAP Script

```bash
npm run umap-project -- <your-user-id>
```

Example:
```bash
npm run umap-project -- 6a18aafb-7097-4901-aafb-57aa9b6c8e26
```

### Step 4: Wait for Completion

The script will:
1. Fetch all your node embeddings (3072-dimensional vectors)
2. Run UMAP projection to 3D (using cosine metric)
3. Update `x`, `y`, `z` coordinates in database
4. Mark recomputation as complete

**Expected time**: 
- 10-50 nodes: ~10-30 seconds
- 50-100 nodes: ~30-90 seconds
- 100+ nodes: 1-2 minutes

### Step 5: Refresh Knowledge Graph

1. Go to the Knowledge Graph page
2. Click "Refresh" or reload the page
3. Your graph will now display semantic clustering! 🎉

---

## What UMAP Does

**UMAP (Uniform Manifold Approximation and Projection)** reduces high-dimensional embeddings to 3D while preserving semantic structure.

### Technical Details

- **Input**: 3072-dimensional OpenAI embeddings
- **Output**: 3D coordinates (x, y, z)
- **Metric**: Cosine similarity (measures semantic similarity)
- **Parameters**:
  - `n_neighbors=15` - Balance local vs. global structure
  - `min_dist=0.1` - Minimum spacing between points
  - `n_components=3` - Output dimensions (3D visualization)

### Result

Similar conversations will cluster together in 3D space:
- **Close together**: Semantically related topics
- **Far apart**: Unrelated topics
- **Intermediate**: Tangentially connected

---

## Troubleshooting

### Error: `umap-learn not installed`

**Solution**:
```bash
pip install umap-learn numpy
```

If using virtual environment:
```bash
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install umap-learn numpy
```

### Error: `Missing SUPABASE_SERVICE_KEY`

**Solution**: Export the environment variable:
```bash
export SUPABASE_SERVICE_KEY="your-key-here"
```

Or add to your shell profile (`~/.bashrc`, `~/.zshrc`):
```bash
echo 'export SUPABASE_SERVICE_KEY="your-key"' >> ~/.zshrc
source ~/.zshrc
```

### Error: `No nodes found for user`

**Causes**:
1. Wrong user ID
2. No conversations uploaded yet
3. Database connection issue

**Solution**:
- Verify user ID with `./get-user-id.sh`
- Upload conversations first via the UI
- Check `VITE_SUPABASE_URL` in `.env`

### Slow Performance

**Expected behavior**: UMAP is compute-intensive.

**Optimization tips**:
- Close other applications
- Ensure Python is using optimized NumPy (with BLAS/LAPACK)
- Consider reducing `n_neighbors` parameter (edit `umapProjection.py`)

### Script Crashes or Hangs

**Causes**:
- Insufficient memory (for 1000+ nodes)
- Corrupted embedding data
- Python version incompatibility

**Solution**:
- Check memory usage (`htop` or Activity Monitor)
- Verify Python 3.8+ with `python3 --version`
- Try on a smaller subset of nodes

---

## Advanced Usage

### Custom UMAP Parameters

Edit `src/scripts/umapProjection.py`:

```python
reducer = umap.UMAP(
    n_neighbors=20,      # Increase for more global structure
    min_dist=0.05,       # Decrease for tighter clusters
    n_components=3,
    metric='cosine',
    random_state=42,
)
```

### 2D Projection (Instead of 3D)

Change `n_components` to 2:

```typescript
// In fetchAndProjectUMAP.ts
fs.writeFileSync(inputFile, JSON.stringify({
  embeddings: nodes.map(n => ({ id: n.id, embedding: n.embedding })),
  n_components: 2,  // Changed from 3
  metric: 'cosine',
}));
```

Then update only `x` and `y` (not `z`):

```typescript
await supabase
  .from('lkg_nodes')
  .update({ x: result.x, y: result.y })  // Remove z
  .eq('id', result.id);
```

---

## Next Steps

After UMAP projection is complete:

1. **Visualize**: Explore the 3D graph to see semantic clusters
2. **Upload More**: Add more conversations to grow your graph
3. **Recompute**: When you've added >20% more nodes, recompute again

---

## POC Limitation Notice

⚠️ **This manual process is for proof-of-concept only (≤5 users).**

For production scale (10+ users), see [FUTURE_SCALING.md](./FUTURE_SCALING.md) for:
- Automated UMAP service (AWS Lambda)
- Background job queue (Upstash QStash)
- Incremental updates (transform new nodes)

---

## Support

**Questions?** Check the main [ARCHITECTURE_OVERVIEW.md](../ARCHITECTURE_OVERVIEW.md) or open an issue.

**Contributing**: If you improve the UMAP script or find optimizations, please share!

