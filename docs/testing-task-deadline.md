# Testing Guide: Task vs Deadline Feature

## Setup
1. Ensure the database migration has been applied:
   ```bash
   npx supabase migration up
   # or push to trigger automatic deployment
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

## Test Cases

### Test 1: Create a Deadline
1. Navigate to the calendar (Month view)
2. Open the task panel (if not already open)
3. Select a task from the task list
4. Drag the task to a day cell
5. **While dragging**: Hover over the upper portion (top 30%) of the cell
   - **Expected**: Red top border appears on the cell
6. Drop it in the **upper portion** of the cell
7. **Expected Result**: 
   - Task displays as a solid colored rectangle
   - Background color matches the task list's category color
   - White text showing task name
   - No checkbox visible
   - Delete button (X) appears on hover

### Test 2: Create a Regular Task
1. Drag a task from the task panel
2. **While dragging**: Hover over the lower portion (bottom 70%) of a day cell
   - **Expected**: Blue border appears around entire cell
3. Drop it in the **lower portion**
4. **Expected Result**:
   - Task displays with a checkbox
   - Standard task styling (text color, hover effects)
   - Checkbox is functional (can check/uncheck)
   - Delete button (X) appears on hover

### Test 3: Multiple Tasks in Same Day
1. Create both a deadline and a regular task in the same day
2. **Expected Result**:
   - Both display correctly with different styles
   - Deadlines appear as colored rectangles
   - Tasks appear with checkboxes
   - Both can be deleted independently

### Test 4: Week View
1. Switch to Week view
2. Verify that existing deadlines display correctly
3. **Expected Result**:
   - Deadlines show as colored rectangles
   - Tasks show with checkboxes
   - Note: Drop zone detection not yet implemented in Week view

### Test 5: Day View
1. Switch to Day view
2. Verify that existing deadlines display correctly
3. **Expected Result**:
   - Same as Week view
   - Deadlines and tasks render with correct styles

### Test 6: Task List Colors
1. Create tasks from different task lists (with different colors)
2. Drop them as deadlines
3. **Expected Result**:
   - Each deadline shows the color of its task list
   - Colors should be clearly distinguishable

## Visual Reference

### Deadline Display
```
┌─────────────────────────┐
│ ████████████████████████│  ← Solid background (task list color)
│ █ Important Meeting  █  │  ← White text, no checkbox
│ ████████████████████████│
└─────────────────────────┘
```

### Task Display
```
┌─────────────────────────┐
│ ☐ Buy groceries        │  ← Checkbox + text
└─────────────────────────┘
```

## Known Issues / Limitations
1. Drop zone detection only implemented in Month view
   - Week and Day views render correctly but don't have drop zone detection yet
2. Visual indicators during drag only in Month view
3. Cannot change display type after creation (must delete and recreate)

## Edge Cases to Test
1. Task with very long name (should truncate)
2. Task list with no color set (should use default)
3. Multiple deadlines on the same day
4. Deadline with completed status (behavior TBD)
5. Drag deadline to different day (should preserve display type)

## Debugging
If issues occur, check:
1. Browser console for errors
2. Network tab for database errors
3. Database schema: verify `display_type` column exists
4. Task list has valid color value
