import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SegmentedToggle } from '@/components/ui/segmented-toggle';
import { ExternalPanelToggle } from '@/components/ui/external-panel-toggle';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { Button } from '@/components/ui/button';
import { Brain, Calendar as CalendarIcon } from 'lucide-react';
import { UserDropdown } from '@/components/layout/UserDropdown';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';

interface MainLayoutProps {
  children: React.ReactNode;
  showCalendar: boolean;
  showDiary: boolean;
  showTasks: boolean;
  onViewChange: (view: 'list' | 'calendar' | 'diary' | 'tasks') => void;
  isCombinedPanelCollapsed: boolean;
  onTogglePanel: () => void;
  isCalendarPanelCollapsed: boolean;
  onToggleCalendarPanel: () => void;
  isMainCollapsed: boolean;
  onToggleMainCollapsed: () => void;
  onOpenSettings?: () => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  showCalendar,
  showDiary,
  showTasks,
  onViewChange,
  isCombinedPanelCollapsed,
  onTogglePanel,
  isCalendarPanelCollapsed,
  onToggleCalendarPanel,
  isMainCollapsed,
  onToggleMainCollapsed,
  onOpenSettings,
}: MainLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { profile } = useProfile();

  const handleViewChange = (view: 'list' | 'calendar' | 'diary' | 'tasks') => {
    const routeMap = {
      list: '/list',
      diary: '/diary',
      tasks: '/tasks',
    };
    
    if (view in routeMap) {
      navigate(routeMap[view as 'list' | 'diary' | 'tasks']);
    }
    onViewChange(view);
  };

  // Determine current view from URL
  const getCurrentView = () => {
    if (location.pathname === '/diary') return 'diary';
    if (location.pathname === '/tasks') return 'tasks';
    return 'list';
  };
  return (
    <div className="h-full flex bg-background flex-col">
      {/* Header */}
      <div className="pt-6 px-8 w-full flex-shrink-0 flex items-center">
        <div className="flex w-full items-center justify-between gap-2">

          <div className="flex items-center gap-2">
            {/* User dropdown anchored bottom-left of the main panel when expanded */}
            {!isMainCollapsed && (
              <div className="">
                <UserDropdown
                  user={user}
                  profile={profile}
                  displayName={profile?.name || user?.email || 'User'}
                  userInitials={(profile?.name || user?.email || 'User').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  onOpenSettings={onOpenSettings || onTogglePanel}
                  onSignOut={signOut}
                />
              </div>
            )}
            {/* <ThemeToggle /> */}
            {/* <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/knowledge')}
              className="gap-2"
            >
              <Brain className="h-4 w-4" />
              <span className="hidden sm:inline">Knowledge</span>
            </Button> */}
          </div>

          <div className="flex items-center gap-2">
            <SegmentedToggle
              options={[
                { value: 'list', label: 'Habits' },
                { value: 'tasks', label: 'Tasks' },
                { value: 'diary', label: 'Diary' },
              ]}
              value={getCurrentView()}
              onValueChange={handleViewChange}
            />

            <Button
              variant="text"
              size="text"
              onClick={onToggleCalendarPanel}
              className="h-8 px-2 text-xs gap-1"
              title={isCalendarPanelCollapsed ? 'Show calendar' : 'Hide calendar'}
            >
              <CalendarIcon className="h-4 w-4" />
            </Button>
  
            {/* <div className={`transition-opacity duration-300 ${isCombinedPanelCollapsed ? 'opacity-100' : 'hidden pointer-events-none'}`}>
              <ExternalPanelToggle onToggle={onTogglePanel} />
            </div> */}
          </div>


        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 px-8 pt-2 overflow-hidden min-h-0 relative">
        {children}
        
      </div>
    </div>
  );
};
