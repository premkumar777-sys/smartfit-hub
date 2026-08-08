import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import { 
  Trophy, 
  Target, 
  Flame, 
  Sparkles, 
  Bot, 
  Camera, 
  Dumbbell, 
  ArrowRight, 
  Smartphone, 
  ShieldCheck, 
  Zap, 
  Heart,
  LineChart
} from "lucide-react";

export default function CampusClash() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"coach" | "logger" | "camera">("coach");
  
  // Registration state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [department, setDepartment] = useState("");
  const [phone, setPhone] = useState("");
  const [challengeType, setChallengeType] = useState("pullups");

  // Prefill when logged in
  useEffect(() => {
    if (user) {
      setEmail(user.email);
      setFullName(user.username || user.email.split("@")[0]);
    }
  }, [user]);

  // Interactive mock states
  const [userGoal, setUserGoal] = useState("");
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false);
  const [mockSets, setMockSets] = useState<{ reps: number; weight: number }[]>([]);

  const handleGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userGoal.trim()) return;
    setIsGeneratingResponse(true);
    setTimeout(() => {
      setAiResponse(
        `Based on your goal "${userGoal}", I recommend focusing on progressive overload. Let's start with a 4-week strength block focusing on compound movements (Squats, Bench Press, Pull-ups). What equipment do you have access to?`
      );
      setIsGeneratingResponse(false);
    }, 1200);
  };

  const addMockSet = () => {
    setMockSets([...mockSets, { reps: 10, weight: 0 }]);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let userId = user?.id;

      if (!isAuthenticated) {
        // 1. Sign up the user in Supabase Auth if not logged in
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/app/today`,
            data: {
              username: fullName.trim() || email.split("@")[0],
            },
          },
        });

        if (authError) {
          toast({
            title: "Signup failed",
            description: authError.message,
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        const newUser = authData?.user;
        if (!newUser) throw new Error("User creation failed.");
        userId = newUser.id;
      }

      // 2. Try inserting registration data to `gym_event_registrations`
      const { error: dbError } = await supabase
        .from("gym_event_registrations" as any)
        .insert({
          user_id: userId,
          full_name: fullName,
          email: email,
          challenge_type: challengeType,
          department: department,
          phone: phone,
          score: 0,
        } as any);

      if (dbError) {
        console.warn("DB registration failed:", dbError);
        toast({
          title: "Account Setup Error",
          description: "Your account is active, but we couldn't log your event details. Please contact the administrator.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Registration Successful! 🎟️",
          description: isAuthenticated 
            ? "You've successfully registered for the competition!" 
            : "Account created and registered for the competition. Head to the dashboard!",
        });
      }

      // Redirect to dashboard
      navigate("/app/today");

    } catch (err: any) {
      toast({
        title: "Registration Error",
        description: err.message || "An unexpected error occurred during registration.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-hidden py-12 px-4 md:px-8 relative">
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/10 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/10 w-96 h-96 bg-[#00FF9C]/10 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10">
        
        {/* Left Column: Event Title & Interactive Showcase */}
        <div className="lg:col-span-7 space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider">
              <Trophy className="w-4 h-4 text-[#00FF9C]" />
              SmartFit AI × OB Fitness Showdown 2026
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              OB Fitness Strength Showdown
            </h1>
            <p className="text-zinc-400 text-lg leading-relaxed max-w-xl">
              Compete against fellow members in pull-ups, deadlifts, or bench press. Claim premium gear, win cash prizes, and explore how AI can supercharge your fitness journey.
            </p>
          </div>

          {/* Interactive Feature Showcase */}
          <div className="bg-[#111111]/80 border border-white/5 rounded-3xl p-6 backdrop-blur-md shadow-2xl space-y-6">
            <div>
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Explore SmartFit AI Features
              </h3>
              <p className="text-zinc-500 text-sm mt-1">
                Explore the premium tools built to track your form, create programs, and analyze results.
              </p>
            </div>

            {/* Showcase Tabs */}
            <div className="flex gap-2 p-1 bg-black/40 rounded-xl border border-white/5">
              <button
                onClick={() => setActiveTab("coach")}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 ${
                  activeTab === "coach"
                    ? "bg-primary text-black font-bold shadow-md shadow-primary/20"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Bot className="w-4 h-4" />
                AI Coach
              </button>
              <button
                onClick={() => setActiveTab("logger")}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 ${
                  activeTab === "logger"
                    ? "bg-primary text-black font-bold shadow-md shadow-primary/20"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Dumbbell className="w-4 h-4" />
                Workout Log
              </button>
              <button
                onClick={() => setActiveTab("camera")}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 ${
                  activeTab === "camera"
                    ? "bg-primary text-black font-bold shadow-md shadow-primary/20"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Camera className="w-4 h-4" />
                Pose Tracking
              </button>
            </div>

            {/* Tab Contents */}
            <div className="min-h-[220px] bg-black/30 border border-white/5 rounded-2xl p-4 flex flex-col justify-between">
              {activeTab === "coach" && (
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold">AI Coach Simulator</h4>
                      <p className="text-xs text-zinc-500">Ask a question to see how the coach builds your fitness plan.</p>
                    </div>
                  </div>

                  <form onSubmit={handleGoalSubmit} className="flex gap-2">
                    <Input
                      placeholder="e.g. I want to build muscle..."
                      value={userGoal}
                      onChange={(e) => setUserGoal(e.target.value)}
                      className="bg-black/50 border-white/10 text-white rounded-xl placeholder:text-zinc-600 focus-visible:ring-primary text-xs"
                    />
                    <Button 
                      type="submit" 
                      disabled={isGeneratingResponse}
                      className="bg-[#00FF9C] hover:bg-[#00e08b] text-black font-bold text-xs rounded-xl px-4 flex items-center gap-1"
                    >
                      Ask {isGeneratingResponse && "..."}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </form>

                  {aiResponse && (
                    <motion.div 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-white/5 border border-white/5 rounded-xl text-xs text-zinc-300 leading-relaxed"
                    >
                      {aiResponse}
                    </motion.div>
                  )}
                </div>
              )}

              {activeTab === "logger" && (
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                      <Dumbbell className="w-4 h-4" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold">Smart Workout Logger</h4>
                      <p className="text-xs text-zinc-500">Log compound lifts, track weight progress, and view volume logs.</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs text-zinc-400 font-semibold px-2">
                      <span>Set</span>
                      <span>Reps</span>
                      <span>Weight (kg)</span>
                    </div>

                    <div className="space-y-1.5 max-h-[100px] overflow-y-auto pr-1">
                      {mockSets.length === 0 ? (
                        <p className="text-xs text-zinc-600 italic text-center py-2">No sets logged yet. Click Add Set below!</p>
                      ) : (
                        mockSets.map((set, idx) => (
                          <div key={idx} className="flex justify-between items-center bg-white/5 border border-white/5 rounded-lg p-1.5 text-xs">
                            <span className="w-8 font-bold text-center text-primary">{idx + 1}</span>
                            <input 
                              type="number" 
                              value={set.reps} 
                              onChange={(e) => {
                                const newSets = [...mockSets];
                                newSets[idx].reps = Number(e.target.value);
                                setMockSets(newSets);
                              }}
                              className="w-16 bg-black/35 border border-white/5 rounded text-center text-white py-0.5 text-xs"
                            />
                            <input 
                              type="number" 
                              value={set.weight}
                              onChange={(e) => {
                                const newSets = [...mockSets];
                                newSets[idx].weight = Number(e.target.value);
                                setMockSets(newSets);
                              }}
                              className="w-16 bg-black/35 border border-white/5 rounded text-center text-white py-0.5 text-xs"
                            />
                          </div>
                        ))
                      )}
                    </div>

                    <Button 
                      type="button" 
                      onClick={addMockSet}
                      className="w-full bg-white/5 hover:bg-white/10 text-white font-semibold text-xs rounded-xl py-1"
                    >
                      + Add Set
                    </Button>
                  </div>
                </div>
              )}

              {activeTab === "camera" && (
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                      <Camera className="w-4 h-4" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold">AI Camera Rep Counter</h4>
                      <p className="text-xs text-zinc-500">Track pushups, squats, and pullups automatically via device camera.</p>
                    </div>
                  </div>

                  <div className="relative h-[110px] bg-black/50 border border-white/10 rounded-xl overflow-hidden flex items-center justify-center">
                    {/* Simulated Camera Overlay */}
                    <div className="absolute inset-0 flex flex-col justify-between p-2">
                      <div className="flex justify-between items-center text-[10px] font-mono text-[#00FF9C]">
                        <span>• RECORDING PROMPT</span>
                        <span>1080p 30fps</span>
                      </div>
                      <div className="flex justify-between items-end text-[10px] font-mono text-[#00FF9C]">
                        <span>FITNESS TECH: ACTIVE</span>
                        <span>REP COUNT: 24</span>
                      </div>
                    </div>
                    
                    {/* Camera wireframe illustration */}
                    <div className="w-12 h-12 border-2 border-dashed border-[#00FF9C]/40 rounded-full flex items-center justify-center animate-spin">
                      <Target className="w-6 h-6 text-[#00FF9C]/60" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Registration Card */}
        <div className="lg:col-span-5 bg-[#111111]/85 backdrop-blur-md border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">
              {isAuthenticated ? "Event Entry Registration" : "Register to Compete"}
            </h2>
            <p className="text-zinc-500 text-xs leading-normal">
              {isAuthenticated 
                ? "You are logged in. Review details and choose your challenge event." 
                : "Create your SmartFit AI account and register for the event challenge in one go."}
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            {!isAuthenticated ? (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-400 font-semibold">Full Name</label>
                  <Input
                    required
                    placeholder="e.g. John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="bg-black/50 border-white/10 text-white rounded-xl placeholder:text-zinc-700 focus-visible:ring-primary text-sm h-11"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-400 font-semibold">Email Address</label>
                  <Input
                    required
                    type="email"
                    placeholder="e.g. john.doe@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-black/50 border-white/10 text-white rounded-xl placeholder:text-zinc-700 focus-visible:ring-primary text-sm h-11"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-400 font-semibold">Password (for your app account)</label>
                  <Input
                    required
                    type="password"
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-black/50 border-white/10 text-white rounded-xl placeholder:text-zinc-700 focus-visible:ring-primary text-sm h-11"
                  />
                </div>
              </>
            ) : (
              <div className="space-y-3 bg-white/[0.02] border border-white/5 p-4 rounded-2xl mb-4">
                <div className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Account Profile</div>
                <div className="text-sm font-bold text-white">{fullName}</div>
                <div className="text-xs text-zinc-400">{email}</div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400 font-semibold">Home Gym Branch</label>
                <Input
                  placeholder="e.g. Hyderabad / Central"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="bg-black/50 border-white/10 text-white rounded-xl placeholder:text-zinc-700 focus-visible:ring-primary text-sm h-11"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400 font-semibold">Phone Number</label>
                <Input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="bg-black/50 border-white/10 text-white rounded-xl placeholder:text-zinc-700 focus-visible:ring-primary text-sm h-11"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 font-semibold">Select Your Event Challenge</label>
              <select
                value={challengeType}
                onChange={(e) => setChallengeType(e.target.value)}
                className="w-full bg-black/50 border border-white/10 text-white rounded-xl px-3 h-11 focus:outline-none focus:border-primary text-sm"
              >
                <option value="pullups">Max Pull-ups (Reps) 💪</option>
                <option value="deadlifts">Max Deadlift (Weight) 🏋️</option>
                <option value="benchpress">Max Bench Press (Weight) 🏋️</option>
              </select>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#00FF9C] hover:bg-[#00e08b] text-black font-extrabold h-11 rounded-xl flex items-center justify-center gap-1 shadow-lg shadow-[#00FF9C]/25 text-sm"
            >
              {isLoading 
                ? (isAuthenticated ? "Registering..." : "Signing up...") 
                : (isAuthenticated ? "Register for Challenge" : "Register & Create Account")}
              <Zap className="w-4 h-4" />
            </Button>
          </form>
        </div>

      </div>
    </div>
  );
}
