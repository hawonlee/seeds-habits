import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useHabits, type Habit, type HabitTargetUnit } from "@/hooks/useHabits";
import { useDiaryEntries } from "@/hooks/useDiaryEntries";
import { useHabitSchedules } from "@/hooks/useHabitSchedules";
import { useCalendarItems } from "@/hooks/useCalendarItems";
import { useTasks } from "@/hooks/useTasks";
import type { Database } from "@/integrations/supabase/types";
import { CurrentHabitsList } from "@/components/habits/CurrentHabitsList";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import * as ResizablePrimitive from "react-resizable-panels";
import { ExternalPanelToggle } from "@/components/ui/external-panel-toggle";
import { CurrentHabitsSidePanel } from "@/components/layout/CurrentHabitsSidePanel";
import { FutureAdoptedHabitsSidePanel } from "@/components/layout/FutureAdoptedHabitsSidePanel";
import { MainLayout } from "@/components/layout/MainLayout";
import { DiaryView } from "@/components/diary/DiaryView";
import { AddHabitDialog } from "@/components/habits/AddHabitDialog";
import { AdoptionSettingsDialog } from "@/components/habits/AdoptionSettingsDialog";
import { EditHabitDialog } from "@/components/habits/EditHabitDialog";
import { HabitCard } from "@/components/habits/HabitCard";
import { UserDropdown } from "@/components/layout/UserDropdown";
import { UserSettingsModal } from "@/components/layout/UserSettingsModal";
import { UnifiedCalendar } from "@/components/calendar/UnifiedCalendar";
import { DayHabitsDialog } from "@/components/habits/DayHabitsDialog";
import { Button } from "@/components/ui/button";
import { SegmentedToggle } from "@/components/ui/segmented-toggle";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LandingPage } from "@/pages/LandingPage";
import { TasksView } from "@/components/tasks/TasksView";
// import { CalendarSidePanel } from "@/components/layout/CalendarSidePanel";
import {
  Loader2,
  Calendar,
  ChevronRight,
  ChevronDown,
  PanelLeft,
  PanelRight,
  CalendarIcon,
  ListIcon,
  Settings,
  Album,
  ListCheck,
  SquareCheck
} from "lucide-react";



