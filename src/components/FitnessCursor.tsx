import { useEffect, useRef, useState } from 'react';

interface Particle {
    id: number;
    x: number;
    y: number;
    size: number;
    life: number;
    vx: number;
    vy: number;
}

export function FitnessCursor() {
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [particles, setParticles] = useState<Particle[]>([]);
    const [isVisible, setIsVisible] = useState(false);
    const [isClicking, setIsClicking] = useState(false);
    const particleIdRef = useRef(0);
    const lastPosRef = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePos({ x: e.clientX, y: e.clientY });
            setIsVisible(true);

            // Calculate movement speed
            const dx = e.clientX - lastPosRef.current.x;
            const dy = e.clientY - lastPosRef.current.y;
            const speed = Math.sqrt(dx * dx + dy * dy);

            // Spawn energy particles based on speed
            if (speed > 3) {
                const newParticles: Particle[] = [];
                const count = Math.min(3, Math.floor(speed / 10));

                for (let i = 0; i < count; i++) {
                    newParticles.push({
                        id: particleIdRef.current++,
                        x: e.clientX + (Math.random() - 0.5) * 20,
                        y: e.clientY + (Math.random() - 0.5) * 20,
                        size: 4 + Math.random() * 6,
                        life: 1,
                        vx: (Math.random() - 0.5) * 3,
                        vy: (Math.random() - 0.5) * 3 - 1,
                    });
                }

                setParticles(prev => [...prev.slice(-30), ...newParticles]);
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

    // Animate particles
    useEffect(() => {
        const interval = setInterval(() => {
            setParticles(prev =>
                prev
                    .map(p => ({
                        ...p,
                        x: p.x + p.vx,
                        y: p.y + p.vy,
                        life: p.life - 0.03,
                        vy: p.vy + 0.1, // gravity
                    }))
                    .filter(p => p.life > 0)
            );
        }, 16);

        return () => clearInterval(interval);
    }, []);

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-[9999]">
            {/* Energy particles */}
            {particles.map(particle => (
                <div
                    key={particle.id}
                    className="absolute rounded-full"
                    style={{
                        left: particle.x,
                        top: particle.y,
                        width: particle.size,
                        height: particle.size,
                        background: `radial-gradient(circle, rgba(0, 255, 156, ${particle.life}) 0%, rgba(0, 200, 120, ${particle.life * 0.5}) 100%)`,
                        boxShadow: `0 0 ${particle.size * 2}px rgba(0, 255, 156, ${particle.life * 0.5})`,
                        transform: 'translate(-50%, -50%)',
                    }}
                />
            ))}

            {/* Main cursor - Dumbbell */}
            <div
                className="absolute transition-transform duration-75"
                style={{
                    left: mousePos.x,
                    top: mousePos.y,
                    transform: `translate(-50%, -50%) scale(${isClicking ? 0.8 : 1})`,
                }}
            >
                {/* Outer glow ring */}
                <div
                    className="absolute w-12 h-12 rounded-full border-2 border-primary/50 -translate-x-1/2 -translate-y-1/2"
                    style={{
                        animation: 'pulse-ring 1.5s ease-out infinite',
                    }}
                />

                {/* Dumbbell shape */}
                <svg
                    width="40"
                    height="40"
                    viewBox="0 0 40 40"
                    className="absolute -translate-x-1/2 -translate-y-1/2"
                    style={{
                        filter: 'drop-shadow(0 0 8px rgba(0, 255, 156, 0.6))',
                    }}
                >
                    {/* Left weight */}
                    <rect x="4" y="12" width="8" height="16" rx="2" fill="#00ff9c" />
                    <rect x="6" y="14" width="4" height="12" rx="1" fill="#00cc7d" />

                    {/* Bar */}
                    <rect x="10" y="18" width="20" height="4" rx="1" fill="#888" />

                    {/* Right weight */}
                    <rect x="28" y="12" width="8" height="16" rx="2" fill="#00ff9c" />
                    <rect x="30" y="14" width="4" height="12" rx="1" fill="#00cc7d" />

                    {/* Center highlight */}
                    <circle cx="20" cy="20" r="4" fill="#00ff9c" opacity="0.8" />
                </svg>
            </div>

            <style>{`
        @keyframes pulse-ring {
          0% {
            transform: translate(-50%, -50%) scale(0.8);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(1.5);
            opacity: 0;
          }
        }
      `}</style>
        </div>
    );
}
