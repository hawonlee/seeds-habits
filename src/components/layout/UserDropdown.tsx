import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { User, Settings, LogOut } from "lucide-react";

interface UserDropdownProps {
  user: any | null | undefined;
  profile: any | null | undefined;
  displayName?: string;
  userInitials?: string;
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
  const safeEmail: string = (profile && profile.email) || (user && user.email) || "";
  const safeDisplayName: string = displayName || (profile && profile.name) || (user && (user.name || (user.email ? user.email.split('@')[0] : ''))) || 'User';
  const safeInitials: string = (userInitials && userInitials.trim())
    || safeDisplayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0">
          <Button 
            variant="ghost" 
            className="h-7 w-7 rounded-full p-0 focus:ring-0 focus:ring-offset-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none hover:bg-transparent"
          >
            <Avatar className="h-7 w-7">
              {/* <AvatarImage src={profile?.avatar_url || ""} alt={displayName} /> */}
              <AvatarFallback className="text-foreground font-normal bg-habitbg hover:bg-habitbghover transition-colors duration-200">
                {safeInitials || <User className="h-5 w-5" />}
              </AvatarFallback>
            </Avatar>
          </Button>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 mb-2 p-2 my-1 bg-white">
        <div className="px-2 py-1.5">
          <p className="text-xs">{safeDisplayName}</p>
          <p className="text-xs text-muted-foreground">{safeEmail}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onOpenSettings}>
          <Settings className="mr-2 h-3.5 w-3.5" />
          <p className="text-xs">Settings</p>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onSignOut}>
          <LogOut className="mr-2 h-3.5 w-3.5" />
          <p className="text-xs">Log Out</p>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
