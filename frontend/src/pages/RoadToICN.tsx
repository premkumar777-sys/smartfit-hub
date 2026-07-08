import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy,
    Target,
    Zap,
    Eye,
    Camera,
    Info,
    ChevronRight,
    Sparkles,
    ShieldCheck,
    CheckCircle2,
    ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/Container';
import { ICN_RadarChart } from '@/components/icn/ICN_RadarChart';
import { X_Frame_Overlay } from '@/components/icn/X_Frame_Overlay';
import { Phase_Navigator, ICNPhase } from '@/components/icn/Phase_Navigator';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import icnShield from '@/assets/icn-shield.jpg';

const CountUp = ({ value, duration = 2, decimals = 0 }: { value: number; duration?: number; decimals?: number }) => {
    // ... existing CountUp code ...
    const [displayValue, setDisplayValue] = useState(0);

    useMemo(() => {
        let frame = 0;
        const totalFrames = Math.max(1, duration * 60);
        const endValue = value;

        const update = () => {
            frame++;
            const progress = frame / totalFrames;
            const easeOutQuad = progress * (2 - progress);
            const current = endValue * easeOutQuad;
            setDisplayValue(Number(current.toFixed(decimals)));

            if (frame < totalFrames) {
                requestAnimationFrame(update);
            } else {
                setDisplayValue(endValue);
            }
        };

        requestAnimationFrame(update);
    }, [value, duration, decimals]);

    return <span>{displayValue.toFixed(decimals)}</span>;
};

