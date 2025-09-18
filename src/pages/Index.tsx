import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useHabits, type Habit } from "@/hooks/useHabits";
import { useHabitSchedules } from "@/hooks/useHabitSchedules";
import { DatabaseTest } from "@/components/habits/DatabaseTest";
import { CurrentHabitsList } from "@/components/habits/CurrentHabitsList";
import { SidePanel } from "@/components/ui/side-panel";
import { ExternalPanelToggle } from "@/components/ui/external-panel-toggle";
import { CurrentHabitsSidePanel } from "@/components/habits/CurrentHabitsSidePanel";
import { FutureAdoptedHabitsSidePanel } from "@/components/habits/FutureAdoptedHabitsSidePanel";
import { MainLayout } from "@/components/layout/MainLayout";
import { AddHabitDialog } from "@/components/habits/AddHabitDialog";
import { AdoptionSettingsDialog } from "@/components/habits/AdoptionSettingsDialog";
import { EditHabitDialog } from "@/components/habits/EditHabitDialog";
import { HabitCard } from "@/components/habits/HabitCard";
import { UserDropdown } from "@/components/habits/UserDropdown";
import { UnifiedCalendar } from "@/components/calendar/UnifiedCalendar";
import { DayHabitsDialog } from "@/components/habits/DayHabitsDialog";
import { Button } from "@/components/ui/button";
import { SegmentedToggle } from "@/components/ui/segmented-toggle";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  Loader2,
  Calendar,
  ChevronRight,
  ChevronDown
} from "lucide-react";



