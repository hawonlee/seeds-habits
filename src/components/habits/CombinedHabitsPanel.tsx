import React, { useState } from 'react';
import { ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Habit } from '@/hooks/useHabits';
import { FutureHabitsList } from './FutureHabitsList';
import { AdoptedHabitsList } from './AdoptedHabitsList';

interface CombinedHabitsPanelProps {
  futureHabits: Habit[];
  adoptedHabits: Habit[];
  onAddHabit: (phase: 'future' | 'adopted') => void;
  adoptionThreshold: number;
  onEditHabit: (habit: Habit) => void;
  onDeleteHabit: (id: string) => void;
  onCheckIn: (id: string, date?: Date) => void;
  onUndoCheckIn: (id: string, date?: Date) => void;
  onMoveHabit: (id: string, phase: Habit['phase']) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const CombinedHabitsPanel: React.FC<CombinedHabitsPanelProps> = ({
  futureHabits,
  adoptedHabits,
  onAddHabit,
  adoptionThreshold,
  onEditHabit,
  onDeleteHabit,
  onCheckIn,
  onUndoCheckIn,
  onMoveHabit,
  isCollapsed,
  onToggleCollapse,
}) => {
  const [activeTab, setActiveTab] = useState<'future' | 'adopted'>('future');
  const totalPoints = adoptedHabits.reduce((sum, h) => sum + h.points, 0);

  if (isCollapsed) {
    return null; // Hide entire panel when collapsed
  }

  return (
    <div className="h-full bg-white flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-end mb-3">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onAddHabit(activeTab)}
            className="h-8 px-3"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('future')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'future'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full" />
              Future
              <Badge variant="secondary" className="text-xxs">
                {futureHabits.length}
              </Badge>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('adopted')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'adopted'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-amber-500 rounded-full" />
              Adopted
              <Badge variant="secondary" className="text-xxs">
                {adoptedHabits.length}
              </Badge>
            </div>
          </button>
        </div>

        {/* Points Display for Adopted */}
        {activeTab === 'adopted' && (
          <div className="mt-3 text-center">
            <div className="text-xxs text-gray-500">Total Points</div>
            <div className="text-lg font-semibold text-amber-600">{totalPoints}</div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'future' ? (
          <FutureHabitsList
            habits={futureHabits}
            onAddHabit={() => onAddHabit('future')}
            adoptionThreshold={adoptionThreshold}
            onEditHabit={onEditHabit}
            onDeleteHabit={onDeleteHabit}
            onCheckIn={onCheckIn}
            onUndoCheckIn={onUndoCheckIn}
            onMoveHabit={onMoveHabit}
            isCollapsed={false}
            onToggleCollapse={() => {}}
            hideHeader={true}
          />
        ) : (
          <AdoptedHabitsList
            habits={adoptedHabits}
            onAddHabit={() => onAddHabit('adopted')}
            adoptionThreshold={adoptionThreshold}
            onEditHabit={onEditHabit}
            onDeleteHabit={onDeleteHabit}
            onCheckIn={onCheckIn}
            onUndoCheckIn={onUndoCheckIn}
            onMoveHabit={onMoveHabit}
            isCollapsed={false}
            onToggleCollapse={() => {}}
            hideHeader={true}
          />
        )}
      </div>
    </div>
  );
};