export default function RoadToICN() {
    const navigate = useNavigate();
    const [currentPhase, setCurrentPhase] = useState<ICNPhase>('reality');
    const [unlockedPhases, setUnlockedPhases] = useState<ICNPhase[]>(['reality']);
    const [showPhaseInfo, setShowPhaseInfo] = useState(false);
    const [checklist, setChecklist] = useState<Record<string, boolean>>({
        tan: false,
        trunks: false,
        flow: false,
        peak: false
    });
    const [scores, setScores] = useState({
        Symmetry: 65,
        Conditioning: 40,
        Muscularity: 55,
        Presence: 30
    });
    const [showOverlay, setShowOverlay] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<{
        balance: number;
        feedback: string;
        points: string[];
    } | null>(null);
    const [aiUpdated, setAiUpdated] = useState<Record<string, boolean>>({});

    // Readiness Formula: Score = (S * 0.3) + (C * 0.3) + (M * 0.2) + (P * 0.2)
    const readinessScore = useMemo(() => {
        return (
            scores.Symmetry * 0.3 +
            scores.Conditioning * 0.3 +
            scores.Muscularity * 0.2 +
            scores.Presence * 0.2
        ).toFixed(1);
    }, [scores]);

    const phaseDetails = useMemo(() => {
        switch (currentPhase) {
            case 'reality':
                return {
                    advice: "You're at the starting line. Focus on your structural baseline. Don't worry about mass yet – objective symmetry is your first hurdle.",
                    detailedInfo: "The ICN journey begins not with a workout, but with an objective mirror. In the Reality Check phase, we strip away the ego and analyze your structural baseline. ICN judges are meticulous about skeletal alignment—even before you add a single gram of stage-ready muscle. This stage requires bi-weekly structural assessments to identify lateral shifts in the pelvic girdle or centerline deviations in the torso. You aren't just training; you're building the 'X-Frame' foundation that will dictate your overall symmetry for the next 12 months.",
                    focus: "Foundation & Symmetry",
                    target: "Baseline Assessment",
                    protocol: [
                        "Bi-weekly structural assessments",
                        "Focus on compound movements",
                        "Establish nutritional baseline",
                    ],
                    tasks: [
                        { id: 'symmetry', label: 'Symmetry Baseline Scan', sub: 'Min. deviation' },
                        { id: 'posture', label: 'Posture Analysis', sub: 'Skeletal alignment' },
                        { id: 'frame', label: 'Frame Density Check', sub: 'Protocol 01' },
                    ],
                    standard: "ICN judges look for an X-frame foundation even in the early stages."
                };
            case 'build':
                return {
                    advice: "Construction time. Emphasize the X-Frame: wide lats, sweeping quads, and a tight midsection. Maintain natural standards.",
                    detailedInfo: "Construction begins now. The 'Build' phase is a controlled high-volume hypertrophy protocol aimed at expanding your structural silhouette. We emphasize the 'Sweep' and 'Width'—wide lats, sweeping quads, and a high, tight midsection. Unlike traditional bodybuilding, ICN standards demand muscular balance and aesthetic flow even during a caloric surplus. Every set is an opportunity to specialize on weak points revealed in Phase 01. Your goal is a gradual, sustainable 0.5% weight gain per week to ensure quality over quantity.",
                    focus: "Hypertrophy & Width",
                    target: "0.5% weight gain / week",
                    protocol: [
                        "High volume training (12-20 sets/muscle)",
                        "Caloric surplus (Natural emphasis)",
                        "Weak point specialization",
                    ],
                    tasks: [
                        { id: 'width', label: 'Lat Width Target', sub: 'Expansion Scan' },
                        { id: 'sweep', label: 'Quad Sweep Assessment', sub: 'Outer Head' },
                        { id: 'core', label: 'Midsection Tightness', sub: 'Vacuum Practice' },
                    ],
                    standard: "Muscular balance must be maintained while adding size."
                };
            case 'lean':
                return {
                    advice: "The cut begins. We need to see muscular separation. Move from 'Cloudy' to 'Stage Lean.' Discipline is your only teammate now.",
                    detailedInfo: "This is where the 'Stage-Ready' look is forged. We move from mass to density and separation. The 'Deep Lean' phase is a clinical execution of body fat reduction, targeting the 8-12% range. Discipline is your only teammate here. We transition from simple movements to density-focused training and isometric posing holds. Judges look for 'Deep Cuts' and striations that only appear when conditioning reaches elite standards. Every calorie is tracked, and every step (NEAT) is a deliberate move towards the podium.",
                    focus: "Density & Separation",
                    target: "8-12% Body Fat",
                    protocol: [
                        "Gradual caloric deficit",
                        "Increased NEAT (Step goals)",
                        "Practice 'holding' poses for 30s",
                    ],
                    tasks: [
                        { id: 'separation', label: 'Striation Detection', sub: 'Scan 03' },
                        { id: 'vasc', label: 'Vascularity Review', sub: 'Bloodflow Scan' },
                        { id: 'abs', label: 'Abdominal Definition', sub: 'Deep Cuts' },
                    ],
                    standard: "Definition wins shows. We need to see the deep cuts."
                };
            case 'posing':
                return {
                    advice: "Showmanship is half the battle. Every muscle must be presented with intent. Perfection in transitions is what wins trophies.",
                    detailedInfo: "Showmanship is 50% of the victory. A world-class physique can lose to an inferior one if the presentation is flawed. In the 'Art of Posing' phase, we refine your stage walk, transitions, and mandatory posing holds. You will practice 'holding' elite poses for up to 60 seconds with 100% intensity and zero shaking. This phase includes the 'Peak Week' protocol where electrolyte and fluid balance are manipulated to ensure you hit the stage in a 'Dry' and 'Vascular' state. Every transition must be seamless, fluid, and intent-driven.",
                    focus: "Presentation & Flow",
                    target: "Stage Ready",
                    protocol: [
                        "Dailly posing (45 mins)",
                        "Peak week electrolyte balance",
                        "Stage walk refinement",
                    ],
                    tasks: [
                        { id: 'tan', label: 'Competition Base Tan', sub: 'Elite Shade 04' },
                        { id: 'trunks', label: 'ICN Registered Trunks', sub: 'Mandatory' },
                        { id: 'walk', label: 'Stage Walk Mastery', sub: 'Presence' },
                    ],
                    standard: "Transitions should be seamless and fluid. Keep the core tight."
                };
        }
    }, [currentPhase]);

    const handleScoreChange = (metric: keyof typeof scores, value: number[]) => {
        setScores(prev => ({ ...prev, [metric]: value[0] }));
        setAiUpdated(prev => ({ ...prev, [metric]: false }));
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setPreviewImage(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleScan = () => {
        if (!previewImage) return;
        setIsScanning(true);
        setAnalysisResult(null);

        // Simulate scanning delay
        setTimeout(() => {
            setIsScanning(false);
            const balanceScore = Math.floor(65 + Math.random() * 25);

            // AI guestimates based on phase and "image analysis"
            const conditioningScore = currentPhase === 'lean' ? Math.floor(75 + Math.random() * 15) : Math.floor(40 + Math.random() * 30);
            const muscularityScore = currentPhase === 'build' ? Math.floor(70 + Math.random() * 20) : Math.floor(50 + Math.random() * 25);

            setScores({
                Symmetry: balanceScore,
                Conditioning: conditioningScore,
                Muscularity: muscularityScore,
                Presence: scores.Presence // Presence remains manual for stagecraft
            });

            setAiUpdated({
                Symmetry: true,
                Conditioning: true,
                Muscularity: true
            });

            setAnalysisResult({
                balance: balanceScore,
                feedback: balanceScore > 80
                    ? "Excellent structural balance. High skeletal alignment noted."
                    : "Minor lateral shift detected in the pelvic-girdle. Focus on unilateral stabilization.",
                points: [
                    "Bilateral Delt Elevation: Correct",
                    `Upper Torso Symmetry: ${balanceScore}%`,
                    "Centerline Deviation: 2.1mm",
                    "Pelvic Alignment: Adjusted"
                ]
            });
            setShowOverlay(true);
        }, 2500);
    };

    const handleReviewProgress = () => {
        if (!analysisResult) {
            toast.error("DATA VERIFICATION REQUIRED", {
                description: "Judicial Review cannot proceed without analytical proof. Perform a Judge's Eye Scan first.",
                className: "bg-[#050505] border border-red-500/50 text-red-500 font-sans",
            });
            return;
        }

        const currentTasks = phaseDetails?.tasks || [];
        const completedCount = currentTasks.filter(task => checklist[task.id]).length;
        const totalCount = currentTasks.length;
        const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

        let message = "";
        let description = "";

        if (progress === 100) {
            message = "STAGE READY: ELITE STATUS";
            description = `The Judges have reviewed your ${currentPhase} prep. You are structurally optimized for the next stage.`;

            // Sequential Unlocking Logic
            const phaseSequence: ICNPhase[] = ['reality', 'build', 'lean', 'posing'];
            const currentIndex = phaseSequence.indexOf(currentPhase);
            if (currentIndex < phaseSequence.length - 1) {
                const nextPhase = phaseSequence[currentIndex + 1];
                if (!unlockedPhases.includes(nextPhase)) {
                    setUnlockedPhases(prev => [...prev, nextPhase]);
                    toast.success("NEW PHASE UNLOCKED", {
                        description: `You have successfully completed the ${currentPhase} protocols. ${nextPhase.toUpperCase()} is now accessible.`,
                        className: "bg-gold border border-black text-black font-sans font-bold",
                    });
                }
            }
        } else if (progress >= 50) {
            message = "ELITE CONTENDER IN PROGRESS";
            description = "Solid fundamentals. Your presenting protocols are taking shape. Focus on the remaining fine-tuning.";
        } else {
            message = "PREP ADVISORY: ACTION REQUIRED";
            description = "Your adherence to stage protocols is currently below elite standards. Execute the remaining checklist items.";
        }

        toast(message, {
            description: description,
            className: "bg-[#050505] border border-gold/30 text-white font-sans",
        });
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white pt-24 pb-12 font-sans overflow-x-hidden relative">
            {/* Background Image - Refined Placement */}
            <div className="fixed top-0 right-0 w-[55%] h-full pointer-events-none z-0 overflow-hidden translate-x-[5%]">
                <div
                    className="absolute inset-0 bg-contain bg-no-repeat bg-center opacity-[100]"
                    style={{ backgroundImage: `url(${icnShield})` }}
                />
                {/* Fade edges to blend */}
                <div className="absolute inset-0 bg-gradient-to-l from-transparent via-[#050505]/60 to-[#050505]" />
                <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-transparent to-[#050505]" />
            </div>

            <Container className="relative z-10">
                {/* Back Button */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="mb-8"
                >
                    <button
                        onClick={() => navigate(-1)}
                        className="group flex items-center gap-2 px-4 py-2 rounded-full border border-gold/30 bg-gold/5 hover:bg-gold/10 transition-all duration-300"
                    >
                        <ArrowLeft className="w-4 h-4 text-gold group-hover:-translate-x-1 transition-transform" />
                        <span className="text-gold font-black uppercase tracking-[0.2em] text-[10px]">Return to Hub</span>
                    </button>
                </motion.div>

                {/* Header Section */}
                <div className="relative mb-12">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-3 mb-4"
                    >
                        <div className="p-2 rounded bg-gold/10 border border-gold/30">
                            <Trophy className="w-5 h-5 text-gold" />
                        </div>
                        <span className="text-gold font-black uppercase tracking-[0.3em] text-xs">Road to ICN Elite</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl md:text-7xl font-black mb-6 leading-none text-white/90"
                    >
                        THE <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold/60 via-gold/40 to-white/20 drop-shadow-[0_0_15px_rgba(212,175,55,0.2)]">EVOLUTION</span> <br /> OF AN ATHLETE
                    </motion.h1>

                    <p className="max-w-2xl text-white/40 text-lg leading-relaxed">
                        Transition from the 'Common Man' to a 'Stage-Ready Competitor'. Use the ICN Judge's Eye to analyze your symmetry and structural balance.
                    </p>
                </div>

                {/* Phase Navigator */}
                <div className="mb-20">
                    <Phase_Navigator
                        currentPhase={currentPhase}
                        unlockedPhases={unlockedPhases}
                        onPhaseChange={(phase) => {
                            setCurrentPhase(phase);
                            setAnalysisResult(null);
                        }}
                        onReadMore={() => setShowPhaseInfo(true)}
                    />
                </div>

                <div className="grid lg:grid-cols-3 gap-8 items-start">
                    {/* Left Column: Metrics & Radar */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl p-8">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <ShieldCheck className="w-5 h-5 text-blue-400" />
                                    Judge's Scorecard
                                </h3>
                                <div className={`px-3 py-1 rounded-full border text-[10px] font-black tracking-widest uppercase flex items-center gap-2 transition-colors duration-500 ${isScanning
                                    ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500'
                                    : 'bg-green-500/10 border-green-500/30 text-green-500'}`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${isScanning ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`} />
                                    {isScanning ? 'Analyzing' : 'Live Mode'}
                                </div>
                            </div>

                            <div className="relative">
                                <ICN_RadarChart data={isScanning ? {
                                    Symmetry: scores.Symmetry + (Math.random() * 5 - 2.5),
                                    Conditioning: scores.Conditioning + (Math.random() * 5 - 2.5),
                                    Muscularity: scores.Muscularity + (Math.random() * 5 - 2.5),
                                    Presence: scores.Presence
                                } : scores} />
                                {isScanning && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px] rounded-2xl">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="flex gap-1">
                                                {[1, 2, 3].map(i => (
                                                    <motion.div
                                                        key={i}
                                                        animate={{ height: [4, 12, 4] }}
                                                        transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                                                        className="w-1 bg-gold rounded-full"
                                                    />
                                                ))}
                                            </div>
                                            <span className="text-[8px] font-black text-gold uppercase tracking-[0.2em] animate-pulse">Syncing Telemetry</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="mt-12 space-y-8">
                                {/* Symmetry Slider */}
                                <div className="space-y-4">
                                    <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                                        <div className="flex items-center gap-2">
                                            <span>Structural Symmetry</span>
                                            {aiUpdated.Symmetry && (
                                                <motion.span
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    className="text-[8px] px-1.5 py-0.5 bg-gold/20 text-gold border border-gold/30 rounded flex items-center gap-1"
                                                >
                                                    <Sparkles className="w-2 h-2" />
                                                    AI Scanned
                                                </motion.span>
                                            )}
                                        </div>
                                        <span className="text-gold"><CountUp value={scores.Symmetry} duration={1} />%</span>
                                    </div>
                                    <Slider
                                        value={[scores.Symmetry]}
                                        onValueChange={(val) => handleScoreChange('Symmetry', val)}
                                        max={100}
                                        step={1}
                                        className="cursor-pointer"
                                    />
                                </div>

                                {/* Conditioning Slider */}
                                <div className="space-y-4">
                                    <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                                        <div className="flex items-center gap-2">
                                            <span>Muscle Conditioning</span>
                                            {aiUpdated.Conditioning && (
                                                <motion.span
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    className="text-[8px] px-1.5 py-0.5 bg-gold/20 text-gold border border-gold/30 rounded flex items-center gap-1"
                                                >
                                                    <Sparkles className="w-2 h-2" />
                                                    AI Scanned
                                                </motion.span>
                                            )}
                                        </div>
                                        <span className="text-gold"><CountUp value={scores.Conditioning} duration={1} />%</span>
                                    </div>
                                    <Slider
                                        value={[scores.Conditioning]}
                                        onValueChange={(val) => handleScoreChange('Conditioning', val)}
                                        max={100}
                                        step={1}
                                    />
                                    <div className="flex justify-between text-[10px] text-white/30 font-black uppercase tracking-tighter">
                                        <span>Cloudy</span>
                                        <span>Striated</span>
                                        <span>Stage Lean</span>
                                    </div>
                                </div>

                                {/* Muscularity Slider */}
                                <div className="space-y-4">
                                    <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                                        <div className="flex items-center gap-2">
                                            <span>Muscularity</span>
                                            {aiUpdated.Muscularity && (
                                                <motion.span
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    className="text-[8px] px-1.5 py-0.5 bg-gold/20 text-gold border border-gold/30 rounded flex items-center gap-1"
                                                >
                                                    <Sparkles className="w-2 h-2" />
                                                    AI Scanned
                                                </motion.span>
                                            )}
                                        </div>
                                        <span className="text-gold"><CountUp value={scores.Muscularity} duration={1} />%</span>
                                    </div>
                                    <Slider
                                        value={[scores.Muscularity]}
                                        onValueChange={(val) => handleScoreChange('Muscularity', val)}
                                        max={100}
                                        step={1}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Judge's Advice Card */}
                        <div className="bg-gold border border-gold/50 rounded-3xl p-8 text-black">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Info className="w-5 h-5" />
                                    <span className="text-xs font-black uppercase tracking-widest">Judge's Advisory</span>
                                </div>
                                <div className="text-[10px] font-bold px-2 py-0.5 bg-black/10 rounded uppercase">
                                    {phaseDetails.focus}
                                </div>
                            </div>
                            <p className="text-sm font-bold leading-relaxed italic mb-4">
                                "{phaseDetails.advice}"
                            </p>
                            <div className="pt-4 border-t border-black/10">
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Phase Target:</span>
                                <div className="text-xs font-black mt-1">{phaseDetails.target}</div>
                            </div>
                        </div>

                        {/* Daily Athlete Protocol */}
                        <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl p-8">
                            <div className="flex items-center gap-2 mb-6">
                                <Zap className="w-5 h-5 text-blue-400" />
                                <h3 className="text-lg font-bold uppercase tracking-tight">Athlete Protocol</h3>
                            </div>
                            <ul className="space-y-4">
                                {phaseDetails.protocol.map((item, idx) => (
                                    <li key={idx} className="flex items-start gap-3">
                                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400" />
                                        <span className="text-xs text-white/70 font-medium leading-relaxed">{item}</span>
                                    </li>
                                ))}
                            </ul>
                            <div className="mt-8 p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                                <p className="text-[10px] text-blue-300 font-bold leading-tight">
                                    <strong>ICN Standard:</strong> {phaseDetails.standard}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Middle Column: The Judge's Eye (Photo/X-Frame) */}
                    <div className="lg:col-span-1">
                        <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl p-8 h-full">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <Eye className="w-5 h-5 text-gold" />
                                    Judge's Eye
                                </h3>
                                <label className="cursor-pointer flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl border border-white/10 transition-all">
                                    <Camera className="w-4 h-4 text-gold" />
                                    <span className="text-xs font-bold">Upload Pose</span>
                                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                </label>
                            </div>

                            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-black/40 border-2 border-dashed border-white/5 flex items-center justify-center group">
                                {previewImage ? (
                                    <>
                                        <img src={previewImage} className={`w-full h-full object-cover transition-all duration-700 ${isScanning ? 'blur-[2px] opacity-40' : ''}`} alt="Check Pose" />
                                        {showOverlay && <X_Frame_Overlay opacity={0.6} />}

                                        {/* Scanning Animation */}
                                        {isScanning && (
                                            <motion.div
                                                initial={{ top: "0%" }}
                                                animate={{ top: "100%" }}
                                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                                className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gold to-transparent shadow-[0_0_15px_rgba(212,175,55,1)] z-20"
                                            />
                                        )}

                                        {isScanning && (
                                            <div className="absolute inset-0 bg-gold/5 flex items-center justify-center">
                                                <div className="text-[10px] font-black text-gold uppercase tracking-[0.3em] animate-pulse">Analyzing Structure...</div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="text-center p-8 opacity-20 group-hover:opacity-40 transition-opacity">
                                        <Camera className="w-16 h-16 mx-auto mb-4" />
                                        <p className="text-xs font-black uppercase tracking-widest">Front Lat Spread / Relaxed Pose</p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-8 flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40">{isScanning ? "AI Engine Busy" : "Symmetry Overlay"}</span>
                                    <span className="text-xs font-bold">{isScanning ? "Processing Pixels..." : "X-Frame Alignment Guide"}</span>
                                </div>
                                <Button
                                    onClick={handleScan}
                                    disabled={!previewImage || isScanning}
                                    variant={showOverlay ? "default" : "outline"}
                                    className={showOverlay ? "bg-gold text-black hover:bg-gold/80" : "hover:text-gold hover:border-gold/50"}
                                >
                                    {isScanning ? (
                                        <span className="flex items-center gap-2">
                                            <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                            Scanning
                                        </span>
                                    ) : showOverlay ? "Re-Analyze" : "Analyze"}
                                </Button>
                            </div>

                            {/* Automated Analysis Result */}
                            <AnimatePresence>
                                {analysisResult && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mt-6 p-6 rounded-2xl bg-gold/10 border border-gold/20"
                                    >
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-gold">Structural Report</span>
                                            <div className="text-xs font-bold text-white px-2 py-0.5 bg-gold/20 rounded">Dev: 2.1mm</div>
                                        </div>
                                        <div className="space-y-3">
                                            {analysisResult.points.map((pt, i) => (
                                                <div key={i} className="flex items-center justify-between text-[11px] font-medium">
                                                    <span className="text-white/60">{pt.split(':')[0]}</span>
                                                    <span className="text-white font-bold">{pt.split(':')[1]}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-6 pt-4 border-t border-gold/10">
                                            <p className="text-xs text-gold font-bold leading-relaxed italic">
                                                "{analysisResult.feedback}"
                                            </p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Right Column: Readiness Score & Checklist */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl p-4 shadow-xl">
                            <h3 className="text-xl font-black uppercase tracking-tight mb-1">Athlete Status</h3>
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gold mb-6">iCompete Natural</div>

                            <div>
                                <div className="text-[10px] text-white/40 font-black uppercase tracking-widest mb-1">ICN Readiness Score</div>
                                <div className="text-5xl font-black text-white flex items-baseline gap-1">
                                    <CountUp value={parseFloat(readinessScore)} duration={1.5} decimals={1} />
                                    <span className="text-sm text-white/20 font-bold">/100</span>
                                </div>
                            </div>
                        </div>


                        {/* Prep Checklist */}
                        <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl p-6">
                            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-gold" />
                                Readiness Checklist
                            </h3>

                            <div className="space-y-4">
                                {(phaseDetails?.tasks || []).map((item) => (
                                    <label key={item.id} className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10 transition-colors group">
                                        <Checkbox
                                            id={item.id}
                                            className="border-gold data-[state=checked]:bg-gold"
                                            checked={checklist[item.id] || false}
                                            onCheckedChange={(checked) => setChecklist(prev => ({ ...prev, [item.id]: !!checked }))}
                                        />
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold group-hover:text-gold transition-colors">{item.label}</span>
                                            <span className="text-[9px] font-black uppercase text-white/20 tracking-widest">{item.sub}</span>
                                        </div>
                                    </label>
                                ))}
                            </div>

                            <Button
                                onClick={handleReviewProgress}
                                className="w-full mt-8 h-12 bg-white/10 hover:bg-white/20 border-white/20 text-white font-black uppercase tracking-widest text-xs"
                            >
                                Review Prep Progress
                                <ChevronRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </div>
                </div>
            </Container>

            {/* Phase Intel Modal */}
            <AnimatePresence>
                {showPhaseInfo && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8"
                    >
                        {/* Backdrop */}
                        <div
                            className="absolute inset-0 bg-[#050505]/80 backdrop-blur-md"
                            onClick={() => setShowPhaseInfo(false)}
                        />

                        {/* Modal Content */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-2xl bg-[#0a0a0a] border border-gold/20 rounded-[2rem] overflow-hidden shadow-[0_0_50px_rgba(212,175,55,0.1)]"
                        >
                            {/* Header Image/Background */}
                            <div className="h-32 bg-gradient-to-br from-gold/20 to-transparent relative">
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
                                <div className="absolute inset-0 flex items-center justify-center px-8">
                                    <div className="flex flex-col items-center">
                                        <div className="px-3 py-1 rounded bg-gold text-black text-[10px] font-black uppercase tracking-widest mb-2">
                                            Phase Intel Report
                                        </div>
                                        <h2 className="text-3xl font-black uppercase tracking-tighter text-white">
                                            {currentPhase === 'reality' ? 'Phase 01: Reality Check' :
                                                currentPhase === 'build' ? 'Phase 02: Natural Build' :
                                                    currentPhase === 'lean' ? 'Phase 03: Deep Lean' :
                                                        'Phase 04: Art of Posing'}
                                        </h2>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 md:p-12">
                                <div className="grid md:grid-cols-2 gap-8 mb-8">
                                    <div>
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gold mb-2">Strategic Focus</h4>
                                        <p className="text-lg font-bold text-white leading-tight">{phaseDetails?.focus}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gold mb-2">Primary Target</h4>
                                        <p className="text-lg font-bold text-white leading-tight">{phaseDetails?.target}</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gold mb-3">Athletic Briefing</h4>
                                        <p className="text-sm text-white/60 leading-relaxed italic">
                                            "{phaseDetails?.detailedInfo}"
                                        </p>
                                    </div>

                                    <div>
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gold mb-3 text-center">Judicial Standards</h4>
                                        <div className="p-4 rounded-2xl bg-gold/5 border border-gold/10 text-xs text-gold/80 font-medium text-center italic">
                                            {phaseDetails?.standard}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setShowPhaseInfo(false)}
                                    className="w-full mt-10 h-14 rounded-2xl bg-gold text-black font-black uppercase tracking-widest text-xs hover:bg-white transition-colors duration-300"
                                >
                                    Dismiss Briefing
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
}
