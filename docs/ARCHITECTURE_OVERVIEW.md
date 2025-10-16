# Seeds Habits - Complete Architecture Overview

**Last Updated**: October 14, 2025  
**Purpose**: Comprehensive architectural documentation for learning and review

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Application Architecture](#application-architecture)
4. [Database Design](#database-design)
5. [Authentication & Security](#authentication--security)
6. [Feature Deep-Dives](#feature-deep-dives)
7. [Knowledge Graph Architecture](#knowledge-graph-architecture)
8. [Performance & Optimization](#performance--optimization)
9. [Deployment](#deployment)
10. [Code Patterns & Best Practices](#code-patterns--best-practices)

---

## System Overview

**Seeds Habits** is a personal productivity and learning application that combines:
- **Habit Tracking**: Schedule and track recurring habits with flexible frequencies
- **Task Management**: Organize tasks with lists, priorities, and due dates
- **Diary Journaling**: Daily reflections with rich text editing
- **Knowledge Graph**: AI-powered visualization of learning from ChatGPT conversations

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       Frontend (React)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Habits  │  │  Tasks   │  │  Diary   │  │Knowledge │   │
│  │          │  │          │  │          │  │  Graph   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│         │              │              │              │       │
│         └──────────────┴──────────────┴──────────────┘       │
│                        │                                      │
│                  ┌─────▼─────┐                               │
│                  │  Supabase  │                              │
│                  │   Client   │                              │
│                  └─────┬─────┘                               │
└────────────────────────┼──────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
    ┌────▼────┐    ┌────▼────┐    ┌────▼────────┐
    │PostgreSQL│    │  Auth   │    │Edge Function│
    │Database  │    │         │    │(Knowledge   │
    │+ RLS     │    │         │    │ Graph)      │
    └──────────┘    └─────────┘    └─────┬───────┘
                                          │
                                    ┌─────▼──────┐
                                    │OpenAI API  │
                                    │- GPT-4o    │
                                    │- Embeddings│
                                    └────────────┘
```

---

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** - Fast build tool and dev server
- **React Router v6** - Client-side routing
- **TanStack Query (React Query)** - Server state management
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Accessible component library
- **react-three-fiber** - 3D graphics (Knowledge Graph)
- **@react-three/drei** - 3D helpers and controls
- **force-graph** - 2D graph visualization

### Backend & Infrastructure
- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Row Level Security (RLS)
  - Authentication
  - Storage (for file uploads)
  - Edge Functions (serverless, Deno runtime)
- **Vercel** - Frontend hosting and deployment

### AI & Processing
- **OpenAI GPT-4o-mini** - Conversation summarization
- **OpenAI text-embedding-3-large** - Semantic embeddings (3072 dimensions)
- **KNN (K-Nearest Neighbors)** - Graph edge computation
- **UMAP** (via Python script) - Dimensionality reduction for visualization

---

## Application Architecture

### Component Structure

```
src/
├── components/
│   ├── auth/              # Login/signup forms
│   ├── calendar/          # Unified calendar views (Day/Week/Month)
│   ├── diary/             # Diary entry cards and editing
│   ├── habits/            # Habit creation, tracking, completion
│   ├── knowledge/         # Knowledge Graph UI (3D/2D, search, controls)
│   ├── layout/            # Navigation, sidebar, header
│   ├── tasks/             # Task lists, task items, drag-drop
│   └── ui/                # shadcn/ui components (Button, Dialog, etc.)
│
├── hooks/                 # Custom React hooks
│   ├── useAuth.tsx        # Authentication state
│   ├── useHabits.tsx      # Habit CRUD operations
│   ├── useTasks.tsx       # Task CRUD operations
│   ├── useDiaryEntries.tsx
│   └── useCalendarItems.tsx
│
├── lib/
│   ├── knowledge/         # Knowledge Graph logic
│   │   ├── conversationParser.ts    # Parse ChatGPT export
│   │   ├── embeddingService.ts      # OpenAI API calls
│   │   ├── knnBuilder.ts            # Build graph edges
│   │   ├── processUpload.ts         # Orchestrate upload flow
│   │   └── export.ts                # Export graph data
│   └── utils.ts           # Utility functions (cn, date formatting)
│
├── pages/                 # Top-level route components
│   ├── Index.tsx          # Dashboard with calendar
│   ├── Auth.tsx           # Login/signup page
│   ├── Diary.tsx          # Diary list and entry view
│   ├── Tasks.tsx          # Task management
│   └── KnowledgeGraph.tsx # Knowledge Graph page
│
└── integrations/supabase/
    ├── client.ts          # Supabase client initialization
    └── types.ts           # TypeScript types from database
```

### State Management Philosophy

**Server State (React Query)**:
- All database-backed data (habits, tasks, diary, knowledge graph)
- Automatic caching, refetching, and optimistic updates
- Managed by custom hooks (`useHabits`, `useTasks`, etc.)

**Client State (useState/Context)**:
- UI state (modals, form inputs, view modes)
- Theme preferences
- Temporary selections and filters

**Example: `useHabits` Hook**

```typescript:src/hooks/useHabits.tsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useHabits() {
  const queryClient = useQueryClient();

  // Fetch habits
  const { data: habits, isLoading } = useQuery({
    queryKey: ['habits'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Create habit mutation
  const createHabit = useMutation({
    mutationFn: async (newHabit: Partial<Habit>) => {
      const { data, error } = await supabase
        .from('habits')
        .insert([newHabit])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate and refetch habits list
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
  });

  return { habits, isLoading, createHabit };
}
```

**Key Concepts**:
- `queryKey`: Unique identifier for cached data
- `queryFn`: Async function to fetch data
- `useMutation`: For create/update/delete operations
- `invalidateQueries`: Trigger refetch after mutations

---

## Database Design

### Schema Overview

```sql
-- Users (managed by Supabase Auth)
auth.users
  - id (uuid, primary key)
  - email
  - created_at

-- Habits
habits
  - id (uuid, primary key)
  - user_id (uuid, foreign key → auth.users)
  - name (text)
  - description (text)
  - color (text)
  - category_id (uuid, foreign key → categories)
  - created_at (timestamp)

-- Habit Schedules (flexible frequency)
habit_schedules
  - id (uuid, primary key)
  - habit_id (uuid, foreign key → habits)
  - frequency_type (enum: daily, weekly, monthly, custom)
  - frequency_value (integer)
  - frequency_unit (text)
  - start_date (date)
  - end_date (date, nullable)

-- Habit Completions
habit_completions
  - id (uuid, primary key)
  - habit_id (uuid, foreign key → habits)
  - completed_at (timestamp)
  - user_id (uuid)

-- Tasks
tasks
  - id (uuid, primary key)
  - user_id (uuid)
  - task_list_id (uuid, foreign key → task_lists)
  - title (text)
  - description (text)
  - completed (boolean)
  - due_date (timestamp, nullable)
  - priority (text)
  - order_index (integer)

-- Task Lists
task_lists
  - id (uuid, primary key)
  - user_id (uuid)
  - name (text)
  - color (text)
  - order_index (integer)

-- Diary Entries
diary_entries
  - id (uuid, primary key)
  - user_id (uuid)
  - entry_date (date)
  - content (text)
  - mood (text, nullable)
  - created_at (timestamp)

-- Calendar Items (unified view of habits, tasks, events)
calendar_items
  - id (uuid, primary key)
  - user_id (uuid)
  - title (text)
  - item_type (enum: habit, task, event)
  - start_date (timestamp)
  - end_date (timestamp, nullable)
  - related_id (uuid)  -- ID of habit, task, or event

-- Knowledge Graph: Nodes
lkg_nodes
  - id (uuid, primary key)
  - user_id (uuid)
  - conversation_id (text)
  - title (text)
  - summary (text)
  - embedding (vector(3072))  -- OpenAI embedding
  - x, y, z (numeric)  -- 3D coordinates for visualization
  - timestamp (timestamp)
  - message_count (integer)

-- Knowledge Graph: Edges
lkg_edges
  - id (uuid, primary key)
  - user_id (uuid)
  - source_id (uuid, foreign key → lkg_nodes)
  - target_id (uuid)
  - similarity (numeric)  -- Cosine similarity score
```

### Row Level Security (RLS)

**Every table has RLS enabled** to ensure users can only access their own data.

**Example RLS Policy**:

```sql:supabase/migrations/20250828040200_create_habits_table.sql
-- Enable RLS
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own habits
CREATE POLICY "Users can view own habits"
  ON habits
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own habits
CREATE POLICY "Users can insert own habits"
  ON habits
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own habits
CREATE POLICY "Users can update own habits"
  ON habits
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own habits
CREATE POLICY "Users can delete own habits"
  ON habits
  FOR DELETE
  USING (auth.uid() = user_id);
```

**How it works**:
1. `auth.uid()` is a Supabase function that returns the current authenticated user's ID
2. `USING` clause filters which rows a user can access
3. `WITH CHECK` validates data on insert/update
4. If RLS check fails, the row is invisible (not an error)

---

## Authentication & Security

### Authentication Flow

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       │ 1. User enters email/password
       ▼
┌─────────────────┐
│  Supabase Auth  │
└──────┬──────────┘
       │
       │ 2. Returns JWT token
       ▼
┌─────────────────┐
│ Browser Storage │  (stores session)
└──────┬──────────┘
       │
       │ 3. JWT included in all API requests
       ▼
┌─────────────────┐
│  Supabase API   │
└──────┬──────────┘
       │
       │ 4. Validates JWT, applies RLS
       ▼
┌─────────────────┐
│   PostgreSQL    │
└─────────────────┘
```

### Security Layers

**1. JWT (JSON Web Token)**:
```typescript:src/integrations/supabase/client.ts
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!  // Public anon key
);

// JWT is automatically included in all requests
// Example: Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**2. Row Level Security (RLS)**:
- Database-level enforcement
- Cannot be bypassed from client
- Applied to all queries, even direct SQL

**3. API Keys in Environment**:
```bash
# Frontend (.env)
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...  # Public key (safe to expose)

# Backend (Supabase Secrets)
OPENAI_API_KEY=sk-...  # NEVER exposed to client
```

**4. CORS Protection**:
```typescript:supabase/functions/process-knowledge-graph/index.ts
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Handle CORS preflight
if (req.method === 'OPTIONS') {
  return new Response('ok', { headers: corsHeaders })
}
```

---

## Feature Deep-Dives

### 1. Unified Calendar

**Concept**: Single calendar view that combines habits, tasks, and diary entries.

**Data Flow**:
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Habits    │────▶│  Calendar   │◀────│    Tasks    │
└─────────────┘     │   Items     │     └─────────────┘
                    │  Aggregator │
┌─────────────┐     │             │
│Diary Entries│────▶│             │
└─────────────┘     └──────┬──────┘
                           │
                           ▼
                    ┌──────────────┐
                    │Calendar Views│
                    │- Day         │
                    │- Week        │
                    │- Month       │
                    └──────────────┘
```

**Implementation**:

```typescript:src/hooks/useCalendarItems.tsx
export function useCalendarItems(viewDate: Date) {
  const { data: habits } = useHabits();
  const { data: tasks } = useTasks();
  const { data: diaryEntries } = useDiaryEntries();

  return useMemo(() => {
    const items: CalendarItem[] = [];

    // Add habits with their schedules
    habits?.forEach(habit => {
      habit.schedules?.forEach(schedule => {
        if (shouldShowOnDate(schedule, viewDate)) {
          items.push({
            id: habit.id,
            type: 'habit',
            title: habit.name,
            date: viewDate,
            color: habit.color,
            completed: hasCompletion(habit, viewDate),
          });
        }
      });
    });

    // Add tasks due on this date
    tasks?.forEach(task => {
      if (task.due_date && isSameDay(task.due_date, viewDate)) {
        items.push({
          id: task.id,
          type: 'task',
          title: task.title,
          date: viewDate,
          completed: task.completed,
        });
      }
    });

    // Add diary entries
    diaryEntries?.forEach(entry => {
      if (isSameDay(entry.entry_date, viewDate)) {
        items.push({
          id: entry.id,
          type: 'diary',
          title: 'Diary Entry',
          date: viewDate,
        });
      }
    });

    return items;
  }, [habits, tasks, diaryEntries, viewDate]);
}
```

### 2. Habit Frequency System

**Problem**: Users need flexible scheduling (daily, weekly, custom intervals).

**Solution**: Separate `habit_schedules` table with frequency metadata.

**Frequency Types**:
```typescript:src/components/calendar/calendarFrequency.ts
export type FrequencyType = 'daily' | 'weekly' | 'monthly' | 'custom';

export interface HabitSchedule {
  frequency_type: FrequencyType;
  frequency_value: number;    // e.g., 3 for "every 3 days"
  frequency_unit: string;     // e.g., "days", "weeks"
  start_date: string;
  end_date?: string;
}

// Example: "Every 3 days"
{
  frequency_type: 'custom',
  frequency_value: 3,
  frequency_unit: 'days',
  start_date: '2025-01-01',
}

// Example: "Weekly on Mon, Wed, Fri"
{
  frequency_type: 'weekly',
  frequency_value: 1,
  frequency_unit: 'weeks',
  specific_days: [1, 3, 5],  // 0=Sunday, 1=Monday, etc.
}
```

**Calculation Logic**:
```typescript
function shouldShowHabitOnDate(schedule: HabitSchedule, date: Date): boolean {
  const startDate = new Date(schedule.start_date);
  
  if (schedule.frequency_type === 'daily') {
    return date >= startDate;
  }
  
  if (schedule.frequency_type === 'weekly') {
    const dayOfWeek = date.getDay();
    return schedule.specific_days?.includes(dayOfWeek) && date >= startDate;
  }
  
  if (schedule.frequency_type === 'custom') {
    const daysSinceStart = differenceInDays(date, startDate);
    return daysSinceStart >= 0 && daysSinceStart % schedule.frequency_value === 0;
  }
  
  return false;
}
```

### 3. Drag-and-Drop Tasks

**Library**: `@dnd-kit` - Modern, accessible drag-and-drop

**Implementation**:
```typescript:src/components/tasks/TaskList.tsx
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

export function TaskList({ tasks, onReorder }: TaskListProps) {
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = tasks.findIndex(t => t.id === active.id);
      const newIndex = tasks.findIndex(t => t.id === over.id);
      
      const reorderedTasks = arrayMove(tasks, oldIndex, newIndex);
      onReorder(reorderedTasks);
    }
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={tasks} strategy={verticalListSortingStrategy}>
        {tasks.map(task => (
          <SortableTaskItem key={task.id} task={task} />
        ))}
      </SortableContext>
    </DndContext>
  );
}
```

---

## Knowledge Graph Architecture

### Overview

The Knowledge Graph is the most complex feature. It transforms ChatGPT conversation history into an interactive 3D visualization of semantic connections.

### Data Pipeline

```
┌────────────────┐
│ User uploads   │
│ conversations  │
│    .json       │
└───────┬────────┘
        │
        │ 1. Client validates JSON format
        ▼
┌────────────────┐
│ Upload to      │
│ Supabase       │
│ Storage        │
└───────┬────────┘
        │
        │ 2. Invoke Edge Function
        ▼
┌────────────────────────────────────────┐
│     Supabase Edge Function             │
│  (Deno Runtime, process-knowledge-graph)│
│                                         │
│  ┌──────────────────────────────────┐  │
│  │ 1. Download from Storage         │  │
│  │ 2. Parse JSON                    │  │
│  │ 3. Limit to 15 conversations     │  │
│  └──────────┬───────────────────────┘  │
│             │                           │
│  ┌──────────▼───────────────────────┐  │
│  │ For each conversation:           │  │
│  │ - Summarize (OpenAI GPT-4o-mini) │  │
│  │ - Generate embedding (3072-dim)  │  │
│  └──────────┬───────────────────────┘  │
│             │                           │
│  ┌──────────▼───────────────────────┐  │
│  │ Build kNN graph                  │  │
│  │ - Compute cosine similarity      │  │
│  │ - Connect k=5 nearest neighbors  │  │
│  └──────────┬───────────────────────┘  │
│             │                           │
│  ┌──────────▼───────────────────────┐  │
│  │ Store in Supabase                │  │
│  │ - lkg_nodes (with user_id)       │  │
│  │ - lkg_edges (with user_id)       │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
        │
        │ 3. Client receives success
        ▼
┌────────────────┐
│ Fetch and      │
│ render graph   │
└────────────────┘
```

### Edge Function Deep-Dive

**Why Edge Function?**
- **Browser Limitation**: Processing large JSON files (50-100MB) freezes the browser
- **API Key Security**: OpenAI API key must be server-side only
- **Performance**: Parallel processing on server is faster
- **Reliability**: Network errors can be retried server-side

**Implementation**:

```typescript:supabase/functions/process-knowledge-graph/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Authenticate user
    const authHeader = req.headers.get('Authorization')!
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    // 2. Get file path from request
    const { storageFilePath, userId } = await req.json()

    // 3. Download file from Supabase Storage
    const { data: fileData, error: downloadError } = await supabaseClient.storage
      .from('knowledge-graph-uploads')
      .download(storageFilePath)

    if (downloadError) throw downloadError

    // 4. Parse JSON
    const conversationsJson = await fileData.text()
    const rawConversations = JSON.parse(conversationsJson)
    const allConversations = parseConversations(rawConversations)

    // 5. Limit to 15 most recent (prevent timeout)
    const conversations = allConversations
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 15)

    console.log(`Processing ${conversations.length} conversations...`)

    // 6. Process each conversation
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    const processedConversations = []

    for (const conv of conversations) {
      // Extract text from conversation
      const conversationText = conv.messages
        .map((msg: any) => `${msg.role}: ${msg.content}`)
        .join('\n\n')

      // 6a. Summarize with OpenAI
      const summaryResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'Summarize the following conversation in 2-3 sentences, focusing on key topics and insights.'
            },
            {
              role: 'user',
              content: conversationText.slice(0, 8000)  // Limit token count
            }
          ],
          max_tokens: 150,
          temperature: 0.7,
        }),
      })

      const summaryData = await summaryResponse.json()
      const summary = summaryData.choices[0]?.message?.content || 'No summary'

      // 6b. Generate embedding with OpenAI
      const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'text-embedding-3-large',
          input: summary,  // Embed the summary (cheaper than full text)
        }),
      })

      const embeddingData = await embeddingResponse.json()
      const embedding = embeddingData.data[0].embedding  // Array of 3072 floats

      processedConversations.push({
        conversation_id: conv.id,
        title: conv.title,
        summary,
        embedding,
        timestamp: conv.timestamp,
        message_count: conv.messages.length,
      })
    }

    // 7. Build kNN graph (find k=5 nearest neighbors)
    const edges = buildKNNGraph(processedConversations, 5)

    // 8. Store in database
    const { error: insertError } = await supabaseClient
      .from('lkg_nodes')
      .insert(processedConversations.map(c => ({ ...c, user_id: userId })))

    if (insertError) throw insertError

    const { error: edgesError } = await supabaseClient
      .from('lkg_edges')
      .insert(edges.map(e => ({ ...e, user_id: userId })))

    if (edgesError) throw edgesError

    // 9. Clean up: Delete uploaded file
    await supabaseClient.storage
      .from('knowledge-graph-uploads')
      .remove([storageFilePath])

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: processedConversations.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Helper: Compute cosine similarity between embeddings
function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0
  let normA = 0
  let normB = 0
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

// Helper: Build kNN graph
function buildKNNGraph(nodes: any[], k: number) {
  const edges = []
  
  for (let i = 0; i < nodes.length; i++) {
    // Compute similarity to all other nodes
    const similarities = nodes
      .map((node, j) => ({
        index: j,
        similarity: i === j ? -1 : cosineSimilarity(nodes[i].embedding, node.embedding)
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, k)  // Take top k
    
    // Create edges
    for (const sim of similarities) {
      if (sim.similarity > 0.5) {  // Threshold for meaningful connection
        edges.push({
          source_id: nodes[i].conversation_id,
          target_id: nodes[sim.index].conversation_id,
          similarity: sim.similarity,
        })
      }
    }
  }
  
  return edges
}
```

**Key Concepts**:
- **Deno Runtime**: Edge Functions use Deno (not Node.js), so imports use URLs
- **Service Role**: Edge Functions have elevated permissions to bypass RLS when needed
- **Streaming Logs**: `console.log()` appears in Supabase dashboard logs
- **Timeout Limit**: 150 seconds on free tier (hence the 15 conversation limit)

### 3D Visualization

**Stack**: `react-three-fiber` (React renderer for Three.js)

```typescript:src/components/knowledge/Graph3D.tsx
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';

export function Graph3D({ nodes, edges, onNodeClick }: Graph3DProps) {
  return (
    <Canvas camera={{ position: [0, 0, 30], fov: 75 }}>
      {/* Ambient lighting */}
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />

      {/* Starfield background */}
      <Stars radius={100} depth={50} count={5000} speed={0} fade={false} />

      {/* Render nodes as spheres */}
      {nodes.map(node => (
        <Node3D
          key={node.id}
          position={[node.x, node.y, node.z]}
          color={node.color}
          onClick={() => onNodeClick(node)}
        />
      ))}

      {/* Render edges as lines */}
      {edges.map(edge => (
        <Edge3D
          key={edge.id}
          start={[edge.source.x, edge.source.y, edge.source.z]}
          end={[edge.target.x, edge.target.y, edge.target.z]}
          opacity={edge.similarity}
        />
      ))}

      {/* Camera controls */}
      <OrbitControls
        enableDamping={false}
        rotateSpeed={0.5}
        zoomSpeed={0.8}
        minDistance={10}
        maxDistance={100}
      />
    </Canvas>
  );
}

// Individual node component
function Node3D({ position, color, onClick }: Node3DProps) {
  return (
    <mesh position={position} onClick={onClick}>
      <sphereGeometry args={[0.5, 32, 32]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

// Individual edge component
function Edge3D({ start, end, opacity }: Edge3DProps) {
  const points = [
    new THREE.Vector3(...start),
    new THREE.Vector3(...end),
  ];

  return (
    <line>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={points.length}
          array={new Float32Array(points.flatMap(p => [p.x, p.y, p.z]))}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial color="#666" opacity={opacity} transparent />
    </line>
  );
}
```

**Camera Animation (Fly-To)**:

```typescript:src/components/knowledge/CameraController.tsx
import { useThree, useFrame } from '@react-three/fiber';
import { useRef, useEffect } from 'react';

export function CameraController({ target, onComplete }: Props) {
  const { camera } = useThree();
  const animationRef = useRef<Animation | null>(null);

  useEffect(() => {
    if (!target) return;

    // Calculate target camera position (zoom to node)
    const targetPos = new THREE.Vector3(target.x, target.y, target.z + 10);

    // Store animation state
    animationRef.current = {
      startPos: camera.position.clone(),
      endPos: targetPos,
      startTime: Date.now(),
      duration: 400,  // 0.4 seconds - fast and snappy
    };
  }, [target]);

  useFrame(() => {
    const anim = animationRef.current;
    if (!anim) return;

    const elapsed = Date.now() - anim.startTime;
    const progress = Math.min(elapsed / anim.duration, 1);

    // Ease-out cubic for smooth deceleration
    const eased = 1 - Math.pow(1 - progress, 3);

    // Interpolate position
    camera.position.lerpVectors(anim.startPos, anim.endPos, eased);
    camera.lookAt(target.x, target.y, target.z);

    // Animation complete
    if (progress >= 1) {
      animationRef.current = null;
      onComplete?.();
    }
  });

  return null;
}
```

### Jitter Fixes

**Problem**: Graph nodes were constantly moving/jittering.

**Root Causes**:
1. **2D Graph**: Force simulation was still running (`d3-force`)
2. **3D Graph**: 
   - Random z-coordinates changed on every render
   - `OrbitControls` damping caused micro-adjustments
   - `Stars` background was animating

**Solutions**:

```typescript
// 1. Disable 2D force simulation
<ForceGraph2D
  cooldownTicks={0}           // Stop simulation immediately
  enableNodeDrag={false}       // Disable dragging (triggers simulation)
  d3AlphaDecay={0.99}         // Fast decay
  d3VelocityDecay={0.99}      // Fast velocity decay
  warmupTicks={0}             // No warmup simulation
/>

// 2. Make 3D z-coordinates deterministic
const z = (index / nodes.length - 0.5) * 15;  // Deterministic spread
// Instead of: Math.random() * 10

// 3. Disable OrbitControls during camera animation
const [isAnimating, setIsAnimating] = useState(false);
<OrbitControls
  enableDamping={false}       // No damping = no micro-adjustments
  enabled={!isAnimating}      // Disable during fly-to
/>

// 4. Stop starfield animation
<Stars speed={0} fade={false} />
```

### Global Recomputation & UMAP (POC - Manual Process)

**Current Limitation**: For POC (up to 5 users), UMAP runs locally via manual script.

**Problem**: 
- Initial upload limited to 15 conversations per batch
- Edges only computed within each batch
- No way to reprocess all user data after multiple uploads
- Node positions are arbitrary (no semantic clustering)

**Solution**: Manual global recomputation system

#### Workflow

1. **User clicks "Recompute Graph" button** in the UI
2. **Edge Function recomputes kNN edges** across ALL user nodes (not just 15-conversation batches)
3. **User runs local Node.js script** to:
   - Fetch embeddings from Supabase
   - Call Python UMAP script (projects 3072D → 3D using cosine metric)
   - Upload x,y,z coordinates back to database
4. **User refreshes page** to see semantic layout

#### Hybrid Strategy

Only recomputes if node count grew >20% since last run:

```typescript
const growthRate = (currentNodes - lastRecomputeNodes) / lastRecomputeNodes
if (growthRate < 0.2) {
  return { skipped: true, message: "Need >20% growth to recompute" }
}
```

This prevents unnecessary recomputation for small incremental uploads.

#### Technical Details

**Database Schema**:
```sql
-- Store UMAP coordinates on nodes
ALTER TABLE lkg_nodes ADD COLUMN x numeric;
ALTER TABLE lkg_nodes ADD COLUMN y numeric;
ALTER TABLE lkg_nodes ADD COLUMN z numeric;

-- Track recomputation history
CREATE TABLE lkg_recompute_metadata (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users,
  node_count_at_recompute int,
  edges_created int,
  umap_computed boolean,
  created_at timestamp
);
```

**Edge Function**: `recompute-knowledge-graph`
- Fetches ALL nodes for user (no 15-limit)
- Computes O(N²) kNN edges with k=5, threshold=0.25
- Deletes old edges, inserts new edges
- Records metadata for hybrid strategy

**Local Script**: `npm run umap-project -- <user_id>`
- Requires Python 3.8+ with `umap-learn`
- Requires Supabase service role key
- Takes 30-90 seconds for 50-100 nodes

**UMAP Configuration**:
```python
reducer = umap.UMAP(
    n_neighbors=15,      # Balance local vs global structure
    min_dist=0.1,        # Minimum spacing between points
    n_components=3,      # 3D output
    metric='cosine',     # Semantic similarity
    random_state=42,     # Reproducibility
)
```

#### Why This Design?

**For POC** (≤5 users):
- ✅ No infrastructure cost (runs locally)
- ✅ Fast to implement (no microservice deployment)
- ✅ Easy to iterate (change UMAP parameters locally)
- ❌ Poor UX (multi-step manual process)
- ❌ Requires technical setup (Python + service key)

**For Production** (see `docs/knowledge-graph/FUTURE_SCALING.md`):
- Move UMAP to separate Python microservice (AWS Lambda)
- Add background job queue (Upstash QStash)
- Implement incremental UMAP (transform new nodes into existing space)
- Add Realtime sync for live updates

#### Documentation

- **Setup Guide**: `docs/knowledge-graph/UMAP_GUIDE.md`
- **Scaling Plan**: `docs/knowledge-graph/FUTURE_SCALING.md`
- **Edge Function Code**: `supabase/functions/recompute-knowledge-graph/index.ts`
- **Client Function**: `src/lib/knowledge/recomputeGraph.ts`
- **Local Script**: `src/scripts/fetchAndProjectUMAP.ts`

---

## Performance & Optimization

### 1. React Query Caching

**Problem**: Re-fetching data on every render wastes API calls.

**Solution**: React Query caches data and only refetches when stale.

```typescript
const { data, isLoading } = useQuery({
  queryKey: ['habits'],
  queryFn: fetchHabits,
  staleTime: 5 * 60 * 1000,  // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
});
```

### 2. Memoization

**Problem**: Expensive calculations run on every render.

**Solution**: `useMemo` and `useCallback`.

```typescript
// Memoize expensive graph calculations
const nodePositions = useMemo(() => {
  return nodes.map((node, i) => ({
    ...node,
    x: node.x ?? calculateX(i),
    y: node.y ?? calculateY(i),
    z: node.z ?? calculateZ(i),
  }));
}, [nodes]);

// Memoize connected nodes map
const connectedNodes = useMemo(() => {
  const map = new Map<string, Set<string>>();
  edges.forEach(edge => {
    if (!map.has(edge.source_id)) map.set(edge.source_id, new Set());
    if (!map.has(edge.target_id)) map.set(edge.target_id, new Set());
    map.get(edge.source_id)!.add(edge.target_id);
    map.get(edge.target_id)!.add(edge.source_id);
  });
  return map;
}, [edges]);
```

### 3. Offload Heavy Computation

**Before**: Client-side JSON parsing and AI calls (froze browser)
**After**: Server-side processing in Edge Function

**Benefits**:
- Non-blocking UI
- Faster execution (server CPU)
- Progress updates via callbacks
- Retry logic on server

### 4. Database Indexing

```sql
-- Index foreign keys for fast joins
CREATE INDEX idx_habits_user_id ON habits(user_id);
CREATE INDEX idx_habit_completions_habit_id ON habit_completions(habit_id);

-- Index for date-based queries
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_diary_entries_date ON diary_entries(entry_date);

-- Composite index for common queries
CREATE INDEX idx_tasks_user_completed ON tasks(user_id, completed);
```

### 5. Lazy Loading Routes

```typescript:src/App.tsx
import { lazy, Suspense } from 'react';

const KnowledgeGraph = lazy(() => import('./pages/KnowledgeGraph'));

<Route
  path="/knowledge"
  element={
    <Suspense fallback={<LoadingScreen />}>
      <KnowledgeGraph />
    </Suspense>
  }
/>
```

**Benefit**: Knowledge Graph bundle only loads when user visits `/knowledge`.

---

## Deployment

### Frontend (Vercel)

**Configuration**:

```json:vercel.json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

**Why `rewrites`?**
- React Router uses client-side routing
- Direct navigation to `/knowledge` would 404 without this
- Rewrite all routes to `index.html`, let React Router handle it

**Build Command**:
```bash
npm run build
# Outputs to /dist folder
# Vercel automatically deploys /dist
```

### Backend (Supabase)

**1. Database Migrations**:
```bash
# Apply migrations locally
supabase db reset

# Push to production
supabase db push
```

**2. Edge Functions**:
```bash
# Deploy Edge Function
supabase functions deploy process-knowledge-graph

# Set secrets (OpenAI API key)
supabase secrets set OPENAI_API_KEY=sk-...
```

**3. Storage Buckets**:
- Created via migration: `knowledge-graph-uploads`
- RLS policies: Users can only access their own folder
- Max file size: 50MB (free tier limit)

### Environment Variables

**Frontend (`.env`)**:
```bash
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...  # Public anon key
```

**Backend (Supabase Dashboard → Settings → Secrets)**:
```bash
OPENAI_API_KEY=sk-...  # Server-only, never exposed
```

---

## Code Patterns & Best Practices

### 1. Error Handling

**Pattern**: Always handle errors explicitly, provide user feedback.

```typescript
const createHabit = useMutation({
  mutationFn: async (habit: Partial<Habit>) => {
    const { data, error } = await supabase
      .from('habits')
      .insert([habit])
      .select()
      .single();
    
    if (error) throw error;  // React Query will catch this
    return data;
  },
  onError: (error) => {
    toast({
      title: "Failed to create habit",
      description: error.message,
      variant: "destructive",
    });
  },
  onSuccess: () => {
    toast({
      title: "Habit created!",
      description: "Your new habit has been saved.",
    });
  },
});
```

### 2. TypeScript Strict Mode

**Pattern**: Enable strict mode, use explicit types.

```typescript:tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
  }
}
```

```typescript
// Good: Explicit types
interface Habit {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
}

function createHabit(habit: Omit<Habit, 'id' | 'created_at'>): Promise<Habit> {
  // ...
}

// Bad: Implicit any
function createHabit(habit): Promise<any> {
  // ...
}
```

### 3. Component Composition

**Pattern**: Break down large components into smaller, reusable pieces.

```typescript
// Bad: Monolithic component
function TaskPage() {
  return (
    <div>
      {/* 500 lines of mixed logic */}
    </div>
  );
}

// Good: Composed components
function TaskPage() {
  return (
    <div>
      <TaskHeader />
      <TaskFilters />
      <TaskList />
      <TaskFooter />
    </div>
  );
}
```

### 4. Custom Hooks for Reusability

**Pattern**: Extract common logic into custom hooks.

```typescript
// Reusable hook for any Supabase table
function useSupabaseQuery<T>(
  table: string,
  queryKey: string[],
  filters?: any
) {
  return useQuery({
    queryKey,
    queryFn: async () => {
      let query = supabase.from(table).select('*');
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as T[];
    },
  });
}

// Usage
const { data: habits } = useSupabaseQuery<Habit>('habits', ['habits']);
const { data: tasks } = useSupabaseQuery<Task>('tasks', ['tasks'], { completed: false });
```

### 5. Optimistic Updates

**Pattern**: Update UI immediately, rollback on error.

```typescript
const toggleTask = useMutation({
  mutationFn: async (taskId: string) => {
    const { error } = await supabase
      .from('tasks')
      .update({ completed: !task.completed })
      .eq('id', taskId);
    
    if (error) throw error;
  },
  onMutate: async (taskId) => {
    // Cancel ongoing queries
    await queryClient.cancelQueries({ queryKey: ['tasks'] });
    
    // Snapshot previous state
    const previousTasks = queryClient.getQueryData(['tasks']);
    
    // Optimistically update UI
    queryClient.setQueryData(['tasks'], (old: Task[]) =>
      old.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t)
    );
    
    return { previousTasks };  // Context for rollback
  },
  onError: (err, variables, context) => {
    // Rollback on error
    queryClient.setQueryData(['tasks'], context.previousTasks);
  },
  onSettled: () => {
    // Refetch to sync with server
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
  },
});
```

### 6. Accessibility

**Pattern**: Use semantic HTML and ARIA attributes.

```typescript
// Good: Semantic, accessible
<button
  onClick={handleClick}
  aria-label="Mark habit as complete"
  disabled={isLoading}
>
  Complete
</button>

// Bad: Non-semantic, inaccessible
<div onClick={handleClick}>
  Complete
</div>
```

### 7. Structured Logging

**Pattern**: Use structured logs for debugging.

```typescript
// Good: Structured, searchable
console.log('Edge Function: Processing conversation', {
  conversationId: conv.id,
  userId: user.id,
  messageCount: messages.length,
  timestamp: new Date().toISOString(),
});

// Bad: Unstructured
console.log('processing conversation ' + conv.id);
```

---

## Architecture Decisions & Trade-offs

### 1. Supabase vs. Custom Backend

**Chose Supabase**:
- ✅ Faster development (auth, DB, storage included)
- ✅ Built-in RLS (security by default)
- ✅ Real-time subscriptions (future feature)
- ❌ Vendor lock-in (mitigated: PostgreSQL is portable)
- ❌ Limited Edge Function runtime (150s free tier)

### 2. React Query vs. Redux

**Chose React Query**:
- ✅ Purpose-built for server state
- ✅ Auto caching, refetching, optimistic updates
- ✅ Less boilerplate than Redux
- ❌ Not ideal for complex client state (but we don't have much)

### 3. 3D Graph vs. 2D Graph

**Why offer both?**:
- 3D is visually impressive, shows clustering in 3D space
- 2D is more performant, easier to read for some users
- Let user choose based on preference

### 4. Edge Function vs. Client-Side Processing

**Chose Edge Function**:
- ✅ Non-blocking UI (no browser freeze)
- ✅ API key security
- ✅ Faster (server CPU)
- ❌ More complex deployment
- ❌ 150s timeout (mitigated: process only 15 conversations)

### 5. Conversation Limit (15)

**Why limit?**:
- Free tier Edge Functions timeout at 150s
- Each conversation takes ~6-10s (OpenAI API calls)
- 15 conversations = ~90-150s (right at the edge)
- **Future**: Batch processing, background jobs, or paid tier

---

## Future Enhancements

### Short-Term (MVP+)
1. **Knowledge Graph Pagination**: Process all conversations in batches
2. **Enhanced Diary**: Rich text editor (Tiptap), mood tracking
3. **Habit Streaks**: Visual streak counter, streak recovery
4. **Task Subtasks**: Nested task hierarchies

### Medium-Term
1. **Mobile App**: React Native or Progressive Web App (PWA)
2. **Real-time Collaboration**: Share habits/tasks with friends (Supabase Realtime)
3. **AI Insights**: Weekly summaries, habit recommendations
4. **Export/Backup**: Download all data as JSON/CSV

### Long-Term
1. **Knowledge Graph Enhancements**:
   - Topic clustering (ML-based)
   - Time-based evolution view
   - Multi-modal (images, audio notes)
2. **Gamification**: XP, levels, achievements
3. **Integrations**: Google Calendar, Notion, Obsidian

---

## Learning Resources

### Key Concepts to Explore Further

1. **React Query (TanStack Query)**
   - [Official Docs](https://tanstack.com/query/latest)
   - Concept: Server state management, caching strategies

2. **Supabase Row Level Security (RLS)**
   - [Official Docs](https://supabase.com/docs/guides/auth/row-level-security)
   - Concept: Database-level authorization

3. **react-three-fiber**
   - [Official Docs](https://docs.pmnd.rs/react-three-fiber)
   - Concept: Declarative 3D rendering with React

4. **OpenAI Embeddings**
   - [Official Docs](https://platform.openai.com/docs/guides/embeddings)
   - Concept: Semantic similarity, vector search

5. **Supabase Edge Functions**
   - [Official Docs](https://supabase.com/docs/guides/functions)
   - Concept: Serverless functions, Deno runtime

6. **K-Nearest Neighbors (kNN)**
   - Concept: Graph construction, similarity search

7. **TypeScript Advanced Types**
   - `Omit<T, K>`, `Pick<T, K>`, `Partial<T>`, discriminated unions

---

## Conclusion

This application demonstrates modern full-stack development with:
- **Type-safe** (TypeScript everywhere)
- **Secure** (RLS, JWT, server-side secrets)
- **Performant** (React Query caching, memoization, lazy loading)
- **Scalable** (Supabase can handle millions of users)
- **Maintainable** (Component composition, custom hooks, structured patterns)

The Knowledge Graph feature showcases advanced concepts:
- AI integration (OpenAI)
- 3D visualization (Three.js)
- Serverless architecture (Edge Functions)
- Vector similarity search (embeddings, kNN)

---

**Questions to Consider**:
1. Should we increase the conversation limit (requires paid tier or batch processing)?
2. Is 3D visualization necessary, or should we focus on 2D performance?
3. Should we add real-time collaboration features (shared habits)?
4. What's the priority: mobile app or more web features?

---

**End of Architecture Overview**  
*Feel free to ask questions or request deeper dives into specific areas!*

