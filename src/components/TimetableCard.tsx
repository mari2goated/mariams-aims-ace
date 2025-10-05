import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";

interface TimetableCardProps {
  sessionId?: string;
  day: string;
  timeSlot: string;
  focusArea: string;
  isCompleted: boolean;
  checkedInAt?: string | null;
  onUpdate: () => void;
}

export const TimetableCard = ({
  sessionId,
  day,
  timeSlot,
  focusArea,
  isCompleted,
  checkedInAt,
  onUpdate,
}: TimetableCardProps) => {
  const [loading, setLoading] = useState(false);

  const handleCheckIn = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Please log in to check in");
        return;
      }

      if (sessionId) {
        // Update existing session
        const { error } = await supabase
          .from("study_sessions")
          .update({
            checked_in_at: new Date().toISOString(),
            is_completed: false,
          })
          .eq("id", sessionId);

        if (error) throw error;
      } else {
        // Create new session
        const { error } = await supabase.from("study_sessions").insert({
          user_id: user.id,
          day,
          time_slot: timeSlot,
          focus_area: focusArea,
          checked_in_at: new Date().toISOString(),
          is_completed: false,
        });

        if (error) throw error;
      }

      toast.success("Checked in! Time to focus! 📚");
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || "Failed to check in");
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!sessionId) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("study_sessions")
        .update({
          is_completed: true,
          checked_out_at: new Date().toISOString(),
        })
        .eq("id", sessionId);

      if (error) throw error;

      toast.success("Session completed! You're crushing it! 🎉");
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || "Failed to complete session");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      className={`transition-all hover:shadow-lg ${
        isCompleted
          ? "border-primary bg-gradient-to-br from-primary/10 to-secondary/10"
          : checkedInAt
          ? "border-accent bg-gradient-to-br from-accent/5 to-primary/5"
          : "hover:border-primary/50"
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <Badge variant="outline" className="mb-2">
              {timeSlot}
            </Badge>
            <CardTitle className="text-lg">{focusArea}</CardTitle>
          </div>
          {isCompleted && (
            <div className="p-2 rounded-full bg-primary text-primary-foreground">
              <Check className="h-4 w-4" />
            </div>
          )}
          {checkedInAt && !isCompleted && (
            <div className="p-2 rounded-full bg-accent text-accent-foreground">
              <Clock className="h-4 w-4" />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {!isCompleted && !checkedInAt && (
          <Button onClick={handleCheckIn} disabled={loading} className="w-full" variant="outline">
            {loading ? "Checking in..." : "Check In"}
          </Button>
        )}
        {checkedInAt && !isCompleted && (
          <Button onClick={handleComplete} disabled={loading} className="w-full">
            {loading ? "Completing..." : "Complete Session"}
          </Button>
        )}
        {isCompleted && (
          <Button onClick={handleCheckIn} disabled={loading} className="w-full" variant="outline">
            {loading ? "Starting..." : "Start Again"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
