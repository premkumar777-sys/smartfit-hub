import { motion } from 'framer-motion';
import { Lock, Sparkles } from 'lucide-react';

export type ICNPhase = 'reality' | 'build' | 'lean' | 'posing';

interface Phase_NavigatorProps {
    currentPhase: ICNPhase;
    unlockedPhases: ICNPhase[];
    onPhaseChange: (phase: ICNPhase) => void;
    onReadMore?: (phase: ICNPhase) => void;
}

const PHASES: { id: ICNPhase; label: string; sub: string }[] = [
    { id: 'reality', label: 'Reality Check', sub: 'Phase 01' },
    { id: 'build', label: 'Natural Build', sub: 'Phase 02' },
    { id: 'lean', label: 'Deep Lean', sub: 'Phase 03' },
    { id: 'posing', label: 'Art of Posing', sub: 'Phase 04' },
];

export function Phase_Navigator({ currentPhase, unlockedPhases, onPhaseChange, onReadMore }: Phase_NavigatorProps) {
    return (
        <div className="relative w-full py-8">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/5 -translate-y-1/2" />

            <div className="relative flex justify-between items-center max-w-4xl mx-auto">
                {PHASES.map((phase, index) => {
                    const isActive = phase.id === currentPhase;
                    const isUnlocked = unlockedPhases.includes(phase.id);
                    const isCompleted = isUnlocked && PHASES.findIndex(p => p.id === currentPhase) > index && phase.id !== currentPhase;

                    return (
                        <div key={phase.id} className="relative flex flex-col items-center">
                            <motion.button
                                whileHover={isUnlocked ? { scale: 1.1 } : {}}
                                whileTap={isUnlocked ? { scale: 0.9 } : {}}
                                onClick={() => isUnlocked && onPhaseChange(phase.id)}
                                className={`w-10 h-10 rounded-full border-2 flex items-center justify-center z-10 transition-all duration-500 ${isActive
                                    ? 'bg-gold border-gold shadow-[0_0_20px_rgba(212,175,55,0.6)] text-black'
                                    : isCompleted
                                        ? 'bg-blue-600 border-blue-600 text-white'
                                        : !isUnlocked
                                            ? 'bg-white/5 border-white/10 text-white/20 cursor-not-allowed'
                                            : 'bg-black border-white/20 text-white/40'
                                    }`}
                            >
                                {!isUnlocked ? (
                                    <Lock className="w-4 h-4" />
                                ) : isCompleted ? (
                                    '✓'
                                ) : (
                                    index + 1
                                )}
                            </motion.button>

                            <div className="absolute top-12 text-center w-32">
                                <p className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-gold' : 'text-muted-foreground'}`}>
                                    {phase.sub}
                                </p>
                                <p className={`text-xs font-bold mt-1 whitespace-nowrap ${isActive ? 'text-white' : 'text-white/40'}`}>
                                    {phase.label}
                                </p>
                                {isActive && onReadMore && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onReadMore(phase.id);
                                        }}
                                        className="mt-2 text-[9px] font-black uppercase tracking-[0.2em] text-gold hover:text-white transition-colors flex items-center gap-1 mx-auto"
                                    >
                                        <Sparkles className="w-2.5 h-2.5" />
                                        Read Intel
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
