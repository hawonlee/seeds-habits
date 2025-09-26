import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { User, Settings, LogOut } from "lucide-react";

interface UserDropdownProps {
  user: any;
  profile: any;
  displayName: string;
  userInitials: string;
  onOpenSettings: () => void;
  onSignOut: () => void;
}

export const UserDropdown = ({
  user,
  profile,
  displayName,
  userInitials,
  onOpenSettings,
  onSignOut
}: UserDropdownProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0">
          <Button 
            variant="ghost" 
            className="h-8 w-8 rounded-full p-0 focus:ring-0 focus:ring-offset-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none hover:bg-transparent"
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={profile?.avatar_url || ""} alt={displayName} />
              <AvatarFallback>
                {userInitials || <User className="h-5 w-5" />}
              </AvatarFallback>
            </Avatar>
          </Button>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56 mb-2">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium">{displayName}</p>
          <p className="text-xs text-muted-foreground">{profile?.email || user.email}</p>
        </div>
        <DropdownMenuSeparator />
        {/* <DropdownMenuItem onClick={onOpenSettings}>
          <Settings className="mr-2 h-4 w-4" />
          <p className="text-xs">Settings</p>
        </DropdownMenuItem> */}
        {/* <DropdownMenuSeparator /> */}
        <DropdownMenuItem onClick={onSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <p className="text-xs">Log Out</p>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
