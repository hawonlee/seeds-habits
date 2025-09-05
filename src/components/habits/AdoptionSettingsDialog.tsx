import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface AdoptionSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  adoptionThreshold: number;
  setAdoptionThreshold: (threshold: number) => void;
}

export const AdoptionSettingsDialog = ({
  open,
  onOpenChange,
  adoptionThreshold,
  setAdoptionThreshold
}: AdoptionSettingsDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adoption Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Adoption Threshold (days)</label>
            <p className="text-sm text-muted-foreground mb-2">
              How many consecutive days should a habit be maintained before it can be adopted?
            </p>
            <Select value={adoptionThreshold.toString()} onValueChange={(value) => setAdoptionThreshold(parseInt(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 days (1 week)</SelectItem>
                <SelectItem value="14">14 days (2 weeks)</SelectItem>
                <SelectItem value="21">21 days (3 weeks)</SelectItem>
                <SelectItem value="30">30 days (1 month)</SelectItem>
                <SelectItem value="60">60 days (2 months)</SelectItem>
                <SelectItem value="90">90 days (3 months)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="pt-4">
            <Button onClick={() => onOpenChange(false)} className="w-full">
              Save Settings
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