const Index = () => {
  const { user, loading, signOut } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { habits, loading: habitsLoading, hasLoaded, addHabit, updateHabit, deleteHabit, checkInHabit, undoCheckIn, moveHabitPhase, reorderHabits, refreshHabits } = useHabits();
  const { scheduleHabit, unscheduleHabit, schedules, isHabitScheduledOnDate, getScheduledHabitsForDate } = useHabitSchedules();
  const {
    calendarItems,
    scheduleHabit: scheduleHabitToCalendar,
    scheduleTask: scheduleTaskToCalendar,
    unscheduleItem,
    moveItem,
    deleteCalendarItemById,
    refreshCalendarItems
  } = useCalendarItems();
  const { diaryEntries } = useDiaryEntries();
  const { tasks, taskLists, updateTask, deleteTask, loading: tasksLoading } = useTasks();
  const navigate = useNavigate();
  const location = useLocation();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [addToPhase, setAddToPhase] = useState<'future' | 'current' | 'adopted'>('future');
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [showAdoptionSettings, setShowAdoptionSettings] = useState(false);
  const [adoptionThreshold, setAdoptionThreshold] = useState(21);
  const [showCalendar, setShowCalendar] = useState(false);
  const [isCalendarPanelCollapsed, setIsCalendarPanelCollapsed] = useState(true);
  const [layout, setLayout] = useState<number[] | undefined>([55, 45]);
  const mainPanelRef = useRef<ResizablePrimitive.ImperativePanelHandle | null>(null);
  const calendarPanelRef = useRef<ResizablePrimitive.ImperativePanelHandle | null>(null);
  const [mainCollapsed, setMainCollapsed] = useState(false);
  const [calendarCollapsed, setCalendarCollapsed] = useState(false);
  const [showDiary, setShowDiary] = useState(false);
  const [showTasks, setShowTasks] = useState(true);
  const [showUserSettings, setShowUserSettings] = useState(false);

  // Update view state based on URL
  useEffect(() => {
    if (location.pathname === '/calendar') {
      setShowCalendar(true);
      setIsCalendarPanelCollapsed(false);
      setShowDiary(false);
      setShowTasks(false);
      // Do not force panel sizes here; preserve current layout
    } else if (location.pathname === '/diary') {
      setShowCalendar(false);
      setShowDiary(true);
      setShowTasks(false);
      // Preserve current panel states (calendar remains open if it was open)
    } else if (location.pathname === '/tasks') {
      setShowCalendar(false);
      setShowDiary(false);
      setShowTasks(true);
      // Preserve current panel states (calendar remains open if it was open)
    } else {
      setShowCalendar(false);
      setShowDiary(false);
      setShowTasks(true);
      // Keep current layout
    }
  }, [location.pathname]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [draggedHabit, setDraggedHabit] = useState<Habit | null>(null);
  const [newHabit, setNewHabit] = useState({
    title: '',
    notes: '',
    category: 'none',
    target_value: 1,
    target_unit: 'day' as HabitTargetUnit,
    custom_days: [] as number[],
    leniency_threshold: 2
  });

  // Panel collapse states
  const [isCombinedPanelCollapsed, setIsCombinedPanelCollapsed] = useState(true);
  const [isMainCollapsed, setIsMainCollapsed] = useState(false);

  const totalPoints = habits.filter(h => h.phase === 'adopted').reduce((sum, h) => sum + h.points, 0);
  const currentHabits = habits.filter(h => h.phase === 'current');
  const adoptedHabits = habits.filter(h => h.phase === 'adopted');
  const futureHabits = habits.filter(h => h.phase === 'future');


  const handleAddHabit = async () => {
    if (!newHabit.title.trim()) return;

    const habitData = {
      title: newHabit.title,
      notes: newHabit.notes,
      category: newHabit.category,
      target_value: newHabit.target_value,
      target_unit: newHabit.target_unit,
      custom_days: newHabit.custom_days,
      leniency_threshold: newHabit.leniency_threshold,
      phase: addToPhase,
      streak: 0,
      total_completions: 0,
      points: 0,
      position: 0,
    };

    await addHabit(habitData);
    setNewHabit({
      title: '',
      notes: '',
      category: 'none',
      target_value: 1,
      target_unit: 'day',
      custom_days: [],
      leniency_threshold: 2
    });
    setIsAddDialogOpen(false);
  };

  const handleEditHabit = (habit: Habit) => {
    setEditingHabit(habit);
    setNewHabit({
      title: habit.title,
      notes: habit.notes || '',
      category: habit.category,
      target_value: habit.target_value,
      target_unit: habit.target_unit,
      custom_days: habit.custom_days || [],
      leniency_threshold: habit.leniency_threshold
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateHabit = async () => {
    if (!editingHabit || !newHabit.title.trim()) return;

    await updateHabit(editingHabit.id, {
      title: newHabit.title,
      notes: newHabit.notes,
      category: newHabit.category,
      target_value: newHabit.target_value,
      target_unit: newHabit.target_unit,
      custom_days: newHabit.custom_days,
      leniency_threshold: newHabit.leniency_threshold,
    });

    setEditingHabit(null);
    setIsEditDialogOpen(false);
    setNewHabit({
      title: '',
      notes: '',
      category: 'none',
      target_value: 1,
      target_unit: 'day',
      custom_days: [],
      leniency_threshold: 2
    });
  };

  const handleInlineUpdateHabit = async (updatedHabit: Partial<Habit>) => {
    if (!updatedHabit.title?.trim()) return;

    await updateHabit(updatedHabit.id!, {
      title: updatedHabit.title,
      notes: updatedHabit.notes,
      category: updatedHabit.category,
      target_value: updatedHabit.target_value,
      target_unit: updatedHabit.target_unit,
      custom_days: updatedHabit.custom_days,
      leniency_threshold: updatedHabit.leniency_threshold,
    });
  };

  const handleDeleteHabit = async (id: string) => {
    await deleteHabit(id);
  };

  const handleMoveHabit = async (id: string, newPhase: Habit['phase']) => {
    try {
      const result = await moveHabitPhase(id, newPhase);
      if (result?.error) {
        console.error('Error moving habit:', result.error);
      } else {
        // Reset dialog state after successful move
        setEditingHabit(null);
        setIsEditDialogOpen(false);
      }
    } catch (error) {
      console.error('Error in handleMoveHabit:', error);
    }
  };

  const handleCheckIn = async (id: string, date?: Date) => {
    // For calendar views, we need to handle date-specific check-ins
    if (date) {
      // For now, we'll use the existing checkInHabit function
      // In a more advanced system, you'd store check-ins per date
      await checkInHabit(id);
    } else {
      await checkInHabit(id);
    }
  };

  const handleUndoCheckIn = async (id: string, date?: Date) => {
    // For calendar views, we need to handle date-specific undo
    if (date) {
      // For now, we'll use the existing undoCheckIn function
      // In a more advanced system, you'd undo check-ins per date
      await undoCheckIn(id);
    } else {
      await undoCheckIn(id);
    }
  };

  const handleDayClick = (date: Date, habits: Habit[]) => {
    setSelectedDate(date);
    // No overlay dialog; Month view uses inline popover
  };

  const handleDragStart = (habit: Habit) => {
    setDraggedHabit(habit);
  };

  const handleHabitDrop = async (habitId: string, date: Date, isAllDay?: boolean) => {
    // When a habit is dropped on a calendar day or time grid, schedule accordingly
    const success = await scheduleHabitToCalendar(habitId, date, { isAllDay });

    setDraggedHabit(null);
  };

  const handleHabitUnschedule = async (habitId: string, date: Date) => {
    // Try to unschedule from calendar_items first (for dragged habits)
    const calendarSuccess = await unscheduleItem('habit', habitId, date);
    if (calendarSuccess) {
      console.log(`Habit ${habitId} unscheduled from calendar_items for ${date.toDateString()}`);
      return;
    }

    // If not found in calendar_items, try habit_schedules (for frequency-based scheduling)
    const scheduleSuccess = await unscheduleHabit(habitId, date);
    if (scheduleSuccess) {
      console.log(`Habit ${habitId} unscheduled from habit_schedules for ${date.toDateString()}`);
    } else {
      console.log(`Failed to unschedule habit ${habitId} from ${date.toDateString()}`);
    }
  };

  type DiaryEntry = Database['public']['Tables']['diary_entries']['Row'];

  const handleDiaryEntryClick = (entry: DiaryEntry) => {
    // Open the diary page with the entry loaded in the panel
    navigate('/diary', { state: { diaryEntryId: entry.id } });
  };

  const handleTaskToggleComplete = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      await updateTask(taskId, { completed: !task.completed });
    }
  };

  const handleTaskDrop = async (taskId: string, date: Date, isAllDay?: boolean) => {
    // When a task is dropped on a calendar day, schedule it for that specific date
    const success = await scheduleTaskToCalendar(taskId, date, { isAllDay });
    if (success) {
      console.log(`Task ${taskId} scheduled for ${date.toDateString()}`);
      // Ensure calendar updates immediately with latest data
      await refreshCalendarItems();
    } else {
      console.log(`Failed to schedule task ${taskId} for ${date.toDateString()}`);
    }
  };

  const handleTaskDelete = async (taskId: string, date?: Date) => {
    try {
      if (date) {
        // Unschedule the task from the calendar
        await unscheduleItem('task', taskId, date);
        console.log(`Task ${taskId} unscheduled from ${date.toDateString()}`);
      } else {
        console.log(`Task ${taskId} delete requested but no date provided`);
      }
    } catch (error) {
      console.error(`Failed to unschedule task ${taskId}:`, error);
    }
  };

  const handleCalendarItemDelete = async (calendarItemId: string) => {
    try {
      await deleteCalendarItemById(calendarItemId);
    } catch (error) {
      console.error(`Failed to delete calendar item ${calendarItemId}:`, error);
    }
  };

  const handleViewChange = (view: 'list' | 'calendar' | 'diary' | 'tasks') => {
    if (view === 'diary') {
      setShowDiary(true);
      setShowCalendar(false);
      setShowTasks(false);
      navigate('/diary');
    } else if (view === 'calendar') {
      setShowDiary(false);
      setShowCalendar(true);
      setShowTasks(false);
      navigate('/calendar');
    } else if (view === 'tasks') {
      setShowDiary(false);
      setShowCalendar(false);
      setShowTasks(true);
      navigate('/tasks');
    } else {
      setShowDiary(false);
      setShowCalendar(false);
      setShowTasks(false);
      navigate('/');
    }
  };

  const displayName = profile?.name || user?.email?.split('@')[0] || 'Guest';
  const userInitials = displayName.split(' ').map(n => n[0]).join('').toUpperCase();

  if (!loading && !user) {
    // Not logged in -> show landing/auth page
    return <LandingPage />;
  }

  return (
    <div className="h-screen bg-white overflow-hidden">

      <main className="h-full">

        <AddHabitDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          addToPhase={addToPhase}
          newHabit={newHabit}
          setNewHabit={setNewHabit}
          onAddHabit={handleAddHabit}
        />

        <AdoptionSettingsDialog
          open={showAdoptionSettings}
          onOpenChange={setShowAdoptionSettings}
          adoptionThreshold={adoptionThreshold}
          setAdoptionThreshold={setAdoptionThreshold}
        />

        <UserSettingsModal
          open={showUserSettings}
          onOpenChange={setShowUserSettings}
        />

        {isEditDialogOpen && (
          <EditHabitDialog
            key={editingHabit?.id || 'new'}
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            editingHabit={editingHabit}
            newHabit={newHabit}
            setNewHabit={setNewHabit}
            onUpdateHabit={handleUpdateHabit}
            onDelete={handleDeleteHabit}
            onAdopt={(id) => handleMoveHabit(id, 'adopted')}
            onMoveToFuture={(id) => handleMoveHabit(id, 'future')}
          />
        )}

        {/* Habit Dashboard - resizable panels */}
        <div className="h-full flex">
          {/* Navigation sidebar commented out */}
          {/*
          {mainCollapsed && (
            <div className={`w-12 shrink-0 h-full pt-6 pb-4 px-1 flex flex-col items-center justify-between gap-2 text-xs text-muted-foreground select-none bg-background ${mainCollapsed ? '' : 'ml-[0.5px] border-r border-border'}`}>
             <div className="flex flex-col items-center gap-5">
                <Button
                  size="text"
                  variant="text"
                  className=""
                  onClick={() => {
                    if (mainCollapsed) {
                      // Expand the panel
                      requestAnimationFrame(() => {
                        (mainPanelRef.current as any)?.setSize?.(20);
                      });
                      setMainCollapsed(false);
                    } else {
                      (mainPanelRef.current as any)?.collapse?.();
                      setMainCollapsed(true);
                    }
                  }}
                  title={mainCollapsed ? "Show content" : "Hide content"}
                >
                  <PanelLeft className="h-4 w-4" />
                </Button>
  
                <div className="flex flex-col items-center gap-1">
                <Button
                  size="smallicon"
                  variant="text"
                  className={`w-8 h-8 p-0 ${!showTasks && !showDiary ? 'bg-tertiary text-secondary-foreground' : ''}`}
                  onClick={() => handleViewChange('list')}
                  title="Habits"
                >
                  <ListCheck className="h-4 w-4" />
                </Button>
                <Button
                  size="smallicon"
                  variant="text"
                  className={`w-8 h-8 p-0 ${showTasks ? 'bg-tertiary text-accent-foreground' : ''}`}
                  onClick={() => handleViewChange('tasks')}
                  title="Tasks"
                >
                  <SquareCheck className="h-4 w-4" />
                </Button>
                <Button
                  size="smallicon"
                  variant="text"
                  className={`w-8 h-8 p-0 ${showDiary ? 'bg-tertiary text-accent-foreground' : ''}`}
                  onClick={() => handleViewChange('diary')}
                  title="Diary"
                >
                  <Album className="h-4 w-4" />
                </Button>
                </div>
             </div>

              <UserDropdown
                user={user}
                profile={profile}
                displayName={profile?.name || user?.email || 'User'}
                userInitials={(profile?.name || user?.email || 'User').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                onOpenSettings={() => setShowUserSettings(true)}
                onSignOut={signOut}
              />
            </div>
          )}
          */}
          <div className="flex-1 min-w-0">
            <ResizablePanelGroup
              direction="horizontal"
              className="h-full"
              onLayout={(sizes) => {
                setLayout(sizes);
                // Track collapsed state based on size percentages
                const leftIsCollapsed = sizes[0] <= 0.1;
                const rightIsCollapsed = sizes[1] <= 0.1;
                if (leftIsCollapsed !== mainCollapsed) setMainCollapsed(leftIsCollapsed);
                if (rightIsCollapsed !== calendarCollapsed) setCalendarCollapsed(rightIsCollapsed);
              }}
            >
              <ResizablePanel
                defaultSize={40}
                minSize={20}
                collapsible
                collapsedSize={0}
                ref={mainPanelRef}
              >
                <div className={`h-full bg-background flex`}>
                  {/* Always show collapsed sidebar */}
                  {/* <div className="h-full w-16 py-7 px-1 flex flex-col items-center justify-between gap-2 text-xs text-muted-foreground select-none border-r border-border">
                    <Button
                      size="text"
                      variant="text"
                      className=""
                      onClick={() => {
                        if (mainCollapsed) {
                          // Expand to the panel's minSize (20%) when reopening
                          (mainPanelRef.current as any)?.expand?.();
                          requestAnimationFrame(() => {
                            (mainPanelRef.current as any)?.setSize?.(20);
                          });
                          setMainCollapsed(false);
                        } else {
                          // Collapse the panel
                          (mainPanelRef.current as any)?.collapse?.();
                          setMainCollapsed(true);
                        }
                      }}
                      title={mainCollapsed ? "Show content" : "Hide content"}
                    >
                      <PanelLeft className="h-4 w-4" />
                    </Button>

                    <UserDropdown
                      user={user}
                      profile={profile}
                      displayName={profile?.name || user?.email || 'User'}
                      userInitials={(profile?.name || user?.email || 'User').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      onOpenSettings={() => setShowUserSettings(true)}
                      onSignOut={signOut}
                    />
                  </div> */}

                  {/* Main content area */}
                  <div className="flex-1 h-full">
                    <MainLayout
                      showCalendar={showCalendar}
                      showDiary={showDiary}
                      showTasks={showTasks}
                      onViewChange={handleViewChange}
                      isCombinedPanelCollapsed={isCombinedPanelCollapsed}
                      onTogglePanel={() => setIsCombinedPanelCollapsed(!isCombinedPanelCollapsed)}
                      isCalendarPanelCollapsed={calendarCollapsed}
                      onToggleCalendarPanel={() => {
                        if (calendarCollapsed) calendarPanelRef.current?.expand(); else calendarPanelRef.current?.collapse();
                      }}
                      isMainCollapsed={mainCollapsed}
                      onToggleMainCollapsed={() => {
                        if (mainCollapsed) mainPanelRef.current?.expand(); else mainPanelRef.current?.collapse();
                      }}
                      onOpenSettings={() => setShowUserSettings(true)}
                    >
                      {showDiary ? (
                        <DiaryView 
                          onToggleCalendar={() => {
                            if (calendarCollapsed) calendarPanelRef.current?.expand(); else calendarPanelRef.current?.collapse();
                          }}
                          isCalendarCollapsed={calendarCollapsed}
                        />
                      ) : showCalendar ? (
                        <CurrentHabitsList
                          habits={currentHabits}
                          loading={habitsLoading || !hasLoaded}
                          onAddHabit={() => {
                            setAddToPhase('current');
                            setNewHabit({
                              title: '',
                              notes: '',
                              category: 'none',
                              target_value: 1,
                              target_unit: 'day',
                              custom_days: [],
                              leniency_threshold: 2
                            });
                            setIsAddDialogOpen(true);
                          }}
                          adoptionThreshold={adoptionThreshold}
                          onChangeAdoptionThreshold={setAdoptionThreshold}
                          onEditHabit={handleEditHabit}
                          onDeleteHabit={handleDeleteHabit}
                          onUpdateHabit={handleInlineUpdateHabit}
                          onCheckIn={handleCheckIn}
                          onUndoCheckIn={handleUndoCheckIn}
                          onMoveHabit={handleMoveHabit}
                          onRefreshHabits={refreshHabits}
                          onReorderHabits={reorderHabits}
                          onToggleCalendar={() => {
                            if (calendarCollapsed) calendarPanelRef.current?.expand(); else calendarPanelRef.current?.collapse();
                          }}
                          isCalendarCollapsed={calendarCollapsed}
                        />
                      ) : showTasks ? (
                        <TasksView 
                          onToggleCalendar={() => {
                            if (calendarCollapsed) calendarPanelRef.current?.expand(); else calendarPanelRef.current?.collapse();
                          }}
                          isCalendarCollapsed={calendarCollapsed}
                        />
                      ) : (
                        <CurrentHabitsList
                          habits={currentHabits}
                          loading={habitsLoading || !hasLoaded}
                          onAddHabit={() => {
                            setAddToPhase('current');
                            setNewHabit({
                              title: '',
                              notes: '',
                              category: 'none',
                              target_value: 1,
                              target_unit: 'day',
                              custom_days: [],
                              leniency_threshold: 2
                            });
                            setIsAddDialogOpen(true);
                          }}
                          adoptionThreshold={adoptionThreshold}
                          onChangeAdoptionThreshold={setAdoptionThreshold}
                          onEditHabit={handleEditHabit}
                          onDeleteHabit={handleDeleteHabit}
                          onUpdateHabit={handleInlineUpdateHabit}
                          onCheckIn={handleCheckIn}
                          onUndoCheckIn={handleUndoCheckIn}
                          onMoveHabit={handleMoveHabit}
                          onRefreshHabits={refreshHabits}
                          onReorderHabits={reorderHabits}
                          onToggleCalendar={() => {
                            if (calendarCollapsed) calendarPanelRef.current?.expand(); else calendarPanelRef.current?.collapse();
                          }}
                          isCalendarCollapsed={calendarCollapsed}
                        />
                      )}
                    </MainLayout>
                  </div>
                </div>
              </ResizablePanel>
              <ResizableHandle />
              <ResizablePanel
                defaultSize={60}
                minSize={40}
                collapsible
                collapsedSize={0}
                ref={calendarPanelRef}
              >
                <div className="h-full">
                  <UnifiedCalendar
                    habits={habits}
                    schedules={schedules}
                    calendarItems={calendarItems}
                    diaryEntries={diaryEntries}
                    tasks={tasks}
                    taskLists={taskLists}
                    onCheckIn={handleCheckIn}
                    onUndoCheckIn={handleUndoCheckIn}
                    onDayClick={handleDayClick}
                    onHabitDrop={handleHabitDrop}
                    onHabitUnschedule={handleHabitUnschedule}
                    onTaskToggleComplete={handleTaskToggleComplete}
                    onTaskDrop={handleTaskDrop}
                    onTaskDelete={handleTaskDelete}
                    onCalendarItemDelete={handleCalendarItemDelete}
                    onDiaryEntryClick={handleDiaryEntryClick}
                    onOpenSettings={() => setShowUserSettings(true)}
                  />
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        </div>

        {/* Removed overlay DayHabitsDialog in favor of inline popovers in calendar views */}
      </main>
    </div>
  );
};

export default Index;
