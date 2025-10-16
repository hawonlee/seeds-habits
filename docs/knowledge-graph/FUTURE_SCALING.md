# Knowledge Graph: Future Scaling Requirements

**Document Version**: 1.0  
**Last Updated**: October 2025  
**Purpose**: Roadmap for scaling the Knowledge Graph from POC (≤5 users) to production (100+ users)

---

## Current POC Limitations

This implementation is designed for **proof-of-concept with ≤5 users**:

### 1. UMAP Projection: Manual Local Script

**Current State**:
- Runs locally via manual Node.js + Python script
- Requires user to run `npm run umap-project` manually
- Needs Supabase service role key on local machine

**Limitations**:
- Not feasible for production (requires technical setup)
- No automation or background processing
- Security risk (service key exposure)
- Poor UX (multi-step manual process)

### 2. Recomputation: Manual Trigger Only

**Current State**:
- User clicks "Recompute Graph" button in UI
- Edge Function runs synchronously (blocks for 30-60 seconds)
- No job queue or status tracking

**Limitations**:
- No scheduled/automatic recomputation
- No job queue for long-running tasks
- Can timeout for large graphs (>200 nodes)
- No retry logic on failure

### 3. Performance: Sequential Processing

**Current State**:
- O(N²) edge computation in single request
- Sequential UMAP projection (no parallelization)
- 15-conversation limit on initial upload

**Limitations**:
- No batch processing or parallelization
- Edge Function timeout on free tier (150 seconds)
- Can't process large conversation files (>50MB)
- No progress tracking during long operations

---

## Scaling Path

### Phase 1: Separate UMAP Service (10-50 users)

**Target**: Automate UMAP without requiring user to run local script

#### Changes Required

1. **Deploy Python UMAP Service**
   - AWS Lambda (Python 3.9+, 2GB memory)
   - OR Google Cloud Function
   - OR dedicated Python microservice (Docker on Railway/Render)

2. **Update Edge Function**
   - After recomputing edges, call UMAP service via HTTP
   - Store job ID, return immediately
   - Client polls for completion

3. **API Contract**
   ```typescript
   // POST /umap-project
   {
     "userId": "...",
     "nodeIds": ["...", "..."],
     "nComponents": 3,
     "metric": "cosine"
   }
   
   // Response
   {
     "jobId": "...",
     "status": "processing",
     "estimatedTime": 90  // seconds
   }
   
   // GET /umap-project/:jobId
   {
     "status": "complete",
     "results": [
       { "id": "...", "x": 1.2, "y": -0.5, "z": 3.1 }
     ]
   }
   ```

4. **Client Updates**
   - Show "Processing..." modal with progress
   - Poll job status every 5 seconds
   - Auto-refresh graph on completion

#### Infrastructure

| Service | Provider | Config | Cost (50 users) |
|---------|----------|--------|-----------------|
| UMAP Lambda | AWS Lambda | Python 3.9, 2GB RAM, 3min timeout | ~$5-10/month |
| OR UMAP Service | Railway | 1GB RAM, Python Docker | ~$10/month |
| Storage | AWS S3 | For UMAP model cache | ~$1/month |

**Estimated Effort**: 2-3 days

---

### Phase 2: Background Job Queue (50-500 users)

**Target**: Handle concurrent recomputation requests without blocking UI

#### Changes Required

1. **Add Job Queue**
   - Upstash QStash (Redis-based, serverless)
   - OR BullMQ (self-hosted)
   - OR Supabase Edge Functions with pg_cron

2. **Workflow**
   ```
   User clicks "Recompute Graph"
     ↓
   Enqueue job (returns job ID immediately)
     ↓
   Client polls job status
     ↓
   Worker processes job:
     - Fetch nodes
     - Compute edges
     - Call UMAP service
     - Update database
     ↓
   Client refetches data on completion
   ```

3. **Database Schema**
   ```sql
   CREATE TABLE lkg_jobs (
     id uuid PRIMARY KEY,
     user_id uuid REFERENCES auth.users,
     type text,  -- 'recompute', 'upload'
     status text,  -- 'queued', 'processing', 'complete', 'failed'
     progress int,  -- 0-100
     error text,
     created_at timestamp,
     completed_at timestamp
   );
   ```

4. **Client UI**
   - Show job progress bar
   - Display queue position
   - Send browser notification on completion

#### Infrastructure

| Service | Provider | Config | Cost (50 users) |
|---------|----------|--------|-----------------|
| Job Queue | Upstash QStash | 10k jobs/month free | ~$10-20/month |
| OR Queue | Redis Labs | 30MB RAM | ~$15/month |

**Estimated Effort**: 3-5 days

---

### Phase 3: Incremental Updates (500+ users)

**Target**: Fast updates when adding new nodes (no full recomputation)

#### Changes Required

1. **Train UMAP Model Once**
   - Fit UMAP on existing nodes
   - Serialize model to disk (pickle or joblib)
   - Store in S3 or database

