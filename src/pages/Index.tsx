import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { TimetableCard } from "@/components/TimetableCard";
import { TimetableEditDialog } from "@/components/TimetableEditDialog";
import { Sparkles, LogOut, Plus } from "lucide-react";
import { toast } from "sonner";

interface StudySession {
  id: string;
  day: string;
  time_slot: string;
  focus_area: string;
  is_completed: boolean;
  checked_in_at: string | null;
}

interface TimetableSession {
  id: string;
  day: string;
  time_slot: string;
  focus_area: string;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [timetable, setTimetable] = useState<TimetableSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  useEffect(() => {
    // Check authentication
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchTimetable = async () => {
    try {
      const { data, error } = await supabase
        .from("user_timetable")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      setTimetable(data || []);
    } catch (error: any) {
      console.error("Error fetching timetable:", error);
    }
  };

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from("study_sessions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (error: any) {
      console.error("Error fetching sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAll = () => {
    fetchTimetable();
    fetchSessions();
  };

  useEffect(() => {
    if (user) {
      fetchAll();
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success("Logged out successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to logout");
    }
  };

  const getSessionForSlot = (timetableId: string) => {
    const timetableEntry = timetable.find((t) => t.id === timetableId);
    if (!timetableEntry) return null;

    return sessions.find(
      (s) =>
        s.day === timetableEntry.day &&
        s.time_slot === timetableEntry.time_slot &&
        s.focus_area === timetableEntry.focus_area
    );
  };

  const groupedTimetable = DAYS.map((day) => ({
    day,
    sessions: timetable.filter((t) => t.day === day),
  })).filter((dayGroup) => dayGroup.sessions.length > 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--gradient-hero)" }}>
        <div className="text-center">
          <Sparkles className="h-12 w-12 animate-pulse mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading your study plan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: "var(--gradient-hero)" }}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full" style={{ background: "var(--gradient-main)" }}>
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-main)" }}>
                Mariam Getting All A's
              </h1>
              <p className="text-sm text-muted-foreground">Your path to academic excellence ✨</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setAddDialogOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Session
            </Button>
            <Button onClick={handleLogout} variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {groupedTimetable.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No sessions in your timetable yet.</p>
            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Session
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {groupedTimetable.map((daySchedule) => (
              <div key={daySchedule.day} className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground">{daySchedule.day}</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {daySchedule.sessions.map((timetableEntry) => {
                    const existingSession = getSessionForSlot(timetableEntry.id);
                    return (
                      <TimetableCard
                        key={timetableEntry.id}
                        timetableId={timetableEntry.id}
                        sessionId={existingSession?.id}
                        day={timetableEntry.day}
                        timeSlot={timetableEntry.time_slot}
                        focusArea={timetableEntry.focus_area}
                        isCompleted={existingSession?.is_completed || false}
                        checkedInAt={existingSession?.checked_in_at}
                        onUpdate={fetchAll}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        <TimetableEditDialog
          open={addDialogOpen}
          onOpenChange={setAddDialogOpen}
          onSuccess={fetchAll}
        />
      </div>
    </div>
  );
};

export default Index;
