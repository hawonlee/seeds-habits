import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DEFAULT_CATEGORIES, getCategoryClasses } from "@/lib/categories";
import { Habit } from "@/hooks/useHabits";
import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { Trash } from "lucide-react";

interface InlineEditDropdownProps {
  habit: Habit;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedHabit: Partial<Habit>) => void;
  onDelete: (id: string) => void;
  position?: { top: number; left: number };
  anchorRect?: DOMRect | null;
}

export const InlineEditDropdown = ({
  habit,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  position,
  anchorRect
}: InlineEditDropdownProps) => {
  const [editedHabit, setEditedHabit] = useState({
    title: habit.title,
    notes: habit.notes || '',
    category: habit.category,
    target_frequency: habit.target_frequency,
    leniency_threshold: habit.leniency_threshold
  });

  const dropdownRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);

  // Compute optimal placement relative to the anchor
  useLayoutEffect(() => {
    if (!isOpen) {
      setCoords(null);
      return;
    }

    // Defer calculation to next frame to ensure dimensions are available
    const rAF = requestAnimationFrame(() => {
      const dropdownEl = dropdownRef.current;
      if (!dropdownEl) return;

      const dropdownBox = dropdownEl.getBoundingClientRect();
      const anchor = anchorRect || (position
        ? ({
            top: position.top,
            bottom: position.top,
            left: position.left,
            right: position.left,
            width: 0,
            height: 0,
          } as unknown as DOMRect)
        : null);

      if (!anchor) return;

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      const spaceBelow = viewportHeight - anchor.bottom;
      const spaceAbove = anchor.top;
      const verticalGap = 4;
      const horizontalPadding = 8;

      const placeBelow = spaceBelow >= dropdownBox.height + verticalGap || spaceBelow >= spaceAbove;
      const top = placeBelow
        ? Math.min(anchor.bottom + verticalGap, viewportHeight - dropdownBox.height - horizontalPadding)
        : Math.max(horizontalPadding, anchor.top - dropdownBox.height - verticalGap);

      let left = anchor.left;
      if (left + dropdownBox.width > viewportWidth - horizontalPadding) {
        left = Math.max(horizontalPadding, viewportWidth - dropdownBox.width - horizontalPadding);
      }

      setCoords({ top, left });
    });

    return () => cancelAnimationFrame(rAF);
  }, [isOpen, anchorRect, position]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  const handleSave = () => {
    onUpdate(editedHabit);
    onClose();
  };

  const handleDelete = () => {
    onDelete(habit.id);
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <>
      {/* Backdrop to capture outside clicks */}
      <div className="fixed inset-0 z-40 bg-transparent" onMouseDown={onClose} />

      <div
        ref={dropdownRef}
        className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-xl p-4 min-w-80 max-w-md"
        style={{
          top: `${(coords?.top ?? -9999) as number}px`,
          left: `${(coords?.left ?? -9999) as number}px`,
          visibility: coords ? 'visible' : 'hidden',
        }}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">{editedHabit.title}</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="w-8 h-8"
            >
              <Trash className="h-3 w-3" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label className="text-xs font-medium">Habit Title</label>
              <Input
                placeholder="Morning Exercise..."
                value={editedHabit.title}
                onChange={(e) => setEditedHabit({ ...editedHabit, title: e.target.value })}
              />
            </div>

          </div>

        <div>
          <label className="text-xs font-medium">Notes</label>
          <Textarea
            placeholder="Add details about your habit..."
            value={editedHabit.notes}
            onChange={(e) => setEditedHabit({...editedHabit, notes: e.target.value})}
          />
        </div>

        <div>
          <label className="text-xs font-medium">Category</label>
          <Select value={editedHabit.category} onValueChange={(value) => setEditedHabit({...editedHabit, category: value})}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DEFAULT_CATEGORIES.map(category => (
                <SelectItem key={category.id} value={category.id}>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <span>{category.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium">Target Frequency (per week)</label>
            <Input
              type="number"
              min="1"
              max="7"
              value={editedHabit.target_frequency}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 1;
                setEditedHabit({...editedHabit, target_frequency: val});
              }}
              className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium">Leniency Threshold (days)</label>
            <Input
              type="number"
              min="1"
              max="5"
              value={editedHabit.leniency_threshold}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 1;
                setEditedHabit({...editedHabit, leniency_threshold: val});
              }}
              className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
        </div>

          <div className="flex w-full justify-end gap-2">
            {/* <Button 
              variant="destructive" 
              size="sm"
              onClick={handleDelete}
              className="flex-1"
            >
              Delete
            </Button> */}
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave}>
                Save
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};
