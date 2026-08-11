import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
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
  LineChart,
  QrCode,
  CheckCircle,
  RefreshCw,
  Search,
  Upload,
  UserCheck,
  Award,
  Video
} from "lucide-react";

interface Registration {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  department: string;
  challenge_type: string;
  score: number;
  is_winner?: boolean;
  winner_rank?: number | null;
  age?: number;
  weight?: number;
  created_at?: string;
}

export default function ObFitnessChallenge() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"coach" | "logger" | "camera">("coach");
  
  // Auth state
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userRegistration, setUserRegistration] = useState<Registration | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Registration Form State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [department, setDepartment] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [challengeType, setChallengeType] = useState("pullups");

  // Leaderboard States
  const [leaderboard, setLeaderboard] = useState<Registration[]>([]);
  const [leaderboardTab, setLeaderboardTab] = useState<string>("pullups");
  const [isLeaderboardLoading, setIsLeaderboardLoading] = useState(false);

  // Admin Scanner States
  const [adminSearchId, setAdminSearchId] = useState("");
  const [scannedRegistration, setScannedRegistration] = useState<Registration | null>(null);
  const [isSearchingAdmin, setIsSearchingAdmin] = useState(false);
  const [adminScore, setAdminScore] = useState("");
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);
  
  // Camera scanning states
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Interactive mock states
  const [userGoal, setUserGoal] = useState("");
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false);
  const [mockSets, setMockSets] = useState<{ reps: number; weight: number }[]>([]);

  // Fetch user auth & active registration
  useEffect(() => {
    async function checkAuthAndRegistration() {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      
      if (user) {
        setFullName(user.user_metadata?.username || user.user_metadata?.full_name || "");
        setEmail(user.email || "");
        
        // Strictly check if email matches admin
        if (user.email === "eslavathpremkumar17@gmail.com") {
          setIsAdmin(true);
        }

        // Fetch their registration if exists
        try {
          const { data, error } = await supabase
            .from("gym_event_registrations" as any)
            .select("*")
            .eq("user_id", user.id)
            .maybeSingle();

          if (data) {
            setUserRegistration(data as Registration);
          }
        } catch (err) {
          console.error("Error fetching registration:", err);
        }
      }
    }
    
    checkAuthAndRegistration();
    fetchLeaderboard();
  }, []);

  // Fetch leaderboard data
  const fetchLeaderboard = async () => {
    setIsLeaderboardLoading(true);
    try {
      const { data, error } = await supabase
        .from("gym_event_registrations" as any)
        .select("*")
        .order("score", { ascending: false });

      if (error) throw error;
      if (data) {
        setLeaderboard(data as Registration[]);
      }
    } catch (err: any) {
      console.error("Error fetching leaderboard:", err.message);
    } finally {
      setIsLeaderboardLoading(false);
    }
  };

  // Filter and sort leaderboard by challenge category
  const filteredLeaderboard = leaderboard
    .filter((reg) => reg.challenge_type === leaderboardTab)
    .sort((a, b) => b.score - a.score);

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

  // Register user & create entry pass
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let userId = currentUser?.id;

      // 1. If not logged in, sign up in Supabase Auth first
      if (!currentUser) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/events/ob-fitness`,
            data: {
              username: fullName.trim() || email.split("@")[0],
            },
          },
        });

        if (authError) {
          toast({
            title: "Account Creation Failed",
            description: authError.message,
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        const user = authData?.user;
        if (!user) throw new Error("User creation failed.");
        userId = user.id;
        setCurrentUser(user);

        // Check if admin signed up
        if (user.email === "eslavathpremkumar17@gmail.com") {
          setIsAdmin(true);
        }
      }

      // 2. Insert into `gym_event_registrations`
      const { data: regData, error: dbError } = await supabase
        .from("gym_event_registrations" as any)
        .insert({
          user_id: userId,
          full_name: fullName,
          email: email,
          challenge_type: challengeType,
          department: department || "General",
          phone: phone,
          score: 0,
          age: age ? parseInt(age) : null,
          weight: weight ? parseFloat(weight) : null,
          is_winner: false
        } as any)
        .select()
        .single();

      if (dbError) {
        console.error("DB registration failed:", dbError);
        toast({
          title: "Registration Error",
          description: "Failed to store registration details in database. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Registration Successful! 🎟️",
          description: "Your OB Fitness Challenge entry pass is ready.",
        });
        setUserRegistration(regData as Registration);
        fetchLeaderboard();
      }

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

  // Print/Download Ticket Pass
  const handlePrintTicket = () => {
    window.print();
  };

  // Search Ticket in Admin mode
  const handleAdminSearch = async (ticketId?: string) => {
    const idToSearch = ticketId || adminSearchId;
    if (!idToSearch.trim()) return;

    setIsSearchingAdmin(true);
    try {
      const { data, error } = await supabase
        .from("gym_event_registrations" as any)
        .select("*")
        .eq("id", idToSearch.trim())
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setScannedRegistration(data as Registration);
        setAdminScore(data.score.toString());
        toast({
          title: "Ticket Found",
          description: `Loaded registration for ${data.full_name}`,
        });
      } else {
        toast({
          title: "Ticket Not Found",
          description: "No registration matching this Ticket ID was found.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Search Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsSearchingAdmin(false);
    }
  };

  // Submit/Update score in Admin mode
  const handleScoreUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannedRegistration) return;

    setIsSubmittingScore(true);
    try {
      const scoreNum = parseInt(adminScore) || 0;

      const { error } = await supabase
        .from("gym_event_registrations" as any)
        .update({ score: scoreNum } as any)
        .eq("id", scannedRegistration.id);

      if (error) throw error;

      toast({
        title: "Score Verified! 🏆",
        description: `Logged score of ${scoreNum} for ${scannedRegistration.full_name}.`,
      });

      // Update scanned state locally
      setScannedRegistration({
        ...scannedRegistration,
        score: scoreNum
      });

      // Refresh leaderboard
      fetchLeaderboard();

    } catch (err: any) {
      toast({
        title: "Failed to Update Score",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmittingScore(false);
    }
  };

  // Webcam Scanning Toggle
  const startCameraScanner = async () => {
    setIsCameraActive(true);
    try {
      const constraints = { video: { facingMode: "environment" } };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      // Native Barcode Detector support check
      if ('BarcodeDetector' in window) {
        const barcodeDetector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
        const intervalId = setInterval(async () => {
          if (!videoRef.current || !streamRef.current || !isCameraActive) {
            clearInterval(intervalId);
            return;
          }
          try {
            const barcodes = await barcodeDetector.detect(videoRef.current);
            if (barcodes.length > 0) {
              const scannedValue = barcodes[0].rawValue;
              // Check if it's a UUID/Registration ID
              if (scannedValue) {
                clearInterval(intervalId);
                stopCameraScanner();
                setAdminSearchId(scannedValue);
                handleAdminSearch(scannedValue);
              }
            }
          } catch (e) {
            // Ignore detector errors
          }
        }, 500);
      }
    } catch (err) {
      console.warn("Failed to get webcam stream:", err);
      toast({
        title: "Camera Access Error",
        description: "Could not open camera. Please use manual entry or file upload instead.",
        variant: "destructive",
      });
    }
  };

  const stopCameraScanner = () => {
    setIsCameraActive(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Mock scan from uploaded image
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Simulate QR reading delay
    setIsSearchingAdmin(true);
    setTimeout(async () => {
      // In testing we fetch a random ticket or the logged user's ticket if available
      try {
        const { data } = await supabase
          .from("gym_event_registrations" as any)
          .select("id")
          .limit(1);
          
        if (data && data.length > 0) {
          const id = data[0].id;
          setAdminSearchId(id);
          handleAdminSearch(id);
        } else {
          toast({
            title: "Simulated Scan Error",
            description: "No registration records found in database to simulate scan.",
            variant: "destructive",
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearchingAdmin(false);
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-hidden py-12 px-4 md:px-8 relative pt-24 pb-20">
      {/* Custom print styling to isolate the ticket card when printing */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          /* Hide global navbar, footer, chatbots, bottom navigations, buttons, and marked sections */
          header, footer, nav, aside, [role="navigation"], .floating-chatbot, .print\\:hidden, button {
            display: none !important;
          }
          
          /* Reset container backgrounds for printing */
          body, html, #root {
            background: white !important;
            color: black !important;
          }
          
          .min-h-screen {
            background: white !important;
            min-height: auto !important;
            padding: 0 !important;
          }
          
          /* Remove absolute/floating background decorations */
          .absolute {
            display: none !important;
          }

          /* Force layouts to collapse and take full page width */
          .grid {
            display: block !important;
          }

          .lg\\:col-span-6 {
            width: 100% !important;
          }
          
          /* Center the ticket and strip glassmorphism/dark backgrounds */
          #ob-fitness-ticket-card {
            display: block !important;
            position: relative !important;
            width: 100% !important;
            max-width: 600px !important;
            margin: 40px auto !important;
            padding: 32px !important;
            background: white !important;
            color: black !important;
            border: 2px solid black !important;
            border-radius: 24px !important;
            box-shadow: none !important;
            transform: none !important;
          }

          /* Ensure clear readability of texts */
          #ob-fitness-ticket-card * {
            color: black !important;
            background: transparent !important;
            border-color: #e4e4e7 !important;
          }

          #ob-fitness-ticket-card span {
            color: #71717a !important; /* zinc-500 equivalent */
          }

          #ob-fitness-ticket-card span.text-white, 
          #ob-fitness-ticket-card span.print\\:text-black,
          #ob-fitness-ticket-card span.font-extrabold {
            color: black !important;
          }

          /* Confirmed badge status border/color */
          #ob-fitness-ticket-card .rounded-full {
            border: 1px solid black !important;
            background: white !important;
            color: black !important;
          }

          /* Render the QR code as black on white */
          #ob-fitness-ticket-card img {
            filter: brightness(0) !important;
            mix-blend-mode: multiply !important;
          }
        }
      `}} />
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/10 w-96 h-96 bg-[#00FF9C]/10 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-12 relative z-10">
        
        {/* Header Block */}
        <div className="text-center space-y-4 max-w-3xl mx-auto print:hidden">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00FF9C]/10 border border-[#00FF9C]/25 text-[#00FF9C] text-xs font-semibold uppercase tracking-wider">
            <Trophy className="w-4 h-4" />
            SmartFit AI Official Competition
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            OB Fitness Challenge
          </h1>
          <p className="text-zinc-400 text-lg leading-relaxed">
            Compete in Pull-ups, Deadlifts, or Bench Press. Get your unique QR check-in pass, get verified by gym staff, log your verified scores, and climb the live leaderboards!
          </p>
        </div>

        {/* --- Main Registration / Ticket Grid --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Showcase & Info */}
          <div className="lg:col-span-6 space-y-8 print:hidden">
            {/* Rebranded Showcase Tabs */}
            <div className="bg-[#111111]/85 border border-white/5 rounded-3xl p-6 backdrop-blur-md shadow-2xl space-y-6">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#00FF9C]" />
                  OB Fitness AI Systems
                </h3>
                <p className="text-zinc-500 text-sm mt-1">
                  Explore the technology powered by computer vision to track reps and correct biomechanics.
                </p>
              </div>

              <div className="flex gap-2 p-1 bg-black/40 rounded-xl border border-white/5">
                <button
                  onClick={() => setActiveTab("coach")}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 ${
                    activeTab === "coach"
                      ? "bg-[#00FF9C] text-black font-bold shadow-md shadow-[#00FF9C]/20"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <Bot className="w-4 h-4" />
                  AI Trainer
                </button>
                <button
                  onClick={() => setActiveTab("logger")}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 ${
                    activeTab === "logger"
                      ? "bg-[#00FF9C] text-black font-bold shadow-md shadow-[#00FF9C]/20"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <Dumbbell className="w-4 h-4" />
                  Rep Tracker
                </button>
                <button
                  onClick={() => setActiveTab("camera")}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 ${
                    activeTab === "camera"
                      ? "bg-[#00FF9C] text-black font-bold shadow-md shadow-[#00FF9C]/20"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  Pose Camera
                </button>
              </div>

              {/* Tab Contents */}
              <div className="min-h-[220px] bg-black/30 border border-white/5 rounded-2xl p-4 flex flex-col justify-between">
                {activeTab === "coach" && (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-[#00FF9C]/10 border border-[#00FF9C]/20 text-[#00FF9C]">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-semibold">AI Coach Simulator</h4>
                        <p className="text-xs text-zinc-500">Ask a question to see how the coach builds your fitness plan.</p>
                      </div>
                    </div>

                    <form onSubmit={handleGoalSubmit} className="flex gap-2">
                      <Input
                        placeholder="e.g. I want to prepare for deadlifts..."
                        value={userGoal}
                        onChange={(e) => setUserGoal(e.target.value)}
                        className="bg-black/50 border-white/10 text-white rounded-xl placeholder:text-zinc-600 focus-visible:ring-emerald-500 text-xs"
                      />
                      <Button 
                        type="submit" 
                        disabled={isGeneratingResponse}
                        className="bg-[#00FF9C] hover:bg-[#00e08b] text-black font-bold text-xs rounded-xl px-4 flex items-center gap-1 shrink-0"
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
                      <div className="p-2 rounded-xl bg-[#00FF9C]/10 border border-[#00FF9C]/20 text-[#00FF9C]">
                        <Dumbbell className="w-4 h-4" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-semibold">Log Your Warmup</h4>
                        <p className="text-xs text-zinc-500">Record compound sets and track your progress live.</p>
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
                              <span className="w-8 font-bold text-center text-[#00FF9C]">{idx + 1}</span>
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
                      <div className="p-2 rounded-xl bg-[#00FF9C]/10 border border-[#00FF9C]/20 text-[#00FF9C]">
                        <Camera className="w-4 h-4" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-semibold">AI Rep Detector</h4>
                        <p className="text-xs text-zinc-500">Track squats and pushups automatically using pose nodes detection.</p>
                      </div>
                    </div>

                    <div className="relative h-[110px] bg-black/50 border border-white/10 rounded-xl overflow-hidden flex items-center justify-center">
                      <div className="absolute inset-0 flex flex-col justify-between p-2">
                        <div className="flex justify-between items-center text-[10px] font-mono text-[#00FF9C]">
                          <span>• SCAN CAMERA PROMPT</span>
                          <span>1080p 30fps</span>
                        </div>
                        <div className="flex justify-between items-end text-[10px] font-mono text-[#00FF9C]">
                          <span>OB SYSTEM: READY</span>
                          <span>SCORE FEED: SYNCED</span>
                        </div>
                      </div>
                      <div className="w-12 h-12 border-2 border-dashed border-[#00FF9C]/40 rounded-full flex items-center justify-center animate-spin">
                        <Target className="w-6 h-6 text-[#00FF9C]/60" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Registration Card OR Display Ticket Pass */}
          <div className="lg:col-span-6">
            <AnimatePresence mode="wait">
              {userRegistration ? (
                /* Glassmorphic Ticket Pass */
                <motion.div 
                  id="ob-fitness-ticket-card"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="bg-gradient-to-br from-[#0e1017] to-[#161a24] border border-[#00FF9C]/30 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden space-y-6 print:border-black print:bg-white print:text-black"
                >
                  {/* Decorative Ticket Corners */}
                  <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-[#0a0a0a] rounded-full border-r border-[#00FF9C]/20 print:hidden" />
                  <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-[#0a0a0a] rounded-full border-l border-[#00FF9C]/20 print:hidden" />
                  
                  {/* Header */}
                  <div className="flex justify-between items-start border-b border-white/10 pb-4 print:border-zinc-200">
                    <div>
                      <div className="text-[10px] font-bold text-[#00FF9C] tracking-widest uppercase">OB FITNESS ENTRY PASS</div>
                      <h3 className="text-xl font-black mt-1">CHALLENGE TICKET</h3>
                    </div>
                    <div className="px-3 py-1 rounded-full bg-[#00FF9C]/10 border border-[#00FF9C]/20 text-[#00FF9C] text-xs font-bold uppercase tracking-wider flex items-center gap-1 print:border-black">
                      <CheckCircle className="w-3 h-3" />
                      Confirmed
                    </div>
                  </div>

                  {/* Body Info & QR */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    <div className="md:col-span-7 space-y-4">
                      <div>
                        <span className="text-[10px] text-zinc-500 block uppercase font-bold">Attendee Name</span>
                        <span className="text-base font-extrabold text-white print:text-black">{userRegistration.full_name}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-[10px] text-zinc-500 block uppercase font-bold">Department</span>
                          <span className="text-sm font-semibold text-zinc-300 print:text-black">{userRegistration.department}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-500 block uppercase font-bold">Category</span>
                          <span className="text-sm font-semibold text-[#00FF9C] print:text-black capitalize">{userRegistration.challenge_type}</span>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-zinc-500 block uppercase font-bold">Ticket ID</span>
                        <span className="text-[10px] font-mono text-zinc-400 break-all select-all print:text-black">{userRegistration.id}</span>
                      </div>
                    </div>

                    {/* QR Code Container */}
                    <div className="md:col-span-5 flex flex-col items-center justify-center p-3 bg-white/5 border border-white/10 rounded-2xl print:bg-white print:border-zinc-200 shadow-inner">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150&color=00FF9C&bgcolor=0e1017&data=${encodeURIComponent(userRegistration.id)}`}
                        alt="Registration QR Code Pass" 
                        className="w-32 h-32 object-contain"
                      />
                      <span className="text-[9px] text-zinc-500 mt-2 tracking-wide text-center">Scan at the gym booth</span>
                    </div>
                  </div>

                  {/* Actions & Footer */}
                  <div className="border-t border-white/10 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
                    <div className="text-left">
                      <span className="text-[9px] text-zinc-400 block font-semibold">Your Current Logged Score:</span>
                      <span className="text-lg font-black text-white flex items-center gap-1.5">
                        <Award className="w-5 h-5 text-amber-400" />
                        {userRegistration.score > 0 ? `${userRegistration.score} Verified` : "No Verified Score"}
                      </span>
                    </div>
                    
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button
                        onClick={handlePrintTicket}
                        className="flex-1 sm:flex-initial bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl"
                      >
                        Print Pass
                      </Button>
                      <Button
                        onClick={() => {
                          setUserRegistration(null);
                        }}
                        className="flex-1 sm:flex-initial bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs rounded-xl"
                      >
                        New Register
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                /* Registration Form */
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="bg-[#111111]/85 backdrop-blur-md border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6"
                >
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold">Register to Compete</h2>
                    <p className="text-zinc-500 text-xs leading-normal">
                      {currentUser ? "Link your profile and sign up for the event challenge in one click." : "Create your SmartFit account and register for the competition."}
                    </p>
                  </div>

                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs text-zinc-400 font-semibold">Full Name</label>
                      <Input
                        required
                        disabled={currentUser !== null}
                        placeholder="e.g. John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="bg-black/50 border-white/10 text-white rounded-xl placeholder:text-zinc-700 focus-visible:ring-emerald-500 text-sm h-11 disabled:opacity-75"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs text-zinc-400 font-semibold">Email Address</label>
                      <Input
                        required
                        type="email"
                        disabled={currentUser !== null}
                        placeholder="e.g. john.doe@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-black/50 border-white/10 text-white rounded-xl placeholder:text-zinc-700 focus-visible:ring-emerald-500 text-sm h-11 disabled:opacity-75"
                      />
                    </div>

                    {!currentUser && (
                      <div className="space-y-1.5">
                        <label className="text-xs text-zinc-400 font-semibold">Password (for your app account)</label>
                        <Input
                          required
                          type="password"
                          placeholder="Min 6 characters"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="bg-black/50 border-white/10 text-white rounded-xl placeholder:text-zinc-700 focus-visible:ring-emerald-500 text-sm h-11"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs text-zinc-400 font-semibold">Dept / Location</label>
                        <Input
                          placeholder="e.g. Medchal"
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                          className="bg-black/50 border-white/10 text-white rounded-xl placeholder:text-zinc-700 focus-visible:ring-emerald-500 text-sm h-11"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs text-zinc-400 font-semibold">Phone Number</label>
                        <Input
                          type="tel"
                          placeholder="e.g. 9876543210"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="bg-black/50 border-white/10 text-white rounded-xl placeholder:text-zinc-700 focus-visible:ring-emerald-500 text-sm h-11"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs text-zinc-400 font-semibold">Age (Optional)</label>
                        <Input
                          type="number"
                          placeholder="e.g. 21"
                          value={age}
                          onChange={(e) => setAge(e.target.value)}
                          className="bg-black/50 border-white/10 text-white rounded-xl placeholder:text-zinc-700 focus-visible:ring-emerald-500 text-sm h-11"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs text-zinc-400 font-semibold">Weight in kg (Optional)</label>
                        <Input
                          type="number"
                          placeholder="e.g. 75"
                          value={weight}
                          onChange={(e) => setWeight(e.target.value)}
                          className="bg-black/50 border-white/10 text-white rounded-xl placeholder:text-zinc-700 focus-visible:ring-emerald-500 text-sm h-11"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs text-zinc-400 font-semibold">Select Challenge Category</label>
                      <select
                        value={challengeType}
                        onChange={(e) => setChallengeType(e.target.value)}
                        className="w-full bg-black border border-white/10 text-white rounded-xl px-3 h-11 focus:outline-none focus:border-[#00FF9C] text-sm"
                      >
                        <option value="pullups">Max Pull-ups in 60 seconds 💪</option>
                        <option value="deadlifts">Max Deadlift Weight (1-Rep Max) 🏋️</option>
                        <option value="benchpress">Max Bench Press Weight (1-Rep Max) 🏋️</option>
                      </select>
                    </div>

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-[#00FF9C] hover:bg-[#00e08b] text-black font-extrabold h-11 rounded-xl flex items-center justify-center gap-1 shadow-lg shadow-[#00FF9C]/25 text-sm"
                    >
                      {isLoading ? "Processing..." : currentUser ? "Register Spot" : "Register & Sign Up"}
                      <Zap className="w-4 h-4" />
                    </Button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>

        {/* --- Admin Verification Scanner Portal --- */}
        {isAdmin && (
          <div className="bg-gradient-to-br from-[#0c0d12] to-[#121620] border-2 border-red-500/25 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 print:hidden">
            <div className="flex items-center justify-between border-b border-red-500/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Event Admin Scanner</h2>
                  <p className="text-zinc-500 text-xs mt-0.5">Logged in as {currentUser?.email}. Verify registrations and log participant scores.</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-black uppercase tracking-widest">
                Admin Mode
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Admin side: Scanner controls */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Mode Selectors */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Camera Scanner Viewport */}
                  <div className="bg-black/45 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center space-y-4">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Webcam Scanner</span>
                    
                    {isCameraActive ? (
                      <div className="space-y-3 w-full">
                        <div className="relative aspect-video rounded-xl bg-zinc-900 border border-red-500/30 overflow-hidden flex items-center justify-center shadow-inner">
                          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                          <div className="absolute inset-0 flex flex-col justify-between p-3 border-2 border-red-500/20 rounded-xl">
                            <div className="flex justify-between items-center text-[9px] text-[#00FF9C] font-mono">
                              <span>• SCANNING ACTIVE</span>
                              <span className="animate-pulse">REC ●</span>
                            </div>
                            {/* Scanning horizontal neon laser line */}
                            <div className="w-full h-0.5 bg-[#00FF9C] shadow-[0_0_10px_#00FF9C] animate-bounce" />
                            <div className="text-center text-[9px] text-zinc-400 font-mono">Center QR in viewfinder</div>
                          </div>
                        </div>
                        <Button 
                          onClick={stopCameraScanner}
                          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl"
                        >
                          Stop Scanner
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={startCameraScanner}
                        className="bg-white/5 hover:bg-white/10 text-white font-bold text-xs rounded-xl px-6 py-4 flex items-center gap-2 border border-white/10 w-full justify-center"
                      >
                        <Video className="w-4 h-4 text-emerald-400" />
                        Start Webcam Scanner
                      </Button>
                    )}
                  </div>

                  {/* Drag-drop & Upload simulation */}
                  <div className="bg-black/45 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center space-y-4">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Upload QR Image</span>
                    <label className="w-full">
                      <div className="border border-dashed border-white/10 hover:border-red-500/30 bg-white/5 p-4 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors text-center">
                        <Upload className="w-8 h-8 text-zinc-500 mb-2" />
                        <span className="text-xs font-semibold text-zinc-300">Select ticket QR photo</span>
                        <span className="text-[10px] text-zinc-600 mt-1">Upload pass to auto-detect</span>
                      </div>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageUpload} 
                        className="hidden" 
                      />
                    </label>
                  </div>
                </div>

                {/* Manual Ticket ID Entry */}
                <div className="bg-black/30 border border-white/5 rounded-2xl p-4 space-y-3">
                  <label className="text-xs font-bold text-zinc-400 block uppercase tracking-wider">Manual Ticket ID Entry</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <Input
                        placeholder="Paste unique ticket UUID..."
                        value={adminSearchId}
                        onChange={(e) => setAdminSearchId(e.target.value)}
                        className="bg-black border-white/10 text-white pl-9 rounded-xl text-xs placeholder:text-zinc-600 focus-visible:ring-red-500 h-10"
                      />
                    </div>
                    <Button
                      onClick={() => handleAdminSearch()}
                      disabled={isSearchingAdmin}
                      className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl px-5 h-10"
                    >
                      {isSearchingAdmin ? "Checking..." : "Verify Pass"}
                    </Button>
                  </div>
                </div>

              </div>

              {/* Right Admin side: Ticket verification details and score logging */}
              <div className="lg:col-span-5">
                <AnimatePresence mode="wait">
                  {scannedRegistration ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      className="bg-black/50 border border-red-500/20 rounded-2xl p-5 space-y-5"
                    >
                      <div className="border-b border-white/10 pb-3 flex justify-between items-center">
                        <span className="text-xs font-bold text-[#00FF9C] uppercase tracking-wider">Verified Ticket Info</span>
                        <Button 
                          variant="ghost" 
                          onClick={() => {
                            setScannedRegistration(null);
                            setAdminSearchId("");
                          }}
                          className="h-6 px-2 text-zinc-500 hover:text-white text-xs"
                        >
                          Clear
                        </Button>
                      </div>

                      <div className="space-y-3 text-xs">
                        <div>
                          <span className="text-zinc-500 block uppercase text-[10px] font-bold">Full Name</span>
                          <span className="text-sm font-extrabold text-white">{scannedRegistration.full_name}</span>
                        </div>
                        <div>
                          <span className="text-zinc-500 block uppercase text-[10px] font-bold">Email & Phone</span>
                          <span className="text-zinc-300 block">{scannedRegistration.email}</span>
                          <span className="text-zinc-400 block font-mono text-[10px]">{scannedRegistration.phone || "No phone"}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-zinc-500 block uppercase text-[10px] font-bold">Challenge Category</span>
                            <span className="text-xs font-extrabold text-[#00FF9C] capitalize">{scannedRegistration.challenge_type}</span>
                          </div>
                          <div>
                            <span className="text-zinc-500 block uppercase text-[10px] font-bold">Dept / Location</span>
                            <span className="text-xs font-bold text-zinc-300">{scannedRegistration.department}</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-3">
                          <div>
                            <span className="text-zinc-500 block uppercase text-[10px] font-bold">Age</span>
                            <span className="text-zinc-300 font-bold">{scannedRegistration.age || "N/A"} yrs</span>
                          </div>
                          <div>
                            <span className="text-zinc-500 block uppercase text-[10px] font-bold">Weight</span>
                            <span className="text-zinc-300 font-bold">{scannedRegistration.weight || "N/A"} kg</span>
                          </div>
                        </div>
                      </div>

                      {/* Score Logging Form */}
                      <form onSubmit={handleScoreUpdate} className="border-t border-white/10 pt-4 space-y-3">
                        <label className="text-xs font-bold text-zinc-400 block uppercase tracking-wider">Log Verified Score</label>
                        <div className="flex gap-2">
                          <Input
                            required
                            type="number"
                            placeholder="Enter score (e.g. reps or seconds)"
                            value={adminScore}
                            onChange={(e) => setAdminScore(e.target.value)}
                            className="bg-black border-white/10 text-white rounded-xl text-sm focus-visible:ring-[#00FF9C] h-11"
                          />
                          <Button
                            type="submit"
                            disabled={isSubmittingScore}
                            className="bg-[#00FF9C] hover:bg-[#00e08b] text-black font-extrabold px-6 rounded-xl shrink-0 h-11 shadow-lg shadow-[#00FF9C]/20"
                          >
                            {isSubmittingScore ? "Saving..." : "Log Score"}
                          </Button>
                        </div>
                      </form>
                    </motion.div>
                  ) : (
                    <div className="bg-black/20 border border-white/5 rounded-2xl p-8 text-center text-zinc-600 text-xs">
                      No ticket currently loaded. Scan a QR code or search a Ticket ID to load participant details.
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        )}

        {/* --- Live Event Leaderboard Section --- */}
        <div className="bg-[#111111]/85 border border-white/5 rounded-3xl p-6 md:p-8 backdrop-blur-md shadow-2xl space-y-6 print:hidden">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/5 pb-4 gap-4">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Award className="w-6 h-6 text-[#00FF9C]" />
                OB Fitness Live Leaderboard
              </h2>
              <p className="text-zinc-500 text-xs mt-1">Real-time checked-in rankings of verified scores logged by gym admins.</p>
            </div>
            
            <Button
              onClick={fetchLeaderboard}
              disabled={isLeaderboardLoading}
              className="bg-white/5 hover:bg-white/10 text-white border border-white/10 text-xs font-bold rounded-xl flex items-center gap-1.5 self-end sm:self-auto h-9"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLeaderboardLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          {/* Category Selector Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {[
              { id: "pullups", label: "Pull-ups (Reps) 💪" },
              { id: "deadlifts", label: "Deadlifts (1RM kg) 🏋️" },
              { id: "benchpress", label: "Bench Press (1RM kg) 🏋️" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setLeaderboardTab(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                  leaderboardTab === tab.id
                    ? "bg-[#00FF9C]/15 border-[#00FF9C] text-[#00FF9C] shadow-[0_0_15px_rgba(0,255,156,0.15)]"
                    : "bg-white/5 border-white/10 text-zinc-400 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Leaderboard Rankings List */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {isLeaderboardLoading && leaderboard.length === 0 ? (
              <div className="text-center py-12 text-zinc-500 text-xs flex flex-col items-center justify-center gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-zinc-400" />
                <span>Loading latest scores...</span>
              </div>
            ) : filteredLeaderboard.length === 0 ? (
              <div className="text-center py-12 text-zinc-600 text-xs bg-black/20 border border-white/5 rounded-2xl italic">
                No verified scores logged for this category yet. Scan and log scores to rank!
              </div>
            ) : (
              filteredLeaderboard.map((reg, index) => {
                const isGold = index === 0;
                const isSilver = index === 1;
                const isBronze = index === 2;

                return (
                  <motion.div
                    key={reg.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                      reg.user_id === currentUser?.id
                        ? "bg-[#00FF9C]/10 border-[#00FF9C]/40 text-white"
                        : "bg-black/35 border-white/5 hover:border-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Rank Indicator */}
                      <div className={`w-8 h-8 rounded-xl font-bold flex items-center justify-center text-sm ${
                        isGold ? "bg-amber-400/20 text-amber-400 border border-amber-400/30" :
                        isSilver ? "bg-zinc-300/20 text-zinc-300 border border-zinc-300/30" :
                        isBronze ? "bg-amber-700/20 text-amber-600 border border-amber-700/30" :
                        "bg-white/5 text-zinc-500 border border-white/5"
                      }`}>
                        {index + 1}
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-sm text-white">{reg.full_name}</span>
                          {reg.user_id === currentUser?.id && (
                            <span className="text-[9px] bg-[#00FF9C] text-black font-extrabold px-1.5 py-0.5 rounded-md uppercase">You</span>
                          )}
                        </div>
                        <div className="text-[10px] text-zinc-500 font-semibold uppercase mt-0.5">
                          {reg.department || "General"}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-base font-black text-white">
                        {reg.score}
                      </span>
                      <span className="text-[9px] text-zinc-500 block uppercase font-bold tracking-wider">
                        {leaderboardTab === "pullups" ? "Reps" : "kg"}
                      </span>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