2. **Transform New Nodes**
   ```python
   # Initial training
   reducer = umap.UMAP(...)
   reduced = reducer.fit_transform(embeddings)
   joblib.dump(reducer, 'model.pkl')
   
   # Later: transform new nodes
   reducer = joblib.load('model.pkl')
   new_reduced = reducer.transform(new_embeddings)
   ```

3. **Periodic Retraining**
   - Retrain model weekly or monthly
   - Trigger automatically when node count doubles
   - Notify users: "Graph layout updated!"

4. **Hybrid Strategy**
   - New nodes: Fast transform (~1-2 seconds)
   - Full recompute: Only when necessary
   - Store model version in metadata

#### Performance Gains

| Operation | Current (Full UMAP) | Incremental (Transform) |
|-----------|---------------------|------------------------|
| 10 new nodes | 60 seconds | 2 seconds |
| 50 new nodes | 90 seconds | 5 seconds |
| 100 new nodes | 120 seconds | 10 seconds |

**Estimated Effort**: 1 week

---

### Phase 4: Realtime + Analytics (Production)

**Target**: Live updates, offline support, and usage analytics

#### A. Realtime Sync

1. **Supabase Realtime Subscriptions**
   ```typescript
   supabase.channel('lkg_nodes')
     .on('postgres_changes', { 
       event: '*', 
       schema: 'public', 
       table: 'lkg_nodes' 
     }, (payload) => {
       queryClient.invalidateQueries(['lkg-nodes'])
     })
     .subscribe()
   ```

2. **Live Graph Updates**
   - New nodes appear in real-time
   - Edges update dynamically
   - No manual refresh needed

#### B. Offline Support

1. **IndexedDB Persistence**
   ```typescript
   import { persistQueryClient } from '@tanstack/react-query-persist-client'
   import { createIDBPersister } from '@tanstack/query-persist-client-idb'
   
   persistQueryClient({ 
     queryClient, 
     persister: createIDBPersister() 
   })
   ```

2. **Deferred Uploads**
   - Queue uploads when offline
   - Sync when connection restored
   - Show sync status indicator

#### C. Analytics Dashboard

1. **New Table: `lkg_analytics`**
   ```sql
   CREATE TABLE lkg_analytics (
     id uuid PRIMARY KEY,
     user_id uuid REFERENCES auth.users,
     date date,
     node_count int,
     edge_density float,
     cluster_count int,
     avg_similarity float,
     new_topics_weekly int
   );
   ```

2. **Scheduled Job**
   - Compute metrics weekly (Supabase cron)
   - Detect new topic clusters
   - Track conceptual growth over time

3. **UI: `/analytics` Page**
   - Time-series charts (Recharts)
   - Summary cards (total nodes, connections, etc.)
   - Topic evolution visualization

**Estimated Effort**: 2 weeks

---

## Cost Estimates

