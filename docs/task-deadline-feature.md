# Task vs Deadline Display Feature

## Overview
Tasks can now be displayed in two different ways on the calendar based on where they are dropped in a day cell:

1. **Deadline** - Dropped in upper 30% of day cell
   - Displays as a rectangle with the task list's background color
   - Shows only the task name (no checkbox)
   - Used for important deadlines that need visual prominence

2. **Task** - Dropped in lower 70% of day cell
   - Displays with a checkbox for completion tracking
   - Standard task display format

## Implementation Details

### Database Changes
- **Migration**: `20260204000000_add_display_type_to_calendar_items.sql`
- Added `display_type` column to `calendar_items` table
- Values: `'task'` | `'deadline'` | `null`
- Existing tasks default to `'task'`

### Code Changes

#### 1. Database Schema
- `calendar_items` table now includes `display_type` field
- Type definition updated in `CalendarItemWithDetails` interface

#### 2. Drop Detection
- **MonthView.tsx**: 
  - Updated `handleDrop` to calculate drop position
  - Upper 30% of cell = deadline zone
  - Lower 70% of cell = task zone
  - `onTaskDrop` signature updated to include `displayType` parameter

#### 3. Task Scheduling
- **useCalendarItems.tsx**:
  - `scheduleTask` function now accepts `displayType` option
  - Stores display type in database when scheduling

#### 4. Task Rendering
- **CalendarTaskItem.tsx**:
  - Added `displayType` prop
  - Renders differently based on display type:
    - **Deadline**: Rectangle with full background color, no checkbox
    - **Task**: Standard display with checkbox

#### 5. View Updates
All calendar views now support the display type:
- **MonthView.tsx**: Full drop zone detection + rendering
- **WeekView.tsx**: Display type rendering (drop zone detection pending)
- **DayView.tsx**: Display type rendering (drop zone detection pending)

### Files Modified
1. `/supabase/migrations/20260204000000_add_display_type_to_calendar_items.sql` (new)
2. `/src/hooks/useCalendarItems.tsx`
3. `/src/components/calendar/MonthView.tsx`
4. `/src/components/calendar/CalendarTaskItem.tsx`
5. `/src/components/calendar/WeekView.tsx`
6. `/src/components/calendar/DayView.tsx`
7. `/src/components/calendar/UnifiedCalendar.tsx`
8. `/src/pages/Index.tsx`

## Usage

### For Users
1. Drag a task from the task panel
2. As you hover over a day cell, you'll see visual feedback:
   - **Upper 30%**: Red top border (deadline zone)
   - **Lower 70%**: Blue border (task zone)
3. Drop in the **upper portion** to create a deadline
4. Drop in the **lower portion** to create a regular task

### Visual Differences

#### During Drag
- **Deadline Zone** (upper 30%): Cell shows red top border
- **Task Zone** (lower 70%): Cell shows blue border around entire cell

#### After Drop
- **Deadline**: Solid colored rectangle with white text, no checkbox
- **Task**: Text with checkbox, standard styling

## Future Enhancements
- Add visual drop zone indicators during drag (highlight upper vs lower zones)
- Implement drag-to-reposition within same day to change display type
- Add context menu to toggle between task/deadline display types
- Extend drop zone detection to Week and Day views

## Migration
To apply the database migration:
```bash
# For local development
npx supabase migration up

# For production
git push # Migrations run automatically on deploy
```

## Testing
1. Build verification: ✅ Passed
2. TypeScript compilation: ✅ No errors
3. Manual testing required:
   - Drag tasks to upper portion of day cells → Should display as deadlines
   - Drag tasks to lower portion → Should display as regular tasks
   - Verify color comes from task list category
   - Test in Month, Week, and Day views
