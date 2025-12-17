import { useEffect, useRef, useState } from 'react';

interface Particle {
    id: number;
    x: number;
    y: number;
    size: number;
    life: number;
    vx: number;
    vy: number;
    color: string;
}

export function FitnessCursor() {
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [particles, setParticles] = useState<Particle[]>([]);
    const [isVisible, setIsVisible] = useState(false);
    const [isClicking, setIsClicking] = useState(false);
    const [rotation, setRotation] = useState(0);
    const particleIdRef = useRef(0);
    const lastPosRef = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePos({ x: e.clientX, y: e.clientY });
            setIsVisible(true);

            const dx = e.clientX - lastPosRef.current.x;
            const dy = e.clientY - lastPosRef.current.y;
            const speed = Math.sqrt(dx * dx + dy * dy);

            // Spawn sparkle particles based on speed
            if (speed > 5) {
                const newParticles: Particle[] = [];
                const count = Math.min(4, Math.floor(speed / 8));
                const colors = ['#00ff9c', '#00ccff', '#ffcc00', '#ff6699'];

                for (let i = 0; i < count; i++) {
                    newParticles.push({
                        id: particleIdRef.current++,
                        x: e.clientX + (Math.random() - 0.5) * 30,
                        y: e.clientY + (Math.random() - 0.5) * 30,
                        size: 3 + Math.random() * 5,
                        life: 1,
                        vx: (Math.random() - 0.5) * 4,
                        vy: (Math.random() - 0.5) * 4 - 2,
                        color: colors[Math.floor(Math.random() * colors.length)],
                    });
                }

                setParticles(prev => [...prev.slice(-40), ...newParticles]);
            }

            lastPosRef.current = { x: e.clientX, y: e.clientY };
        };

        const handleMouseDown = () => setIsClicking(true);
        const handleMouseUp = () => setIsClicking(false);
        const handleMouseLeave = () => setIsVisible(false);

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, []);

    // Animate particles and rotation
    useEffect(() => {
        const interval = setInterval(() => {
            setParticles(prev =>
                prev
                    .map(p => ({
                        ...p,
                        x: p.x + p.vx,
                        y: p.y + p.vy,
                        life: p.life - 0.025,
                        vy: p.vy + 0.08,
                        size: p.size * 0.97,
                    }))
                    .filter(p => p.life > 0)
            );
            setRotation(r => r + 2);
        }, 16);

        return () => clearInterval(interval);
    }, []);

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-[9999]">
            {/* Sparkle particles */}
            {particles.map(particle => (
                <div
                    key={particle.id}
                    className="absolute"
                    style={{
                        left: particle.x,
                        top: particle.y,
                        width: particle.size,
                        height: particle.size,
                        background: particle.color,
                        borderRadius: '50%',
                        boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
                        transform: 'translate(-50%, -50%)',
                        opacity: particle.life,
                    }}
                />
            ))}

            {/* Main cursor */}
            <div
                className="absolute transition-transform duration-100"
                style={{
                    left: mousePos.x,
                    top: mousePos.y,
                    transform: `translate(-50%, -50%) scale(${isClicking ? 0.85 : 1}) rotate(${isClicking ? 15 : 0}deg)`,
                }}
            >
                {/* Rotating outer ring */}
                <div
                    className="absolute w-16 h-16 -translate-x-1/2 -translate-y-1/2"
                    style={{
                        transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
                    }}
                >
                    <svg width="64" height="64" viewBox="0 0 64 64">
                        <circle
                            cx="32"
                            cy="32"
                            r="28"
                            fill="none"
                            stroke="url(#ringGradient)"
                            strokeWidth="2"
                            strokeDasharray="8 4"
                            opacity="0.6"
                        />
                        <defs>
                            <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#00ff9c" />
                                <stop offset="100%" stopColor="#00ccff" />
                            </linearGradient>
                        </defs>
                    </svg>
                </div>

                {/* Pulse ring */}
                <div
                    className="absolute w-14 h-14 rounded-full border-2 border-primary/40 -translate-x-1/2 -translate-y-1/2"
                    style={{ animation: 'pulse-ring 1.2s ease-out infinite' }}
                />

                {/* Dumbbell SVG */}
                <svg
                    width="48"
                    height="32"
                    viewBox="0 0 48 32"
                    className="absolute -translate-x-1/2 -translate-y-1/2"
                    style={{
                        filter: 'drop-shadow(0 0 10px rgba(0, 255, 156, 0.7))',
                    }}
                >
                    <defs>
                        <linearGradient id="weightGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#00ffaa" />
                            <stop offset="50%" stopColor="#00ff9c" />
                            <stop offset="100%" stopColor="#00cc7d" />
                        </linearGradient>
                        <linearGradient id="barGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#555" />
                            <stop offset="50%" stopColor="#888" />
                            <stop offset="100%" stopColor="#555" />
                        </linearGradient>
                    </defs>

                    {/* Left outer plate */}
                    <rect x="2" y="6" width="6" height="20" rx="2" fill="url(#weightGradient)" />
                    {/* Left inner plate */}
                    <rect x="8" y="9" width="4" height="14" rx="1" fill="url(#weightGradient)" opacity="0.8" />

                    {/* Bar */}
                    <rect x="12" y="13" width="24" height="6" rx="2" fill="url(#barGradient)" />

                    {/* Center grip */}
                    <rect x="20" y="12" width="8" height="8" rx="1" fill="#666" />
                    <circle cx="24" cy="16" r="2" fill="#00ff9c" />

                    {/* Right inner plate */}
                    <rect x="36" y="9" width="4" height="14" rx="1" fill="url(#weightGradient)" opacity="0.8" />
                    {/* Right outer plate */}
                    <rect x="40" y="6" width="6" height="20" rx="2" fill="url(#weightGradient)" />
                </svg>

                {/* Power indicator dots */}
                {[0, 1, 2].map(i => (
                    <div
                        key={i}
                        className="absolute"
                        style={{
                            width: 4,
                            height: 4,
                            borderRadius: '50%',
                            background: '#00ff9c',
                            left: '50%',
                            top: -20 - i * 6,
                            transform: 'translateX(-50%)',
                            opacity: 0.4 + (2 - i) * 0.2,
                            boxShadow: '0 0 6px #00ff9c',
                        }}
                    />
                ))}
            </div>

            <style>{`
        @keyframes pulse-ring {
          0% {
            transform: translate(-50%, -50%) scale(0.8);
            opacity: 0.8;
          }
          100% {
            transform: translate(-50%, -50%) scale(1.4);
            opacity: 0;
          }
        }
      `}</style>
        </div>
    );
}
