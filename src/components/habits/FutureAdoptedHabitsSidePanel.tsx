import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Habit } from '@/hooks/useHabits';
import { FutureHabitsList } from './FutureHabitsList';
import { AdoptedHabitsList } from './AdoptedHabitsList';

interface FutureAdoptedHabitsSidePanelProps {
  futureHabits: Habit[];
  adoptedHabits: Habit[];
  onAddHabit: (phase: 'future' | 'adopted') => void;
  adoptionThreshold: number;
  onEditHabit: (habit: Habit) => void;
  onDeleteHabit: (id: string) => void;
  onUpdateHabit?: (updatedHabit: Partial<Habit>) => void;
  onCheckIn: (id: string, date?: Date) => void;
  onUndoCheckIn: (id: string, date?: Date) => void;
  onMoveHabit: (id: string, phase: Habit['phase']) => void;
}

export const FutureAdoptedHabitsSidePanel: React.FC<FutureAdoptedHabitsSidePanelProps> = ({
  futureHabits,
  adoptedHabits,
  onAddHabit,
  adoptionThreshold,
  onEditHabit,
  onDeleteHabit,
  onUpdateHabit,
  onCheckIn,
  onUndoCheckIn,
  onMoveHabit,
}) => {
  const [activeTab, setActiveTab] = useState<'future' | 'adopted'>('future');
  const totalPoints = adoptedHabits.reduce((sum, h) => sum + h.points, 0);

  return (
    <div className="">
      {/* Tab Toggle */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex bg-neutral-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('future')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'future'
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <div className="flex text-xs items-center justify-center gap-2">
              Future
              {/* <Badge variant="secondary" className="text-xxs">
                {futureHabits.length}
              </Badge> */}
            </div>
          </button>
          <button
            onClick={() => setActiveTab('adopted')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'adopted'
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <div className="flex text-xs items-center justify-center gap-2">
              Adopted
              {/* <Badge variant="secondary" className="text-xxs">
                {adoptedHabits.length}
              </Badge> */}
            </div>
          </button>
        </div>
  
        <Button
            size="sm"
            variant="ghost"
            onClick={() => onAddHabit(activeTab)}
            className="h-8 w-8"
          >
            <Plus className="h-4 w-4" />
          </Button>
      </div>

      {/* Points Display for Adopted */}
      {activeTab === 'adopted' && (
        <div className="flex items-center justify-start mb-4 text-center gap-2">
          <div className="text-xxs text-neutral-500">Total Points</div>
          <div className="text-xs font-semibold text-amber-600">{totalPoints}</div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'future' ? (
          <FutureHabitsList
            habits={futureHabits}
            hideHeader={true}
            onAddHabit={() => onAddHabit('future')}
            adoptionThreshold={adoptionThreshold}
            onEditHabit={onEditHabit}
            onDeleteHabit={onDeleteHabit}
            onUpdateHabit={onUpdateHabit}
            onCheckIn={onCheckIn}
            onUndoCheckIn={onUndoCheckIn}
            onMoveHabit={onMoveHabit}
          />
        ) : (
          <AdoptedHabitsList
            habits={adoptedHabits}
            hideHeader={true}
            onAddHabit={() => onAddHabit('adopted')}
            adoptionThreshold={adoptionThreshold}
            onEditHabit={onEditHabit}
            onDeleteHabit={onDeleteHabit}
            onUpdateHabit={onUpdateHabit}
            onCheckIn={onCheckIn}
            onUndoCheckIn={onUndoCheckIn}
            onMoveHabit={onMoveHabit}
          />
        )}
      </div>
    </div>
  );
};
