import { Moon, Sun, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTheme } from "@/hooks/useTheme";

interface UserSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserSettingsModal({ open, onOpenChange }: UserSettingsModalProps) {
  const { theme, setTheme } = useTheme();

  const themeOptions = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* Theme Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Theme</h3>
            <div className="space-y-2">
              {themeOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <Button
                    key={option.value}
                    variant={theme === option.value ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setTheme(option.value as "light" | "dark" | "system")}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {option.label}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
