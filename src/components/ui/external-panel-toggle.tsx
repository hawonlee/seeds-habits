import React from 'react';
import { ChevronRight, PanelLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";


interface ExternalPanelToggleProps {
  onToggle: () => void;
}

export const ExternalPanelToggle: React.FC<ExternalPanelToggleProps> = ({
  onToggle,
}) => {
  return (
    <Button
      onClick={onToggle}
      variant="ghost"
      className="h-8 w-8 p-0"
    >
      <PanelLeft className="h-4 w-4" />
    </Button>
  );
};