| Phase | Infrastructure | Monthly Cost (50 users) | Monthly Cost (500 users) |
|-------|---------------|------------------------|--------------------------|
| **POC (Current)** | Supabase Free + Vercel Free | $0 | N/A (can't scale) |
| **Phase 1** | + AWS Lambda (UMAP) | ~$10 | ~$30 |
| **Phase 2** | + Upstash QStash | ~$25 | ~$80 |
| **Phase 3** | + S3 storage (models) | ~$30 | ~$100 |
| **Phase 4** | + Supabase Pro | ~$65 | ~$200 |

**Revenue Needed**: 
- 50 users @ ~$1.30/user/month
- 500 users @ ~$0.40/user/month

---

## Decision Points

### When to Scale?

| Metric | Threshold | Action |
|--------|-----------|--------|
| Active users | >5 | Implement Phase 1 (UMAP service) |
| Concurrent recomputes | >3 | Implement Phase 2 (job queue) |
| Total nodes/user | >200 | Implement Phase 3 (incremental) |
| User complaints | "Too slow" | Investigate bottlenecks, expedite next phase |

### Which Path to Take?

**Option A: Sequential (Recommended)**
- Implement phases 1 → 2 → 3 → 4
- Lower risk, incremental complexity
- Can validate each phase with real users

**Option B: Jump to Phase 2**
- Skip Phase 1, use synchronous UMAP + job queue
- Faster to implement (no separate service)
- May hit timeout limits for large graphs

**Option C: Pre-computed Coordinates**
- Compute UMAP in batch job (nightly)
- Users see slightly stale layout (acceptable?)
- Simplest architecture, lowest cost

**Recommendation**: Start with **Option A** for robustness, consider **Option C** for rapid MVP.

---

## Alternative Architectures

### A. Client-Side UMAP (WebAssembly)

**Pros**:
- No server-side UMAP service needed
- Zero infrastructure cost
- Works offline

**Cons**:
- UMAP.js not as mature as Python UMAP
- Browser memory limits (1-2GB)
- Blocks UI thread (need Web Worker)

**Verdict**: Investigate for Phase 1 alternative if AWS costs are prohibitive.

### B. Graph Database (Neo4j)

**Pros**:
- Native graph queries (faster neighbor traversal)
- Built-in clustering algorithms
- Scales to millions of nodes

**Cons**:
- Migration effort (move from Postgres)
- Higher cost (~$50/month minimum)
- Learning curve for team

**Verdict**: Overkill for current scale. Revisit if graph grows to 10k+ nodes per user.

### C. Vector Search (Pinecone, Weaviate)

**Pros**:
- Optimized for similarity search
- Fast kNN queries (sub-second)
- Managed service

**Cons**:
- Additional cost ($70/month for Pinecone Standard)
- Data duplication (embeddings in Supabase + vector DB)
- Vendor lock-in

**Verdict**: Consider if kNN computation becomes bottleneck. Current O(N²) is acceptable for N<500.

---

## Technical Debt & Risks

### Current Technical Debt

1. **No retry logic** in Edge Functions
   - Risk: Transient failures lose data
   - Mitigation: Add retry in Phase 2 (job queue)

2. **No progress tracking** during upload
   - Risk: User doesn't know if upload is stuck
   - Mitigation: Add progress events in Phase 2

3. **Hard-coded parameters** (k=5, threshold=0.25)
   - Risk: Suboptimal graph for some users
   - Mitigation: Make tunable in settings (Phase 4)

4. **No A/B testing** of UMAP parameters
   - Risk: Unknown if layout is optimal
   - Mitigation: Add analytics tracking (Phase 4)

### Scaling Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| UMAP service cost exceeds budget | Medium | High | Monitor usage, optimize parameters, consider client-side |
| Job queue overwhelmed | Low | High | Rate limiting, priority queues, auto-scaling |
| Database slow for large graphs | Low | Medium | Add indexes, optimize queries, consider sharding |
| Users don't understand layout | High | Low | Add onboarding tutorial, tooltips |

---

## Monitoring & Observability

### Key Metrics to Track

1. **Performance**
   - UMAP projection time (p50, p95, p99)
   - Edge computation time
   - Total recompute time
   - Job queue depth

2. **Usage**
   - Recompute requests per day
   - Nodes per user (avg, median, max)
   - Upload frequency
   - Error rate

3. **Business**
   - DAU (daily active users)
   - Retention (7-day, 30-day)
   - Feature adoption (recompute button clicks)
   - Churn rate

### Logging

```typescript
// Add structured logging
console.log(JSON.stringify({
  event: 'recompute_start',
  userId: user.id,
  nodeCount: nodes.length,
  timestamp: new Date().toISOString(),
}))
```

### Alerts

- Recompute time > 120 seconds
- Error rate > 5%
- Job queue depth > 50
- UMAP service downtime

---

## Testing Strategy

### Phase 1 Testing

- [ ] Load test UMAP service (100 concurrent requests)
- [ ] Verify job polling works for slow connections
- [ ] Test error handling (service down, timeout, bad data)
- [ ] Measure p95 latency

### Phase 2 Testing

- [ ] Queue stress test (1000 jobs enqueued simultaneously)
- [ ] Verify job ordering (FIFO vs priority)
- [ ] Test job retry logic (3 attempts with backoff)
- [ ] Monitor queue depth during peak usage

### Phase 3 Testing

- [ ] Verify incremental UMAP matches full recompute
- [ ] Test model versioning (old model, new nodes)
- [ ] Measure speedup (incremental vs full)
- [ ] Load test transform endpoint

### Phase 4 Testing

- [ ] Realtime sync with multiple clients
- [ ] Offline queue sync (10+ queued uploads)
- [ ] Analytics accuracy (manual verification)
- [ ] Mobile browser compatibility

---

## Migration Plan

### From POC to Phase 1

1. **Week 1**: Deploy UMAP Lambda
2. **Week 2**: Update Edge Function + client
3. **Week 3**: Test with beta users
4. **Week 4**: Rollout to all users

### From Phase 1 to Phase 2

1. **Week 1**: Set up Upstash QStash
2. **Week 2**: Implement job queue + workers
3. **Week 3**: Add UI for job status
4. **Week 4**: Migrate existing users

### From Phase 2 to Phase 3

1. **Week 1**: Train initial UMAP models
2. **Week 2**: Implement transform endpoint
3. **Week 3**: Add model versioning
4. **Week 4**: Set up retraining cron job

---

## Conclusion

The current POC is sufficient for ≤5 users. When scaling:

1. **Start with Phase 1** (UMAP service) - biggest UX improvement
2. **Monitor usage** - scale preemptively based on metrics
3. **Iterate based on feedback** - users will tell you what's slow
4. **Budget for infrastructure** - expect ~$30-100/month for 50-500 users

**Next Steps**:
- [ ] Set up monitoring/analytics (Posthog, Mixpanel)
- [ ] Define scaling triggers (user count, performance)
- [ ] Budget approval for Phase 1 infrastructure
- [ ] Design UMAP service API contract

---

**Questions?** See [ARCHITECTURE_OVERVIEW.md](../ARCHITECTURE_OVERVIEW.md) or reach out to the team.

