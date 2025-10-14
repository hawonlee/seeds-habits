import React, { useEffect, useRef, useState } from 'react';
import { PanelLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { UserDropdown } from "@/components/layout/UserDropdown";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import logo from "/logo.png";

interface SidePanelProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  title: string;
  children: React.ReactNode;
  width?: string;
  className?: string;
  showExternalToggle?: boolean;
  onOpenSettings?: () => void;
  onSignOut?: () => void;
  initialWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  position?: 'left' | 'right';
}

export const SidePanel: React.FC<SidePanelProps> = ({
  isCollapsed,
  onToggleCollapse,
  title,
  children,
  width = "w-80",
  className = "",
  showExternalToggle = false,
  onOpenSettings,
  onSignOut,
  initialWidth = 320,
  minWidth = 240,
  maxWidth = 520,
  position = 'left'
}) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  
  const displayName = profile?.name || user?.email || 'User';
  const userInitials = displayName
    .split(' ')
    .map(name => name[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  const pointerClass = isCollapsed ? 'pointer-events-none' : 'pointer-events-auto';

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [panelWidth, setPanelWidth] = useState<number>(initialWidth);
  const [isResizing, setIsResizing] = useState<boolean>(false);

  useEffect(() => {
    if (!isResizing) return;
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const proposed = position === 'right' 
        ? rect.right - e.clientX 
        : e.clientX - rect.left;
      const clamped = Math.max(minWidth, Math.min(maxWidth, proposed));
      setPanelWidth(clamped);
      e.preventDefault();
    };
    const handleMouseUp = () => setIsResizing(false);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, minWidth, maxWidth, position]);

  return (
    <div
      ref={containerRef}
      className={`${isCollapsed ? 'w-0' : ''} fixed bg-side-panel-bg md:relative ${position === 'right' ? 'right-0' : 'left-0'} top-0 bottom-0 z-40 md:z-auto h-full bg-background overflow-hidden ${pointerClass} ${className} ${isResizing ? 'transition-none' : 'transition-all duration-300 ease-in-out'} ${position === 'right' ? 'border-l border-border' : 'border-r border-border'} shadow-lg md:shadow-none`}
      style={{ width: isCollapsed ? 0 : panelWidth }}
      aria-hidden={isCollapsed}
    >
      <div
        className={`shrink-0 h-full flex flex-col transform ${isResizing ? 'transition-none' : 'transition-transform duration-300 ease-in-out'} will-change-transform ${isCollapsed ? (position === 'right' ? 'translate-x-full' : '-translate-x-full') : 'translate-x-0'}`}
        style={{ width: panelWidth }}
      >
        {/* Header */}
        <div className="p-5 flex-shrink-0">
          <div className="flex items-center justify-end">
          {/* <h2 className="text-xs font-medium text-foreground">Habits</h2> */}
            <Button
              onClick={onToggleCollapse}
              variant="text"
              size="text"
              title="Hide panel"
            >
              <PanelLeft className="h-4 w-4" />
            </Button>

            {/* <img src={logo} alt="logo" className="h-5 w-5" /> */}

          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-0 px-5">
          {children}
        </div>

        {/* Footer */}
        <div className="w-full justify-end p-4 flex-shrink-0">
          {user ? (
            <UserDropdown
              user={user}
              profile={profile}
              displayName={displayName}
              userInitials={userInitials}
              onOpenSettings={onOpenSettings}
              onSignOut={onSignOut || signOut}
            />
          ) : (
            <Button variant="outline" onClick={() => navigate("/auth")} className="w-full">
              Sign In
            </Button>
          )}
        </div>
      </div>

      {/* Resize handle */}
      {!isCollapsed && (
        <div
          role="separator"
          aria-orientation="vertical"
          className={`absolute top-0 h-full w-1 cursor-col-resize select-none transition-colors duration-200 hover:bg-muted ${position === 'right' ? 'left-0' : 'right-0'} ${isResizing ? 'bg-muted' : 'hover:bg-muted'}`}
          onMouseDown={(e) => {
            e.preventDefault();
            setIsResizing(true);
          }}
        />
      )}
    </div>
  );
};
