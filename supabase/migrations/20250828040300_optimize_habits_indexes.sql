-- Optimize habits table queries for better performance
-- This migration adds composite indexes for common query patterns

-- Index for user_id + phase queries (most common)
CREATE INDEX IF NOT EXISTS idx_habits_user_phase 
ON public.habits(user_id, phase);

-- Index for user_id + created_at queries (for ordering)
CREATE INDEX IF NOT EXISTS idx_habits_user_created 
ON public.habits(user_id, created_at DESC);

-- Index for user_id + last_completed queries (for streak calculations)
CREATE INDEX IF NOT EXISTS idx_habits_user_last_completed 
ON public.habits(user_id, last_completed DESC);

-- Index for user_id + streak queries (for adoption logic)
CREATE INDEX IF NOT EXISTS idx_habits_user_streak 
ON public.habits(user_id, streak DESC);

-- Composite index for complex queries (user + phase + ordering)
CREATE INDEX IF NOT EXISTS idx_habits_user_phase_created 
ON public.habits(user_id, phase, created_at DESC);

-- Index for category filtering
CREATE INDEX IF NOT EXISTS idx_habits_category 
ON public.habits(category);

-- Index for points (for leaderboard features)
CREATE INDEX IF NOT EXISTS idx_habits_points 
ON public.habits(points DESC);

-- Analyze the table to update statistics
ANALYZE public.habits;

