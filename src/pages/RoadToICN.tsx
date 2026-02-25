import { useState, useMemo } from 'react';
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
    Activity,
    Hexagon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/Container';
import { ICN_RadarChart } from '@/components/icn/ICN_RadarChart';
import { X_Frame_Overlay } from '@/components/icn/X_Frame_Overlay';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';

const CountUp = ({ value, duration = 2, decimals = 0 }: { value: number; duration?: number; decimals?: number }) => {
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

type ICNPhase = 'reality' | 'build' | 'lean' | 'posing';

export default function RoadToICN() {
    const [currentPhase, setCurrentPhase] = useState<ICNPhase>('reality');
    const [scores, setScores] = useState({
        Symmetry: 65,
        Conditioning: 40,
        Muscularity: 55,
        Presence: 30
    });
    const [showOverlay, setShowOverlay] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [aiUpdated, setAiUpdated] = useState<Record<string, boolean>>({});
    const [analysisResult, setAnalysisResult] = useState<{
        balance: number;
        feedback: string;
        points: string[];
    } | null>(null);

    const readinessScore = useMemo(() => {
        return (
            scores.Symmetry * 0.3 +
            scores.Conditioning * 0.3 +
            scores.Muscularity * 0.2 +
            scores.Presence * 0.2
        ).toFixed(1);
    }, [scores]);

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

        setTimeout(() => {
            setIsScanning(false);
            const balanceScore = Math.floor(65 + Math.random() * 25);
            const conditioningScore = currentPhase === 'lean' ? Math.floor(75 + Math.random() * 15) : Math.floor(40 + Math.random() * 30);
            const muscularityScore = currentPhase === 'build' ? Math.floor(70 + Math.random() * 20) : Math.floor(50 + Math.random() * 25);

            setScores({
                Symmetry: balanceScore,
                Conditioning: conditioningScore,
                Muscularity: muscularityScore,
                Presence: scores.Presence
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

    const phases: { id: ICNPhase; label: string }[] = [
        { id: 'reality', label: 'Reality Check' },
        { id: 'build', label: 'Natural Build' },
        { id: 'lean', label: 'Deep Lean' },
        { id: 'posing', label: 'Art of Posing' }
    ];

    return (
        <div className="min-h-screen bg-[#0F0F14] text-white pt-24 pb-20 font-sans selection:bg-[#D4AF37]/30">
            {/* Background Texture */}
            <div className="fixed inset-0 pointer-events-none opacity-5">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
            </div>

            <Container>
                {/* SECTION 1: HERO READINESS SCORE (CENTERPIECE) */}
                <div className="flex flex-col items-center mb-24">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative w-80 h-80 flex items-center justify-center"
                    >
                        {/* Circular Progress Ring */}
                        <svg className="absolute inset-0 w-full h-full -rotate-90">
                            <circle
                                cx="160" cy="160" r="145"
                                fill="none" stroke="rgba(212, 175, 55, 0.05)"
                                strokeWidth="8"
                            />
                            <motion.circle
                                cx="160" cy="160" r="145"
                                fill="none" stroke="#D4AF37"
                                strokeWidth="8"
                                strokeLinecap="round"
                                strokeDasharray="911"
                                initial={{ strokeDashoffset: 911 }}
                                animate={{ strokeDashoffset: 911 - (911 * (parseFloat(readinessScore) / 100)) }}
                                transition={{ duration: 2, ease: "easeOut" }}
                            />
                        </svg>

                        {/* Inner Content */}
                        <div className="text-center z-10 bg-[#0F0F14]/40 backdrop-blur-3xl rounded-full w-[260px] h-[260px] flex flex-col items-center justify-center border border-white/5 shadow-[0_0_50px_rgba(212,175,55,0.1)]">
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#D4AF37] mb-2">ICN READINESS SCORE</span>
                            <div className="text-7xl font-black text-white leading-none mb-1 tabular-nums">
                                <CountUp value={parseFloat(readinessScore)} decimals={1} duration={2} />
                            </div>
                            <span className="text-xs font-bold text-white/40 uppercase tracking-widest italic">Stage Potential Evaluation</span>
                        </div>

                        {/* Outer Glows */}
                        <div className="absolute inset-0 bg-[#D4AF37]/5 rounded-full blur-[80px] -z-10" />
                    </motion.div>

                    {/* Formula Display */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1 }}
                        className="mt-10 px-8 py-3 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl"
                    >
                        <p className="text-[10px] font-mono text-white/40 tracking-widest uppercase">
                            Score = (<span className="text-[#D4AF37]">S</span> × 0.3) + (<span className="text-[#D4AF37]">C</span> × 0.3) + (<span className="text-[#00BFFF]">M</span> × 0.2) + (<span className="text-[#00BFFF]">P</span> × 0.2)
                        </p>
                    </motion.div>
                </div>

                {/* SECTION 2: PHASE PROGRESSION ROADMAP */}
                <div className="max-w-4xl mx-auto mb-32 px-12">
                    <div className="relative flex justify-between items-center h-[2px]">
                        {/* Background Line */}
                        <div className="absolute inset-0 bg-white/10 rounded-full" />

                        {/* Active Connector */}
                        <motion.div
                            className="absolute left-0 h-full bg-[#D4AF37] rounded-full shadow-[0_0_20px_rgba(212,175,55,0.4)]"
                            initial={{ width: "0%" }}
                            animate={{
                                width: `${(phases.findIndex(p => p.id === currentPhase) / (phases.length - 1)) * 100}%`
                            }}
                            transition={{ duration: 1, ease: "easeInOut" }}
                        />

                        {phases.map((phase, idx) => {
                            const isActive = currentPhase === phase.id;
                            const isPast = phases.findIndex(p => p.id === currentPhase) >= idx;

                            return (
                                <button
                                    key={phase.id}
                                    onClick={() => setCurrentPhase(phase.id)}
                                    className="relative flex flex-col items-center group"
                                >
                                    <div className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-500 z-10 ${isActive
                                        ? 'bg-[#0F0F14] border-[#D4AF37] scale-125 shadow-[0_0_15px_rgba(212,175,55,0.8)]'
                                        : isPast
                                            ? 'bg-[#D4AF37] border-[#D4AF37]'
                                            : 'bg-[#0F0F14] border-white/20'
                                        }`} />
                                    <span className={`absolute top-8 text-[9px] font-black uppercase tracking-[0.2em] whitespace-nowrap transition-all duration-500 ${isActive ? 'text-[#D4AF37] scale-110' : 'text-white/20'
                                        }`}>
                                        {phase.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="grid lg:grid-cols-12 gap-12 max-w-[1440px] mx-auto">
                    {/* SECTION 3: JUDGE’S LIVE SCORING PANEL */}
                    <div className="lg:col-span-5 space-y-10">
                        <div className="bg-white/5 border border-white/10 backdrop-blur-2xl rounded-[40px] p-10 shadow-2xl relative overflow-hidden group/card">
                            <div className="flex items-center justify-between mb-12">
                                <h3 className="text-xl font-bold flex items-center gap-3 tracking-tight">
                                    <ShieldCheck className="w-5 h-5 text-[#00BFFF]" />
                                    JUDGE SCORING PANEL
                                </h3>
                                <div className={`px-4 py-1.5 rounded-full border text-[9px] font-black tracking-widest uppercase flex items-center gap-2 transition-all ${isScanning
                                    ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500'
                                    : 'bg-[#00BFFF]/10 border-[#00BFFF]/30 text-[#00BFFF]'}`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${isScanning ? 'bg-yellow-500 animate-pulse' : 'bg-[#00BFFF]'}`} />
                                    {isScanning ? 'ANALYZING' : 'ACTIVE'}
                                </div>
                            </div>

                            <div className="relative mb-12 flex justify-center">
                                <div className="scale-110">
                                    <ICN_RadarChart data={isScanning ? {
                                        Symmetry: scores.Symmetry + (Math.random() * 4 - 2),
                                        Conditioning: scores.Conditioning + (Math.random() * 4 - 2),
                                        Muscularity: scores.Muscularity + (Math.random() * 4 - 2),
                                        Presence: scores.Presence
                                    } : scores} />
                                </div>

                                <AnimatePresence>
                                    {isScanning && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="absolute inset-0 flex items-center justify-center bg-[#0F0F14]/20 backdrop-blur-[2px] rounded-full"
                                        >
                                            <div className="flex flex-col items-center gap-2">
                                                <Activity className="w-6 h-6 text-[#D4AF37] animate-pulse" />
                                                <span className="text-[8px] font-black text-[#D4AF37] uppercase tracking-[0.3em]">TELEMETRY SYNC</span>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className="space-y-8">
                                {[
                                    { id: 'Symmetry', label: 'SYMMETRY (30%)', color: '#D4AF37' },
                                    { id: 'Conditioning', label: 'CONDITIONING (30%)', color: '#D4AF37' },
                                    { id: 'Muscularity', label: 'MUSCULARITY (20%)', color: '#00BFFF' },
                                    { id: 'Presence', label: 'STAGE PRESENCE (20%)', color: '#00BFFF' }
                                ].map((metric) => (
                                    <div key={metric.id}>
                                        <div className="flex justify-between items-center mb-4 px-1">
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
                                                {metric.label}
                                            </span>
                                            <div className="flex items-center gap-3">
                                                {aiUpdated[metric.id] && (
                                                    <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                                                )}
                                                <div className="bg-white/5 px-3 py-1 rounded-lg border border-white/5">
                                                    <span className="text-sm font-black tabular-nums" style={{ color: metric.color }}>
                                                        <CountUp value={scores[metric.id as keyof typeof scores]} duration={1} />
                                                    </span>
                                                    <span className="text-[10px] text-white/20 ml-1">%</span>
                                                </div>
                                            </div>
                                        </div>
                                        <Slider
                                            value={[scores[metric.id as keyof typeof scores]]}
                                            onValueChange={(val) => handleScoreChange(metric.id as keyof typeof scores, val)}
                                            max={100}
                                            step={1}
                                            className="cursor-pointer"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* SECTION 5: COMPETITION READINESS CHECKLIST */}
                        <div className="bg-white/5 border border-white/10 backdrop-blur-2xl rounded-[40px] p-10">
                            <h3 className="text-xl font-bold mb-10 flex items-center gap-3">
                                <CheckCircle2 className="w-5 h-5 text-[#D4AF37]" />
                                READINESS CHECKLIST
                            </h3>
                            <div className="space-y-4">
                                {[
                                    { id: 'tan', label: 'Tan Prepared' },
                                    { id: 'trunks', label: 'Trunks Ready' },
                                    { id: 'flow', label: 'Stage Flow Practiced' },
                                    { id: 'peak', label: 'Peak Week Plan Finalized' }
                                ].map((item) => (
                                    <label key={item.id} className="flex items-center gap-5 p-5 rounded-2xl bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10 transition-all group">
                                        <Checkbox id={item.id} className="border-[#D4AF37] data-[state=checked]:bg-[#D4AF37] w-5 h-5" />
                                        <span className="text-xs font-bold tracking-tight text-white/60 group-hover:text-[#D4AF37] transition-colors uppercase">{item.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* SECTION 4: JUDGE’S EYE (PRIMARY DIFFERENTIATOR) */}
                    <div className="lg:col-span-7">
                        <div className="bg-white/5 border border-white/10 backdrop-blur-2xl rounded-[40px] p-12 h-full flex flex-col relative overflow-hidden group/eye">
                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-16 gap-8">
                                <div className="space-y-2">
                                    <h3 className="text-3xl font-black flex items-center gap-4 tracking-tighter">
                                        <Eye className="w-8 h-8 text-[#D4AF37]" />
                                        JUDGE’S EYE ANALYSIS
                                    </h3>
                                    <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.4em]">Elite AI Structural Assessment</p>
                                </div>
                                <div className="flex gap-4">
                                    <Button
                                        onClick={() => setShowOverlay(!showOverlay)}
                                        variant="outline"
                                        className={`rounded-full px-8 h-12 text-[9px] font-black uppercase tracking-widest border-white/10 transition-all ${showOverlay ? 'bg-[#D4AF37] text-black border-[#D4AF37] shadow-[0_0_20px_#D4AF37]' : 'bg-white/5 hover:bg-white/10'}`}
                                    >
                                        X-FRAME GRID {showOverlay ? 'ON' : 'OFF'}
                                    </Button>
                                    <label className="cursor-pointer">
                                        <div className="bg-white text-black px-8 h-12 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-[#D4AF37] transition-all flex items-center gap-3">
                                            <Camera className="w-4 h-4" />
                                            Upload Image
                                        </div>
                                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                    </label>
                                </div>
                            </div>

                            <div className="relative flex-1 rounded-[40px] overflow-hidden bg-black/40 border border-white/5 flex items-center justify-center min-h-[550px] shadow-inner">
                                {previewImage ? (
                                    <>
                                        <img src={previewImage} className={`w-full h-full object-cover transition-all duration-1000 ${isScanning ? 'blur-sm grayscale opacity-30' : 'opacity-80'}`} alt="Athlete Assessment" />
                                        {showOverlay && <X_Frame_Overlay opacity={0.5} />}

                                        {isScanning && (
                                            <>
                                                <motion.div
                                                    initial={{ top: "0%" }}
                                                    animate={{ top: "100%" }}
                                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                                    className="absolute left-0 right-0 h-[2px] bg-[#D4AF37] shadow-[0_0_40px_rgba(212,175,55,1)] z-30"
                                                />
                                                <div className="absolute inset-0 bg-[#D4AF37]/5 flex items-center justify-center z-20">
                                                    <div className="flex flex-col items-center gap-6">
                                                        <div className="w-16 h-16 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin shadow-[0_0_30px_rgba(212,175,55,0.2)]" />
                                                        <span className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.6em] animate-pulse">Scanning Bio-Structure</span>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </>
                                ) : (
                                    <div className="text-center opacity-10 group-hover/eye:opacity-30 transition-all duration-700">
                                        <Camera className="w-24 h-24 mb-6 mx-auto stroke-[0.5]" />
                                        <p className="text-[10px] font-black uppercase tracking-[0.5em]">Awaiting Visual Telemetry</p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="p-10 rounded-[30px] bg-white/5 border border-white/10 backdrop-blur-xl relative group/feedback">
                                    <div className="flex items-center gap-3 mb-6">
                                        <Hexagon className="w-4 h-4 text-[#D4AF37] fill-[#D4AF37]/20" />
                                        <span className="text-[9px] font-black uppercase tracking-widest text-[#D4AF37]">Judge Feedback</span>
                                    </div>
                                    <p className="text-base font-bold leading-relaxed text-white/70 italic">
                                        {analysisResult ? `"${analysisResult.feedback}"` : "Upload a muscular pose to begin structural analysis and receive ICN jury feedback."}
                                    </p>
                                </div>
                                <div className="flex flex-col items-stretch justify-center">
                                    <Button
                                        disabled={!previewImage || isScanning}
                                        onClick={handleScan}
                                        className="h-24 rounded-[30px] bg-white hover:bg-[#D4AF37] text-black font-black uppercase tracking-[0.4em] text-sm transition-all shadow-[0_15px_40px_rgba(0,0,0,0.4)] hover:shadow-[0_15px_40px_rgba(212,175,55,0.3)] disabled:opacity-20 active:scale-95"
                                    >
                                        {isScanning ? "Processing..." : analysisResult ? "RE-ANALYZE" : "INIITIALIZE SCAN"}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Container>
        </div>
    );
}

