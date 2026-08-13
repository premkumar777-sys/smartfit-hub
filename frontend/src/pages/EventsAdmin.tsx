import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import jsQR from "jsqr";
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
  RefreshCw,
  Video,
  Upload,
  Search,
  UserCheck,
  CheckCircle,
  Award
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
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [password, setPassword] = useState("");
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // QR Check-in states
  const [adminSearchId, setAdminSearchId] = useState("");
  const [scannedRegistration, setScannedRegistration] = useState<Registration | null>(null);
  const [isSearchingAdmin, setIsSearchingAdmin] = useState(false);
  const [adminScore, setAdminScore] = useState("");
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);

  // Camera states
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isScanningRef = useRef(false);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Search Ticket ID manually or from scanner
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

  // Submit/Update score for scanned registration
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

      // Refresh list
      fetchRegistrations();

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

  // Webcam Scanner
  const startCameraScanner = async () => {
    setIsCameraActive(true);
    isScanningRef.current = true;
    try {
      const constraints = { video: { facingMode: "environment" } };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise<void>((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => resolve();
          } else {
            resolve();
          }
        });
        videoRef.current.play().catch(() => {});
      }

      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d", { willReadFrequently: true });

      const scanFrame = () => {
        if (!videoRef.current || !streamRef.current || !isScanningRef.current) {
          return;
        }

        const video = videoRef.current;
        if (video.readyState === video.HAVE_ENOUGH_DATA && context) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });

          if (code && code.data) {
            const scannedValue = code.data;
            stopCameraScanner();
            setAdminSearchId(scannedValue);
            handleAdminSearch(scannedValue);
            return;
          }
        }
        requestAnimationFrame(scanFrame);
      };

      requestAnimationFrame(scanFrame);
      
    } catch (err) {
      console.warn("Failed to get webcam stream:", err);
      toast({
        title: "Camera Access Error",
        description: "Could not open camera. Please use manual entry or file upload instead.",
        variant: "destructive",
      });
      setIsCameraActive(false);
      isScanningRef.current = false;
    }
  };

  const stopCameraScanner = () => {
    setIsCameraActive(false);
    isScanningRef.current = false;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Scan uploaded image
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsSearchingAdmin(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (context) {
          canvas.width = img.width;
          canvas.height = img.height;
          context.drawImage(img, 0, 0);
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code && code.data) {
            const scannedValue = code.data;
            setAdminSearchId(scannedValue);
            handleAdminSearch(scannedValue);
          } else {
            toast({
              title: "QR Code Not Found",
              description: "Could not detect a valid QR code in the uploaded image. Please try another photo or enter the Ticket ID manually.",
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Scan Error",
            description: "Failed to process image.",
            variant: "destructive",
          });
        }
        setIsSearchingAdmin(false);
      };
      img.onerror = () => {
        toast({
          title: "Image Load Error",
          description: "Failed to load the image file.",
          variant: "destructive",
        });
        setIsSearchingAdmin(false);
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      toast({
        title: "File Read Error",
        description: "Failed to read the file.",
        variant: "destructive",
      });
      setIsSearchingAdmin(false);
    };
    reader.readAsDataURL(file);
  };

  // Check auth on load
  useEffect(() => {
    const checkAdminAuth = async () => {
      const isAuth = sessionStorage.getItem("events_admin_auth") === "true";
      if (isAuth) {
        setIsAdmin(true);
        fetchRegistrations();
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && user.email === "eslavathpremkumar17@gmail.com") {
          setIsAdmin(true);
          sessionStorage.setItem("events_admin_auth", "true");
          fetchRegistrations();
          toast({
            title: "Access Granted",
            description: "Welcome, Admin eslavathpremkumar17@gmail.com!",
          });
          return;
        }
      } catch (err) {
        console.error("Error checking admin auth:", err);
      }

      setIsLoading(false);
    };

    checkAdminAuth();
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

  const handleLogout = async () => {
    stopCameraScanner();
    setIsAdmin(false);
    sessionStorage.removeItem("events_admin_auth");
    try {
      await supabase.auth.signOut();
      toast({
        title: "Logged Out",
        description: "You have signed out and locked the admin panel.",
      });
    } catch (err) {
      console.error("Error signing out:", err);
    }
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
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-white text-center" style={{ paddingTop: 'calc(var(--header-height) + 1rem)' }}>
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

          <div className="relative flex items-center justify-center my-4">
            <div className="border-t border-white/10 w-full" />
            <span className="absolute bg-[#111111] px-3 text-xs text-zinc-500">OR</span>
          </div>

          <Button
            onClick={() => {
              navigate("/auth", { state: { returnUrl: window.location.pathname } });
            }}
            variant="outline"
            className="w-full border-white/10 text-white hover:bg-white/5 rounded-xl h-11 flex items-center justify-center gap-2 text-sm"
          >
            <Users className="w-4 h-4 text-[#00FF9C]" />
            Sign in with SmartFit Account
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-12 px-4 md:px-8" style={{ paddingTop: 'calc(var(--header-height) + 1.5rem)' }}>
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

        {/* --- Admin Verification Scanner Portal --- */}
        <div className="bg-gradient-to-br from-[#0c0d12] to-[#121620] border-2 border-red-500/25 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-red-500/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                <UserCheck className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">QR Code Check-in & Verification</h2>
                <p className="text-zinc-500 text-xs mt-0.5">Verify participant tickets using live camera, photo upload, or ID search.</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-black uppercase tracking-widest">
              Live Scanner
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Side: Scanner controls */}
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

            {/* Right Side: Ticket verification details and score logging */}
            <div className="lg:col-span-5">
              {scannedRegistration ? (
                <div className="bg-black/50 border border-red-500/20 rounded-2xl p-5 space-y-5">
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
                        <span className="text-xs font-bold text-zinc-300">{scannedRegistration.department || "General"}</span>
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
                        placeholder="Enter score (reps or kg)"
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
                </div>
              ) : (
                <div className="bg-black/20 border border-white/5 rounded-2xl p-8 text-center text-zinc-600 text-xs h-full flex flex-col items-center justify-center min-h-[220px]">
                  No ticket currently loaded. Scan a QR code or search a Ticket ID to load participant details.
                </div>
              )}
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
                        <div className="text-xs text-zinc-500 flex flex-wrap gap-x-3 gap-y-0.5">
                          <span>{reg.email}</span>
                          {reg.phone && <span>• {reg.phone}</span>}
                          {reg.department && <span className="text-zinc-600">• Branch: {reg.department}</span>}
                          {(reg as any).age && <span>• Age: {(reg as any).age}</span>}
                          {(reg as any).weight && <span>• Weight: {(reg as any).weight} kg</span>}
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
