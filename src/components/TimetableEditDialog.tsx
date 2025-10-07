import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TimetableEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editData?: {
    id: string;
    day: string;
    timeSlot: string;
    focusArea: string;
  };
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export const TimetableEditDialog = ({
  open,
  onOpenChange,
  onSuccess,
  editData,
}: TimetableEditDialogProps) => {
  const [day, setDay] = useState(editData?.day || "Monday");
  const [timeSlot, setTimeSlot] = useState(editData?.timeSlot || "");
  const [focusArea, setFocusArea] = useState(editData?.focusArea || "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!timeSlot.trim() || !focusArea.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (editData?.id) {
        // Update existing
        const { error } = await supabase
          .from("user_timetable")
          .update({
            day,
            time_slot: timeSlot,
            focus_area: focusArea,
          })
          .eq("id", editData.id);

        if (error) throw error;
        toast.success("Session updated! 📝");
      } else {
        // Create new
        const { error } = await supabase.from("user_timetable").insert({
          user_id: user.id,
          day,
          time_slot: timeSlot,
          focus_area: focusArea,
        });

        if (error) throw error;
        toast.success("Session added! 🎉");
      }

      onSuccess();
      onOpenChange(false);
      
      // Reset form for new entries
      if (!editData) {
        setDay("Monday");
        setTimeSlot("");
        setFocusArea("");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to save session");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editData ? "Edit Session" : "Add New Session"}</DialogTitle>
          <DialogDescription>
            {editData ? "Update your study session details" : "Add a new study session to your timetable"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="day">Day</Label>
            <Select value={day} onValueChange={setDay}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DAYS.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="timeSlot">Time Slot</Label>
            <Input
              id="timeSlot"
              placeholder="e.g., 8:30 – 10:20 am"
              value={timeSlot}
              onChange={(e) => setTimeSlot(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="focusArea">Focus Area</Label>
            <Input
              id="focusArea"
              placeholder="e.g., DSA coding"
              value={focusArea}
              onChange={(e) => setFocusArea(e.target.value)}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : editData ? "Update" : "Add"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
