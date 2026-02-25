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
    CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/Container';
import { ICN_RadarChart } from '@/components/icn/ICN_RadarChart';
import { X_Frame_Overlay } from '@/components/icn/X_Frame_Overlay';
import { Phase_Navigator, ICNPhase } from '@/components/icn/Phase_Navigator';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';

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
                    focus: "Foundation & Symmetry",
                    target: "Baseline Assessment",
                    protocol: [
                        "Bi-weekly structural assessments",
                        "Focus on compound movements",
                        "Establish nutritional baseline",
                    ],
                    standard: "ICN judges look for an X-frame foundation even in the early stages."
                };
            case 'build':
                return {
                    advice: "Construction time. Emphasize the X-Frame: wide lats, sweeping quads, and a tight midsection. Maintain natural standards.",
                    focus: "Hypertrophy & Width",
                    target: "0.5% weight gain / week",
                    protocol: [
                        "High volume training (12-20 sets/muscle)",
                        "Caloric surplus (Natural emphasis)",
                        "Weak point specialization",
                    ],
                    standard: "Muscular balance must be maintained while adding size."
                };
            case 'lean':
                return {
                    advice: "The cut begins. We need to see muscular separation. Move from 'Cloudy' to 'Stage Lean.' Discipline is your only teammate now.",
                    focus: "Density & Separation",
                    target: "8-12% Body Fat",
                    protocol: [
                        "Gradual caloric deficit",
                        "Increased NEAT (Step goals)",
                        "Practice 'holding' poses for 30s",
                    ],
                    standard: "Definition wins shows. We need to see the deep cuts."
                };
            case 'posing':
                return {
                    advice: "Showmanship is half the battle. Every muscle must be presented with intent. Perfection in transitions is what wins trophies.",
                    focus: "Presentation & Flow",
                    target: "Stage Ready",
                    protocol: [
                        "Dailly posing (45 mins)",
                        "Peak week electrolyte balance",
                        "Stage walk refinement",
                    ],
                    standard: "Transitions should be seamless and fluid. Keep the core tight."
                };
        }
    }, [currentPhase]);

    const handleScoreChange = (metric: keyof typeof scores, value: number[]) => {
        setScores(prev => ({ ...prev, [metric]: value[0] }));
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setPreviewImage(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white pt-24 pb-12 font-sans overflow-x-hidden">
            {/* Background Decorative Elements */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none opacity-20 bg-[radial-gradient(circle_at_50%_50%,#d4af37_0%,transparent_50%)]" />

            <Container>
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
                        className="text-5xl md:text-7xl font-black mb-6 leading-none"
                    >
                        THE <span className="text-gold text-transparent bg-clip-text bg-gradient-to-r from-gold to-white/60">EVOLUTION</span> <br /> OF AN ATHLETE
                    </motion.h1>

                    <p className="max-w-2xl text-white/40 text-lg leading-relaxed">
                        Transition from the 'Common Man' to a 'Stage-Ready Competitor'. Use the ICN Judge's Eye to analyze your symmetry and structural balance.
                    </p>
                </div>

                {/* Phase Navigator */}
                <div className="mb-20">
                    <Phase_Navigator currentPhase={currentPhase} onPhaseChange={setCurrentPhase} />
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
                                <div className="px-3 py-1 bg-gold/20 rounded-full border border-gold/40 text-[10px] font-black text-gold tracking-widest uppercase">
                                    Live Analysis
                                </div>
                            </div>

                            <ICN_RadarChart data={scores} />

                            <div className="mt-12 space-y-8">
                                {/* Symmetry Slider */}
                                <div className="space-y-4">
                                    <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                                        <span>Structural Symmetry</span>
                                        <span className="text-gold">{scores.Symmetry}%</span>
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
                                        <span>Muscle Conditioning</span>
                                        <span className="text-gold">{scores.Conditioning}%</span>
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
                                        <span>Muscularity</span>
                                        <span className="text-gold">{scores.Muscularity}%</span>
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
                                        <img src={previewImage} className="w-full h-full object-cover" alt="Check Pose" />
                                        {showOverlay && <X_Frame_Overlay opacity={0.6} />}
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
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Symmetry Overlay</span>
                                    <span className="text-xs font-bold">X-Frame Alignment Guide</span>
                                </div>
                                <Button
                                    onClick={() => setShowOverlay(!showOverlay)}
                                    variant={showOverlay ? "default" : "outline"}
                                    className={showOverlay ? "bg-gold text-black" : ""}
                                >
                                    {showOverlay ? "Lock Grid" : "Analyze"}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Readiness Score & Checklist */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-gradient-to-br from-blue-600 to-blue-900 rounded-3xl p-10 shadow-[0_20px_50px_rgba(59,130,246,0.2)]">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h3 className="text-3xl font-black italic tracking-tighter mb-1 uppercase">Athlete Status</h3>
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-blue-200" />
                                        <span className="text-blue-100 text-[10px] font-black uppercase tracking-[0.2em]">iCompete Natural</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-10">
                                <div className="text-[10px] text-blue-200/60 font-black uppercase tracking-widest mb-2 px-1">ICN Readiness Score</div>
                                <div className="text-8xl font-black text-white leading-none tracking-tighter flex items-end gap-2">
                                    {readinessScore}
                                    <span className="text-2xl text-blue-300/60 mb-3 tracking-widest">%</span>
                                </div>
                            </div>

                            {/* Formula Display */}
                            <div className="pt-6 border-t border-blue-400/20">
                                <div className="text-[9px] text-blue-200/50 font-mono uppercase mb-3">Formula Engine:</div>
                                <div className="bg-black/20 rounded-xl p-4 font-mono text-[11px] text-blue-100">
                                    <span className="text-gold"> Readiness</span> = (S 0.3) + (C 0.3) + (M 0.2) + (P 0.2)
                                </div>
                            </div>
                        </div>

                        {/* Prep Checklist */}
                        <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl p-8">
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-gold" />
                                Competition Readiness
                            </h3>

                            <div className="space-y-6">
                                <div>
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-3">Presentation (Stage)</h4>
                                    <div className="space-y-3">
                                        {[
                                            { id: 'tan', label: 'Competition Base Tan', sub: 'Elite Shade 04' },
                                            { id: 'trunks', label: 'ICN Registered Trunks', sub: 'Mandatory' },
                                            { id: 'flow', label: 'Stage Walk & Routine', sub: 'Transitions' },
                                        ].map((item) => (
                                            <label key={item.id} className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                                                <Checkbox id={item.id} className="border-gold data-[state=checked]:bg-gold" />
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold">{item.label}</span>
                                                    <span className="text-[9px] font-black uppercase text-white/30 tracking-widest">{item.sub}</span>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-3">Administrative</h4>
                                    <div className="space-y-3">
                                        {[
                                            { id: 'member', label: 'ICN Membership', sub: 'Active Status' },
                                            { id: 'reg', label: 'Show Registration', sub: 'Paid & Confirmed' },
                                        ].map((item) => (
                                            <label key={item.id} className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                                                <Checkbox id={item.id} className="border-gold data-[state=checked]:bg-gold" />
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold">{item.label}</span>
                                                    <span className="text-[9px] font-black uppercase text-white/30 tracking-widest">{item.sub}</span>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <Button className="w-full mt-8 h-12 bg-white/10 hover:bg-white/20 border-white/20 text-white font-black uppercase tracking-widest text-xs">
                                Review Prep Progress
                                <ChevronRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </div>
                </div>
            </Container>
        </div>
    );
}
