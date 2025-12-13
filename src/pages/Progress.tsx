import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/Container";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
import type { ProgressLog } from "@/integrations/supabase/types";

export default function Progress() {
  const [logs, setLogs] = useState<ProgressLog[]>([]);
  const [weight, setWeight] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Load user and logs on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          setUserId(user.id);
          const { data, error } = await supabase
            .from('progress_logs')
            .select('*')
            .eq('user_id', user.id)
            .order('date', { ascending: false })
            .limit(90);

          if (error) throw error;
          setLogs(data || []);
        } else {
          // Fallback to localStorage for non-authenticated users
          const saved = localStorage.getItem("smartfit_progress_v1");
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              setLogs(parsed.map((p: any) => ({
                id: p.id || crypto.randomUUID(),
                user_id: '',
                date: p.date,
                weight: p.weight,
                notes: p.notes,
                created_at: new Date().toISOString(),
              })));
            } catch {
              // ignore
            }
          }
        }
      } catch (err) {
        console.error("Error loading progress:", err);
        toast.error("Failed to load progress data");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const stats = useMemo(() => {
    if (!logs.length) return null;
    const sorted = [...logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const start = sorted[0].weight || 0;
    const latest = sorted[sorted.length - 1].weight || 0;
    const change = +(latest - start).toFixed(1);
    const streak = calcStreak(sorted);
    return { latest, change, streak };
  }, [logs]);

  const addLog = async (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(weight);
    if (!w) return;

    setIsSaving(true);
    const dateStr = new Date().toISOString().slice(0, 10);

    try {
      if (userId) {
        // Save to Supabase
        const { data, error } = await supabase
          .from('progress_logs')
          .insert({
            user_id: userId,
            date: dateStr,
            weight: w,
            notes: notes || null,
          })
          .select()
          .single();

        if (error) throw error;
        setLogs((prev) => [data, ...prev].slice(0, 90));
        toast.success("Progress logged!");
      } else {
        // Save to localStorage for non-authenticated users
        const entry = {
          id: crypto.randomUUID(),
          user_id: '',
          date: dateStr,
          weight: w,
          notes: notes || undefined,
          created_at: new Date().toISOString(),
        };
        const newLogs = [entry, ...logs].slice(0, 90);
        setLogs(newLogs as ProgressLog[]);
        localStorage.setItem("smartfit_progress_v1", JSON.stringify(newLogs));
        toast.success("Progress logged locally!");
      }
      setWeight("");
      setNotes("");
    } catch (err) {
      console.error("Error saving progress:", err);
      toast.error("Failed to save progress");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteLog = async (logId: string) => {
    try {
      if (userId) {
        const { error } = await supabase
          .from('progress_logs')
          .delete()
          .eq('id', logId);

        if (error) throw error;
      }
      setLogs((prev) => prev.filter((l) => l.id !== logId));
      toast.success("Entry deleted");
    } catch (err) {
      console.error("Error deleting log:", err);
      toast.error("Failed to delete entry");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen py-16 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-16 relative overflow-hidden">
      <div className="absolute inset-0 gradient-hero opacity-15" />
      <Container className="relative z-10">
        <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6" aria-label="Back to home page">
          ← Back
        </Link>

        <div className="flex flex-col gap-8">
          <div className="text-center space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-primary">Progress</p>
            <h1 className="text-4xl md:text-5xl font-bold">Progress & Trends</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {userId ? "Your progress is synced to your account." : "Sign in to sync your progress across devices."}
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="glass border-primary/20 lg:col-span-2">
              <CardHeader>
                <CardTitle>Log Weight</CardTitle>
                <CardDescription>
                  {userId ? "Entries are saved to your account." : "Entries stay in your browser (localStorage)."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={addLog} className="grid md:grid-cols-3 gap-4 items-end">
                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight (kg)</Label>
                    <Input id="weight" value={weight} onChange={(e) => setWeight(e.target.value)} type="number" step="0.1" min="30" max="250" required />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="notes">Notes (optional)</Label>
                    <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Session notes, soreness, PRs..." />
                  </div>
                  <Button type="submit" variant="hero" className="md:col-span-3" disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Entry"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="glass border-primary/20">
              <CardHeader>
                <CardTitle>Snapshot</CardTitle>
                <CardDescription>Quick view of your trend.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {stats ? (
                  <>
                    <Stat label="Latest" value={`${stats.latest} kg`} accent />
                    <Stat label="Change" value={`${stats.change > 0 ? "+" : ""}${stats.change} kg`} />
                    <Stat label="Streak (days)" value={`${stats.streak}`} />
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Add your first entry to see stats.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="glass border-primary/20">
            <CardHeader>
              <CardTitle>Recent Logs</CardTitle>
              <CardDescription>Newest first, capped at 90 entries.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {logs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No entries yet.</p>
              ) : (
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {logs.map((log) => (
                    <div key={log.id} className="p-3 rounded-lg border border-gray-800 bg-gray-900/60 relative group">
                      <button
                        onClick={() => deleteLog(log.id)}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300"
                        aria-label="Delete entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <p className="text-xs text-muted-foreground">{log.date}</p>
                      <p className="text-lg font-semibold">{log.weight} kg</p>
                      {log.notes && <p className="text-sm text-muted-foreground mt-1">{log.notes}</p>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </Container>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`p-3 rounded-lg border ${accent ? "border-primary/50 bg-primary/5 text-primary-foreground" : "border-gray-800 bg-gray-900/60"}`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}

function calcStreak(sorted: ProgressLog[]) {
  if (!sorted.length) return 0;
  let streak = 1;
  for (let i = sorted.length - 1; i > 0; i--) {
    const curr = new Date(sorted[i].date).getTime();
    const prev = new Date(sorted[i - 1].date).getTime();
    const diff = (curr - prev) / (1000 * 60 * 60 * 24);
    if (diff <= 1.5) streak += 1;
    else break;
  }
  return streak;
}
