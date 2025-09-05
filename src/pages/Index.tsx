import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useHabits, type Habit } from "@/hooks/useHabits";
import { DatabaseTest } from "@/components/habits/DatabaseTest";
import { FutureHabitsList } from "@/components/habits/FutureHabitsList";
import { CurrentHabitsList } from "@/components/habits/CurrentHabitsList";
import { AdoptedHabitsList } from "@/components/habits/AdoptedHabitsList";
import { AddHabitDialog } from "@/components/habits/AddHabitDialog";
import { AdoptionSettingsDialog } from "@/components/habits/AdoptionSettingsDialog";
import { EditHabitDialog } from "@/components/habits/EditHabitDialog";
import { HabitCard } from "@/components/habits/HabitCard";
import { UserDropdown } from "@/components/habits/UserDropdown";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  Loader2
} from "lucide-react";



const Index = () => {
  const { user, loading, signOut } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { habits, loading: habitsLoading, addHabit, updateHabit, deleteHabit, checkInHabit, undoCheckIn, moveHabitPhase } = useHabits();
  const navigate = useNavigate();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [addToPhase, setAddToPhase] = useState<'future' | 'current' | 'adopted'>('future');
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [showAdoptionSettings, setShowAdoptionSettings] = useState(false);
  const [adoptionThreshold, setAdoptionThreshold] = useState(21);
  const [newHabit, setNewHabit] = useState({
    title: '',
    notes: '',
    category: 'personal',
    target_frequency: 1,
    leniency_threshold: 2
  });

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
      category: 'personal',
      target_frequency: 1,
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
      category: 'personal',
      target_frequency: 1,
      leniency_threshold: 2
    });
  };

  const handleDeleteHabit = async (id: string) => {
    await deleteHabit(id);
  };

  const handleMoveHabit = async (id: string, newPhase: Habit['phase']) => {
    await moveHabitPhase(id, newPhase);
  };

  const handleCheckIn = async (id: string) => {
    await checkInHabit(id);
  };

  const handleUndoCheckIn = async (id: string) => {
    await undoCheckIn(id);
  };

  const displayName = profile?.name || user?.email?.split('@')[0] || 'Guest';
  const userInitials = displayName.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                      <div className="flex items-center gap-3">
              <h1 className="text-sm font-bold text-green-700">Seeds</h1>
            </div>
          
          <div className="flex items-center gap-4">
            {/* <div className="flex items-center gap-3 bg-green-50 px-4 py-2 rounded-lg">
              <Trophy className="h-5 w-5 text-green-600" />
              <span className="font-semibold text-green-700">{totalPoints} Points</span>
            </div> */}
            
            {user ? (
              <UserDropdown
                user={user}
                profile={profile}
                displayName={displayName}
                userInitials={userInitials}
                onOpenSettings={() => setShowAdoptionSettings(true)}
                onSignOut={signOut}
              />
            ) : (
              <Button variant="outline" onClick={() => navigate("/auth")}>
                Sign In
              </Button>
            )}
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">

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
          <div className="flex justify-center items-center py-12">
            <div className="flex items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading habits...</span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <FutureHabitsList 
              habits={futureHabits}
              onAddHabit={() => {
                setAddToPhase('future');
                setIsAddDialogOpen(true);
              }}
              adoptionThreshold={adoptionThreshold}
              onEditHabit={handleEditHabit}
              onDeleteHabit={handleDeleteHabit}
              onCheckIn={handleCheckIn}
              onUndoCheckIn={handleUndoCheckIn}
              onMoveHabit={handleMoveHabit}
            />

            <CurrentHabitsList 
              habits={currentHabits}
              onAddHabit={() => {
                setAddToPhase('current');
                setIsAddDialogOpen(true);
              }}
              adoptionThreshold={adoptionThreshold}
              onEditHabit={handleEditHabit}
              onDeleteHabit={handleDeleteHabit}
              onCheckIn={handleCheckIn}
              onUndoCheckIn={handleUndoCheckIn}
              onMoveHabit={handleMoveHabit}
            />

            <AdoptedHabitsList 
              habits={adoptedHabits}
              onAddHabit={() => {
                setAddToPhase('adopted');
                setIsAddDialogOpen(true);
              }}
              adoptionThreshold={adoptionThreshold}
              onEditHabit={handleEditHabit}
              onDeleteHabit={handleDeleteHabit}
              onCheckIn={handleCheckIn}
              onUndoCheckIn={handleUndoCheckIn}
              onMoveHabit={handleMoveHabit}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
