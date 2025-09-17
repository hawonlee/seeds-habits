import React from 'react';
import { SegmentedToggle } from '@/components/ui/segmented-toggle';
import { ExternalPanelToggle } from '@/components/ui/external-panel-toggle';

interface MainLayoutProps {
  children: React.ReactNode;
  showCalendar: boolean;
  onViewChange: (isCalendar: boolean) => void;
  isCombinedPanelCollapsed: boolean;
  onTogglePanel: () => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  showCalendar,
  onViewChange,
  isCombinedPanelCollapsed,
  onTogglePanel,
}) => {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="h-14 px-4 w-full bg-white flex-shrink-0 flex items-center">
        <div className="flex w-full items-center justify-end gap-2">
          <div className="flex items-center gap-4">
            {/* Segmented Toggle */}
            <SegmentedToggle
              options={[
                { value: 'list', label: 'List' },
                { value: 'calendar', label: 'Cal' }
              ]}
              value={showCalendar ? 'calendar' : 'list'}
              onValueChange={(value) => {
                const isCalendar = value === 'calendar';
                onViewChange(isCalendar);
              }}
            />
          </div>
          
          <div className="flex items-center gap-4">
            <div className={`transition-opacity duration-300 ${isCombinedPanelCollapsed ? 'opacity-100' : 'hidden pointer-events-none'}`}>
              <ExternalPanelToggle onToggle={onTogglePanel} />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-12 overflow-hidden min-h-0">
        {children}
      </div>
    </div>
  );
};
