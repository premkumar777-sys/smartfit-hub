import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/Container";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LogEntry = { date: string; weight: number; notes?: string };
const storageKey = "smartfit_progress_v1";

export default function Progress() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [weight, setWeight] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        setLogs(JSON.parse(saved));
      } catch {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(logs));
  }, [logs]);

  const stats = useMemo(() => {
    if (!logs.length) return null;
    const sorted = [...logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const start = sorted[0].weight;
    const latest = sorted[sorted.length - 1].weight;
    const change = +(latest - start).toFixed(1);
    const streak = calcStreak(sorted);
    return { latest, change, streak };
  }, [logs]);

  const addLog = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(weight);
    if (!w) return;
    const entry: LogEntry = {
      date: new Date().toISOString().slice(0, 10),
      weight: w,
      notes: notes || undefined,
    };
    setLogs((prev) => [entry, ...prev].slice(0, 90));
    setWeight("");
    setNotes("");
  };

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
              Lightweight, local-only dashboard: track weight, see change, and keep notes—no backend required.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="glass border-primary/20 lg:col-span-2">
              <CardHeader>
                <CardTitle>Log Weight</CardTitle>
                <CardDescription>Entries stay in your browser (localStorage).</CardDescription>
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
                  <Button type="submit" variant="hero" className="md:col-span-3">Save Entry</Button>
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
                    <p className="text-xs text-muted-foreground">Charts can be added later; data stays local.</p>
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
                    <div key={`${log.date}-${log.weight}-${log.notes ?? ""}`} className="p-3 rounded-lg border border-gray-800 bg-gray-900/60">
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

function calcStreak(sorted: LogEntry[]) {
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

