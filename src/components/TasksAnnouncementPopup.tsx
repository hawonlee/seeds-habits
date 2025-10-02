import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Calendar, ListTodo, Plus, X } from 'lucide-react';
import { PixelSproutAnimation } from '@/components/PixelSproutAnimation';

interface TasksAnnouncementPopupProps {
  onClose: () => void;
}

export const TasksAnnouncementPopup: React.FC<TasksAnnouncementPopupProps> = ({ onClose }) => {
  const handleClose = () => {
    console.log('TasksAnnouncementPopup: onClose called');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="h-auto bg-background rounded-lg shadow-lg p-6 pt-10 flex flex-col items-center justify-center relative">
        <div className="absolute top-2 right-2">
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-col items-center space-y-4">
          <div className="flex flex-col items-center space-y-5">
            <div>🌱</div>
            <p className="w-40 text-sm text-center max-w-xs">
              tasks added
            </p>
          </div>


           <Button
             variant="outline"
             onClick={handleClose}
             className="w-full max-w-xs"
             size="sm"
           >
             got it
           </Button>
        </div>
      </div>
    </div>
  );
};
