import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SegmentedToggle } from '@/components/ui/segmented-toggle';
import { Habit } from '@/hooks/useHabits';
import { FutureHabitsList } from '../habits/FutureHabitsList';
import { AdoptedHabitsList } from '../habits/AdoptedHabitsList';

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
        <SegmentedToggle
          options={[
            { value: 'future', label: 'Future' },
            { value: 'adopted', label: 'Adopted' },
          ]}
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as 'future' | 'adopted')}
        />

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
      {/* {activeTab === 'adopted' && (
        <div className="flex items-center justify-start mb-4 text-center gap-2">
          <div className="text-xxs text-muted-foreground">Total Points</div>
          <div className="text-xs font-semibold text-amber-600">{totalPoints}</div>
        </div>
      )} */}

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
