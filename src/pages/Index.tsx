import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { TimetableCard } from "@/components/TimetableCard";
import { Sparkles, LogOut } from "lucide-react";
import { toast } from "sonner";

interface StudySession {
  id: string;
  day: string;
  time_slot: string;
  focus_area: string;
  is_completed: boolean;
  checked_in_at: string | null;
}

const TIMETABLE = [
  { day: "Monday", sessions: [{ time: "8:30 am – 5:30 pm", focus: "University (long day)" }, { time: "8:30 – 9:15 pm", focus: "Light review (DBMS or Linear)" }] },
  { day: "Tuesday", sessions: [{ time: "8:30 – 10:20 am", focus: "University" }, { time: "11:30 – 12:15 pm", focus: "Linear Algebra practice" }, { time: "12:30 – 1:15 pm", focus: "DBMS concepts/queries" }, { time: "2:45 – 5:30 pm", focus: "University" }, { time: "8:30 – 9:15 pm", focus: "DSA coding (1 problem)" }] },
  { day: "Wednesday", sessions: [{ time: "8:30 – 9:30 am", focus: "University" }, { time: "10:30 – 11:15 am", focus: "DSA problem solving" }, { time: "11:30 – 12:15 pm", focus: "DSA problem solving" }, { time: "12:30 – 1:15 pm", focus: "Linear Algebra problem set" }, { time: "2:45 – 5:30 pm", focus: "University" }, { time: "8:30 – 9:00 pm", focus: "DBMS flashcards/summary" }] },
  { day: "Thursday", sessions: [{ time: "10:20 am – 5:30 pm", focus: "University" }, { time: "8:00 – 8:45 pm", focus: "Light DSA (easy problem) OR Linear recap" }] },
  { day: "Friday", sessions: [{ time: "12:00 – 1:30 pm", focus: "DSA coding (focus session)" }, { time: "4:00 – 5:00 pm", focus: "DBMS deep dive (queries, ER diagrams)" }] },
  { day: "Saturday", sessions: [{ time: "11:00 – 12:30 pm", focus: "DSA focus session" }, { time: "3:00 – 6:00 pm", focus: "MERN Stack Course" }, { time: "6:30 – 7:00 pm", focus: "SE Principles / Business Writing" }] },
  { day: "Sunday", sessions: [{ time: "11:00 – 12:30 pm", focus: "Linear Algebra problem-solving" }, { time: "3:00 – 6:00 pm", focus: "MERN Stack Course" }, { time: "6:30 – 7:00 pm", focus: "Technical Business Writing" }] },
];

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    if (user) {
      fetchSessions();
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

  const getSessionForSlot = (day: string, timeSlot: string, focusArea: string) => {
    return sessions.find(
      (s) => s.day === day && s.time_slot === timeSlot && s.focus_area === focusArea
    );
  };

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
          <Button onClick={handleLogout} variant="outline" size="sm">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        <div className="space-y-8">
          {TIMETABLE.map((daySchedule) => (
            <div key={daySchedule.day} className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">{daySchedule.day}</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {daySchedule.sessions.map((session, idx) => {
                  const existingSession = getSessionForSlot(
                    daySchedule.day,
                    session.time,
                    session.focus
                  );
                  return (
                    <TimetableCard
                      key={`${daySchedule.day}-${idx}`}
                      sessionId={existingSession?.id}
                      day={daySchedule.day}
                      timeSlot={session.time}
                      focusArea={session.focus}
                      isCompleted={existingSession?.is_completed || false}
                      checkedInAt={existingSession?.checked_in_at}
                      onUpdate={fetchSessions}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;
