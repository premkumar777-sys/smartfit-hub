import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  Trophy, 
  Trash2, 
  Save, 
  Lock, 
  Users, 
  Dumbbell, 
  Activity,
  ArrowRight,
  LogOut,
  RefreshCw
} from "lucide-react";

interface Registration {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  department: string | null;
  challenge_type: string;
  score: number;
  is_winner: boolean;
  winner_rank: number | null;
  created_at: string;
}

export default function EventsAdmin() {
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [password, setPassword] = useState("");
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Check auth on load
  useEffect(() => {
    const isAuth = sessionStorage.getItem("events_admin_auth") === "true";
    setIsAdmin(isAuth);
    if (isAuth) {
      fetchRegistrations();
    } else {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "psainik92") {
      setIsAdmin(true);
      sessionStorage.setItem("events_admin_auth", "true");
      setIsLoading(true);
      fetchRegistrations();
      toast({
        title: "Access Granted",
        description: "Welcome to the Gym Competition Admin Panel.",
      });
    } else {
      toast({
        title: "Access Denied",
        description: "Incorrect password. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    sessionStorage.removeItem("events_admin_auth");
  };

  const fetchRegistrations = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("gym_event_registrations" as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRegistrations(data || []);
    } catch (err: any) {
      console.error("Error fetching registrations:", err);
      toast({
        title: "Error fetching data",
        description: err.message || "Failed to retrieve registrations.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (id: string, updatedFields: Partial<Registration>) => {
    setUpdatingId(id);
    try {
      const { error } = await supabase
        .from("gym_event_registrations" as any)
        .update(updatedFields as any)
        .eq("id", id);

      if (error) throw error;

      // Update local state
      setRegistrations(prev =>
        prev.map(reg => (reg.id === id ? { ...reg, ...updatedFields } : reg))
      );

      toast({
        title: "Success",
        description: "Participant details updated successfully.",
      });
    } catch (err: any) {
      toast({
        title: "Update failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this registration?")) return;

    try {
      const { error } = await supabase
        .from("gym_event_registrations" as any)
        .delete()
        .eq("id", id);

      if (error) throw error;

      setRegistrations(prev => prev.filter(reg => reg.id !== id));
      toast({
        title: "Deleted",
        description: "Registration has been successfully removed.",
      });
    } catch (err: any) {
      toast({
        title: "Deletion failed",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  // Stats calculation
  const totalCount = registrations.length;
  const pullupsCount = registrations.filter(r => r.challenge_type === "pullups").length;
  const deadliftsCount = registrations.filter(r => r.challenge_type === "deadlifts").length;
  const benchpressCount = registrations.filter(r => r.challenge_type === "benchpress").length;

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-white text-center">
        {/* Background Gradients */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10" />
        
        <div className="max-w-md w-full bg-[#111111]/85 backdrop-blur-md p-8 rounded-3xl border border-white/5 space-y-6 shadow-2xl">
          <div className="w-16 h-16 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center mx-auto text-primary">
            <Lock className="w-8 h-8 text-[#00FF9C]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Admin Authentication</h2>
            <p className="text-zinc-500 text-xs mt-1.5">
              Enter the competition password to access registration controls.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 font-semibold">Password</label>
              <Input
                required
                type="password"
                placeholder="Enter password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-black/50 border-white/10 text-white rounded-xl placeholder:text-zinc-700 focus-visible:ring-primary h-11"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-[#00FF9C] hover:bg-[#00e08b] text-black font-extrabold h-11 rounded-xl flex items-center justify-center gap-1 shadow-lg shadow-[#00FF9C]/25 text-sm"
            >
              Verify Credentials
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pt-24 pb-12 px-4 md:px-8">
      {/* Background Blur */}
      <div className="absolute top-1/10 right-1/10 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10" />

      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
              <Activity className="w-4 h-4 text-[#00FF9C]" />
              SmartFit local Gym Event Manager
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent mt-1">
              Competition Admin Panel
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchRegistrations}
              disabled={isLoading}
              className="border-white/10 text-white hover:bg-white/5 rounded-xl h-10 px-4 flex items-center gap-1.5"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleLogout}
              className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl h-10 px-4 flex items-center gap-1.5"
            >
              <LogOut className="w-4 h-4" />
              Lock / Exit
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#111111]/80 border border-white/5 rounded-2xl p-5 flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="text-zinc-500 text-xs">Total Registrations</div>
              <div className="text-2xl font-bold">{totalCount}</div>
            </div>
          </div>

          <div className="bg-[#111111]/80 border border-white/5 rounded-2xl p-5 flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl">
              <Trophy className="w-6 h-6 text-[#00FF9C]" />
            </div>
            <div>
              <div className="text-zinc-500 text-xs">Pull-up Contenders</div>
              <div className="text-2xl font-bold">{pullupsCount}</div>
            </div>
          </div>

          <div className="bg-[#111111]/80 border border-white/5 rounded-2xl p-5 flex items-center gap-4">
            <div className="p-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl">
              <Dumbbell className="w-6 h-6" />
            </div>
            <div>
              <div className="text-zinc-500 text-xs">Deadlift Contenders</div>
              <div className="text-2xl font-bold">{deadliftsCount}</div>
            </div>
          </div>

          <div className="bg-[#111111]/80 border border-white/5 rounded-2xl p-5 flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl">
              <Dumbbell className="w-6 h-6" />
            </div>
            <div>
              <div className="text-zinc-500 text-xs">Bench Press Contenders</div>
              <div className="text-2xl font-bold">{benchpressCount}</div>
            </div>
          </div>
        </div>

        {/* Participant Table */}
        <div className="bg-[#111111]/80 border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
          <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center">
            <h3 className="font-bold text-lg">Registrations Database</h3>
            <span className="text-xs text-zinc-500">{registrations.length} competitors</span>
          </div>

          {isLoading ? (
            <div className="py-20 text-center text-zinc-500 flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-8 h-8 animate-spin text-primary" />
              <span>Loading participant records...</span>
            </div>
          ) : registrations.length === 0 ? (
            <div className="py-20 text-center text-zinc-500 italic">
              No registrations found. Share the event page to get signups!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-black/40 text-xs text-zinc-400 font-semibold uppercase">
                    <th className="px-6 py-4">Competitor Details</th>
                    <th className="px-6 py-4">Challenge Event</th>
                    <th className="px-6 py-4 w-40">Leaderboard Score</th>
                    <th className="px-6 py-4 w-52">Highlight / Rank</th>
                    <th className="px-6 py-4 w-28 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {registrations.map((reg) => (
                    <tr key={reg.id} className="hover:bg-white/[0.02] transition-colors">
                      {/* Name / Contact details */}
                      <td className="px-6 py-4 space-y-1">
                        <div className="font-bold text-white text-base">{reg.full_name}</div>
                        <div className="text-xs text-zinc-500 flex flex-wrap gap-x-3">
                          <span>{reg.email}</span>
                          {reg.phone && <span>• {reg.phone}</span>}
                          {reg.department && <span className="text-zinc-600">• {reg.department}</span>}
                        </div>
                      </td>

                      {/* Event Tag */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                          reg.challenge_type === "pullups" 
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" 
                            : reg.challenge_type === "deadlifts"
                            ? "bg-red-500/10 text-red-400 border border-red-500/20"
                            : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        }`}>
                          {reg.challenge_type === "pullups" && "Pull-Ups 💪"}
                          {reg.challenge_type === "deadlifts" && "Deadlifts 🏋️"}
                          {reg.challenge_type === "benchpress" && "Bench Press 🏋️"}
                        </span>
                      </td>

                      {/* Score Input */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={reg.score}
                            onChange={(e) => {
                              const value = Number(e.target.value);
                              setRegistrations(prev =>
                                prev.map(item => item.id === reg.id ? { ...item, score: value } : item)
                              );
                            }}
                            className="w-20 bg-black/45 border border-white/10 rounded-xl text-center text-white h-9 focus:outline-none focus:border-primary text-sm font-semibold"
                          />
                          <span className="text-xs text-zinc-500">
                            {reg.challenge_type === "pullups" ? "reps" : "kg"}
                          </span>
                        </div>
                      </td>

                      {/* Rank Selection Dropdown */}
                      <td className="px-6 py-4">
                        <select
                          value={reg.is_winner && reg.winner_rank ? String(reg.winner_rank) : "none"}
                          onChange={(e) => {
                            const val = e.target.value;
                            const isWin = val !== "none";
                            const rank = isWin ? Number(val) : null;
                            setRegistrations(prev =>
                              prev.map(item => item.id === reg.id ? { ...item, is_winner: isWin, winner_rank: rank } : item)
                            );
                          }}
                          className="w-full bg-black/45 border border-white/10 text-white rounded-xl px-2.5 h-9 focus:outline-none focus:border-primary text-xs"
                        >
                          <option value="none">No Rank / General</option>
                          <option value="1">🏆 1st (Gold Winner)</option>
                          <option value="2">🥈 2nd (Silver Winner)</option>
                          <option value="3">🥉 3rd (Bronze Winner)</option>
                        </select>
                      </td>

                      {/* Actions (Save & Delete) */}
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex gap-2">
                          <Button
                            size="icon"
                            onClick={() => handleUpdate(reg.id, { 
                              score: reg.score, 
                              is_winner: reg.is_winner, 
                              winner_rank: reg.winner_rank 
                            })}
                            disabled={updatingId === reg.id}
                            className="bg-[#00FF9C]/10 text-[#00FF9C] hover:bg-[#00FF9C]/20 border border-[#00FF9C]/20 rounded-xl w-9 h-9 flex items-center justify-center"
                            title="Save participant data"
                          >
                            <Save className={`w-4 h-4 ${updatingId === reg.id ? "animate-pulse" : ""}`} />
                          </Button>
                          <Button
                            size="icon"
                            variant="destructive"
                            onClick={() => handleDelete(reg.id)}
                            className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 rounded-xl w-9 h-9 flex items-center justify-center"
                            title="Delete participant"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
