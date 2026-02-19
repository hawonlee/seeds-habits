import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { TaskList } from '@/hooks/useTasks';
import { COLOR_OPTIONS } from '@/lib/colorOptions';

interface TaskListDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (list: Omit<TaskList, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => void;
  list?: TaskList;
}

const colorOptions = COLOR_OPTIONS.map((color) => ({
  value: color.value,
  label: color.name,
  swatch: color.midHex,
}));

export const TaskListDialog: React.FC<TaskListDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  list
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(COLOR_OPTIONS[3].value); // Blue
  const selectedColorOption = colorOptions.find((opt) => opt.value === color);

  useEffect(() => {
    if (list) {
      setName(list.name);
      setDescription(list.description || '');
      setColor(list.color);
    } else {
      setName('');
      setDescription('');
      setColor(COLOR_OPTIONS[3].value); // Blue
    }
  }, [list, isOpen]);

  const handleSave = () => {
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      description: description.trim(),
      color
    });

    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{list ? 'Edit Task List' : 'Create New Task List'}</DialogTitle>
          <DialogDescription>
            {list ? 'Update your task list details' : 'Create a new task list to organize your tasks'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter list name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter list description (optional)"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <Select value={color} onValueChange={setColor}>
              <SelectTrigger>
                <SelectValue>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded-full border"
                        style={{ backgroundColor: selectedColorOption?.swatch || color }}
                    />
                    {selectedColorOption?.label}
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {colorOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full border"
                        style={{ backgroundColor: option.swatch }}
                      />
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim()}>
            {list ? 'Update List' : 'Create List'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