const Index = () => {
  const { user, loading, signOut } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { habits, loading: habitsLoading, addHabit, updateHabit, deleteHabit, checkInHabit, undoCheckIn, moveHabitPhase } = useHabits();
  const { scheduleHabit, unscheduleHabit, schedules, isHabitScheduledOnDate, getScheduledHabitsForDate } = useHabitSchedules();
  const navigate = useNavigate();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [addToPhase, setAddToPhase] = useState<'future' | 'current' | 'adopted'>('future');
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [showAdoptionSettings, setShowAdoptionSettings] = useState(false);
  const [adoptionThreshold, setAdoptionThreshold] = useState(21);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [draggedHabit, setDraggedHabit] = useState<Habit | null>(null);
  const [newHabit, setNewHabit] = useState({
    title: '',
    notes: '',
    category: 'none',
    target_frequency: 7, // Default to daily (7 times per week)
    leniency_threshold: 2
  });

  // Panel collapse states
  const [isCombinedPanelCollapsed, setIsCombinedPanelCollapsed] = useState(true);

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
      target_frequency: newHabit.target_frequency,
      leniency_threshold: newHabit.leniency_threshold,
      phase: addToPhase,
      streak: 0,
      total_completions: 0,
      points: 0,
    };

    await addHabit(habitData);
    setNewHabit({
      title: '',
      notes: '',
      category: 'none',
      target_frequency: 7, // Default to daily (7 times per week)
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
      target_frequency: habit.target_frequency,
      leniency_threshold: habit.leniency_threshold
    });
  };

  const handleUpdateHabit = async () => {
    if (!editingHabit || !newHabit.title.trim()) return;

    await updateHabit(editingHabit.id, {
      title: newHabit.title,
      notes: newHabit.notes,
      category: newHabit.category,
      target_frequency: newHabit.target_frequency,
      leniency_threshold: newHabit.leniency_threshold,
    });

    setEditingHabit(null);
    setNewHabit({
      title: '',
      notes: '',
      category: 'none',
      target_frequency: 7, // Default to daily (7 times per week)
      leniency_threshold: 2
    });
  };

  const handleInlineUpdateHabit = async (updatedHabit: Partial<Habit>) => {
    if (!updatedHabit.title?.trim()) return;

    await updateHabit(updatedHabit.id!, {
      title: updatedHabit.title,
      notes: updatedHabit.notes,
      category: updatedHabit.category,
      target_frequency: updatedHabit.target_frequency,
      leniency_threshold: updatedHabit.leniency_threshold,
    });
  };

  const handleDeleteHabit = async (id: string) => {
    await deleteHabit(id);
  };

  const handleMoveHabit = async (id: string, newPhase: Habit['phase']) => {
    await moveHabitPhase(id, newPhase);
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

  const handleHabitDrop = async (habitId: string, date: Date) => {
    // When a habit is dropped on a calendar day, schedule it for that specific date
    const success = await scheduleHabit(habitId, date);
    if (success) {
      console.log(`Habit ${habitId} scheduled for ${date.toDateString()}`);
    } else {
      console.log(`Habit ${habitId} was already scheduled for ${date.toDateString()}`);
    }
    setDraggedHabit(null);
  };

  const handleHabitUnschedule = async (habitId: string, date: Date) => {
    // When a scheduled habit is right-clicked, unschedule it from that date
    const success = await unscheduleHabit(habitId, date);
    if (success) {
      console.log(`Habit ${habitId} unscheduled from ${date.toDateString()}`);
    } else {
      console.log(`Failed to unschedule habit ${habitId} from ${date.toDateString()}`);
    }
  };

  const displayName = profile?.name || user?.email?.split('@')[0] || 'Guest';
  const userInitials = displayName.split(' ').map(n => n[0]).join('').toUpperCase();

  if (!loading && !user) {
    // Not logged in -> show landing/auth page
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          <h1 className="text-2xl font-bold mb-2">Seeds</h1>
          <p className="text-sm text-muted-foreground mb-6">Build habits</p>
          <div className="grid grid-cols-2 gap-3">
            <Button onClick={() => navigate('/auth')}>Sign In</Button>
            <Button variant="outline" onClick={() => navigate('/auth')}>Create Account</Button>
          </div>
        </div>
      </div>
    );
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

        <EditHabitDialog
          open={!!editingHabit}
          onOpenChange={() => setEditingHabit(null)}
          editingHabit={editingHabit}
          newHabit={newHabit}
          setNewHabit={setNewHabit}
          onUpdateHabit={handleUpdateHabit}
        />
        

        {/* Habit Dashboard */}
        {habitsLoading ? (
          <div className="flex gap-4 h-[calc(100vh-200px)]">
            <div className="flex-1 h-full bg-white rounded-lg border p-4 overflow-y-auto flex items-center justify-center">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="h-5 w-5 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
                Loading current habits...
              </div>
            </div>
            <div className="w-80 h-full bg-white rounded-lg border p-4 overflow-y-auto flex items-center justify-center">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="h-5 w-5 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
                Loading panel...
              </div>
            </div>
          </div>
        ) : showCalendar ? (
          <div className="h-full flex">
            {/* Main Content Area - Calendar */}
            <div className="flex-1 h-full">
              <MainLayout
                showCalendar={showCalendar}
                onViewChange={(isCalendar) => setShowCalendar(isCalendar)}
                isCombinedPanelCollapsed={isCombinedPanelCollapsed}
                onTogglePanel={() => setIsCombinedPanelCollapsed(!isCombinedPanelCollapsed)}
              >
                <UnifiedCalendar
                  habits={habits}
                  schedules={schedules}
                  onCheckIn={handleCheckIn}
                  onUndoCheckIn={handleUndoCheckIn}
                  onDayClick={handleDayClick}
                  onHabitDrop={handleHabitDrop}
                  onHabitUnschedule={handleHabitUnschedule}
                />
              </MainLayout>
            </div>

            {/* Side Panel - Current Habits for Calendar View */}
            <SidePanel
              isCollapsed={isCombinedPanelCollapsed}
              onToggleCollapse={() => setIsCombinedPanelCollapsed(!isCombinedPanelCollapsed)}
              title="Current Habits"
              onOpenSettings={() => setShowAdoptionSettings(true)}
              onSignOut={signOut}
              position="right"
            >
              <CurrentHabitsSidePanel
                habits={currentHabits}
                onAddHabit={() => {
                  setAddToPhase('current');
                  setIsAddDialogOpen(true);
                }}
                onEditHabit={handleEditHabit}
                onDeleteHabit={handleDeleteHabit}
                onCheckIn={handleCheckIn}
                onUndoCheckIn={handleUndoCheckIn}
                onMoveHabit={handleMoveHabit}
                adoptionThreshold={adoptionThreshold}
                onDragStart={handleDragStart}
              />
            </SidePanel>
          </div>
        ) : (
          <div className="h-full flex">
            {/* Main Content Area */}
            <div className="flex-1 h-full">
              <MainLayout
                showCalendar={showCalendar}
                onViewChange={(isCalendar) => setShowCalendar(isCalendar)}
                isCombinedPanelCollapsed={isCombinedPanelCollapsed}
                onTogglePanel={() => setIsCombinedPanelCollapsed(!isCombinedPanelCollapsed)}
              >
                <CurrentHabitsList
                  habits={currentHabits}
                  onAddHabit={() => {
                    setAddToPhase('current');
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
                />
              </MainLayout>
            </div>

            {/* Side Panel - Future & Adopted Habits for List View */}
            <SidePanel
              isCollapsed={isCombinedPanelCollapsed}
              onToggleCollapse={() => setIsCombinedPanelCollapsed(!isCombinedPanelCollapsed)}
              title="Future & Adopted"
              onOpenSettings={() => setShowAdoptionSettings(true)}
              onSignOut={signOut}
              position="right"
            >
              <FutureAdoptedHabitsSidePanel
                futureHabits={futureHabits}
                adoptedHabits={adoptedHabits}
                onAddHabit={(phase) => {
                  setAddToPhase(phase);
                  setIsAddDialogOpen(true);
                }}
                adoptionThreshold={adoptionThreshold}
                onEditHabit={handleEditHabit}
                onDeleteHabit={handleDeleteHabit}
                onUpdateHabit={handleInlineUpdateHabit}
                onCheckIn={handleCheckIn}
                onUndoCheckIn={handleUndoCheckIn}
                onMoveHabit={handleMoveHabit}
              />
            </SidePanel>
          </div>
        )}

        {/* Removed overlay DayHabitsDialog in favor of inline popovers in calendar views */}
      </main>
    </div>
  );
};

export default Index;
