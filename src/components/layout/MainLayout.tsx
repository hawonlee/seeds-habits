import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SegmentedToggle } from '@/components/ui/segmented-toggle';
import { ExternalPanelToggle } from '@/components/ui/external-panel-toggle';
import { ThemeToggle } from '@/components/layout/theme-toggle';

interface MainLayoutProps {
  children: React.ReactNode;
  showCalendar: boolean;
  showDiary: boolean;
  onViewChange: (view: 'list' | 'calendar' | 'diary') => void;
  isCombinedPanelCollapsed: boolean;
  onTogglePanel: () => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  showCalendar,
  showDiary,
  onViewChange,
  isCombinedPanelCollapsed,
  onTogglePanel,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleViewChange = (view: 'list' | 'calendar' | 'diary') => {
    const routeMap = {
      list: '/list',
      calendar: '/calendar',
      diary: '/diary'
    };
    
    navigate(routeMap[view]);
    onViewChange(view);
  };

  // Determine current view from URL
  const getCurrentView = () => {
    if (location.pathname === '/calendar') return 'calendar';
    if (location.pathname === '/diary') return 'diary';
    return 'list';
  };
  return (
    <div className="h-full flex bg-background flex-col">
      {/* Header */}
      <div className="h-14 px-4 w-full flex-shrink-0 flex items-center">
        <div className="flex w-full items-center justify-between gap-2">

          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>

          <div className="flex items-center gap-2">
            <SegmentedToggle
              options={[
                { value: 'list', label: 'List' },
                { value: 'calendar', label: 'Cal' },
                { value: 'diary', label: 'Diary' }
              ]}
              value={getCurrentView()}
              onValueChange={handleViewChange}
            />
  
            <div className={`transition-opacity duration-300 ${isCombinedPanelCollapsed ? 'opacity-100' : 'hidden pointer-events-none'}`}>
              <ExternalPanelToggle onToggle={onTogglePanel} />
            </div>
          </div>


        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 sm:px-8 md:px-40 pt-6 pb-2 overflow-hidden min-h-0">
        {children}
      </div>
    </div>
  );
};
