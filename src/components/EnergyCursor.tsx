import { useEffect, useRef, useState } from 'react';

interface TrailPoint {
    x: number;
    y: number;
    age: number;
}

export function EnergyCursor() {
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [trail, setTrail] = useState<TrailPoint[]>([]);
    const [isVisible, setIsVisible] = useState(false);
    const [pulse, setPulse] = useState(0);
    const lastUpdateRef = useRef(Date.now());

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePos({ x: e.clientX, y: e.clientY });
            setIsVisible(true);

            // Add trail point every few pixels
            const now = Date.now();
            if (now - lastUpdateRef.current > 16) {
                setTrail(prev => [
                    { x: e.clientX, y: e.clientY, age: 0 },
                    ...prev.slice(0, 25)
                ]);
                lastUpdateRef.current = now;
            }
        };

        const handleMouseLeave = () => setIsVisible(false);

        window.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, []);

    // Age the trail and pulse animation
    useEffect(() => {
        const interval = setInterval(() => {
            setTrail(prev =>
                prev
                    .map(p => ({ ...p, age: p.age + 1 }))
                    .filter(p => p.age < 30)
            );
            setPulse(p => (p + 1) % 60);
        }, 16);

        return () => clearInterval(interval);
    }, []);

    if (!isVisible) return null;

    const pulseScale = 1 + Math.sin(pulse * 0.2) * 0.15;

    return (
        <div className="fixed inset-0 pointer-events-none z-[9999]">
            {/* Flame/Energy Trail */}
            <svg className="w-full h-full absolute inset-0">
                <defs>
                    <linearGradient id="flameGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                        <stop offset="0%" stopColor="#ff4400" stopOpacity="0" />
                        <stop offset="30%" stopColor="#ff6600" stopOpacity="0.6" />
                        <stop offset="60%" stopColor="#ffaa00" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#00ff9c" stopOpacity="1" />
                    </linearGradient>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Energy trail path */}
                {trail.length > 2 && (
                    <path
                        d={`M ${trail[0]?.x} ${trail[0]?.y} ${trail.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')}`}
                        fill="none"
                        stroke="url(#flameGradient)"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        filter="url(#glow)"
                        style={{ opacity: 0.8 }}
                    />
                )}

                {/* Trail particles */}
                {trail.map((point, i) => {
                    const opacity = 1 - (point.age / 30);
                    const size = 6 - (point.age / 30) * 4;
                    if (size < 1) return null;

                    return (
                        <circle
                            key={i}
                            cx={point.x + (Math.random() - 0.5) * 4}
                            cy={point.y + (Math.random() - 0.5) * 4}
                            r={size}
                            fill={i < 5 ? '#00ff9c' : i < 15 ? '#ffaa00' : '#ff6600'}
                            opacity={opacity * 0.6}
                        />
                    );
                })}
            </svg>

            {/* Main cursor - Power Ring */}
            <div
                className="absolute"
                style={{
                    left: mousePos.x,
                    top: mousePos.y,
                    transform: `translate(-50%, -50%) scale(${pulseScale})`,
                }}
            >
                {/* Outer energy ring */}
                <div
                    className="absolute w-10 h-10 rounded-full -translate-x-1/2 -translate-y-1/2"
                    style={{
                        border: '3px solid transparent',
                        background: 'linear-gradient(45deg, #00ff9c, #00cc7d) padding-box, linear-gradient(45deg, #00ff9c, #ffaa00, #ff6600) border-box',
                        boxShadow: '0 0 20px rgba(0, 255, 156, 0.5), inset 0 0 10px rgba(0, 255, 156, 0.3)',
                    }}
                />

                {/* Inner power core */}
                <div
                    className="absolute w-4 h-4 rounded-full -translate-x-1/2 -translate-y-1/2"
                    style={{
                        background: 'radial-gradient(circle, #fff 0%, #00ff9c 50%, #00cc7d 100%)',
                        boxShadow: '0 0 15px rgba(0, 255, 156, 0.8)',
                    }}
                />

                {/* Lightning bolt icon */}
                <svg
                    className="absolute w-6 h-6 -translate-x-1/2 -translate-y-1/2"
                    viewBox="0 0 24 24"
                    fill="none"
                >
                    <path
                        d="M13 2L4 14h7l-2 8 9-12h-7l2-8z"
                        fill="#111"
                        stroke="#00ff9c"
                        strokeWidth="1"
                    />
                </svg>
            </div>

            {/* Heartbeat line effect */}
            <svg
                className="absolute"
                style={{
                    left: mousePos.x + 25,
                    top: mousePos.y - 15,
                    width: 60,
                    height: 30,
                }}
            >
                <path
                    d={`M 0 15 L 10 15 L 15 5 L 20 25 L 25 10 L 30 20 L 35 15 L 60 15`}
                    fill="none"
                    stroke="#00ff9c"
                    strokeWidth="2"
                    strokeLinecap="round"
                    opacity={0.7}
                    style={{
                        strokeDasharray: '100',
                        strokeDashoffset: 100 - (pulse * 3.5),
                    }}
                />
            </svg>
        </div>
    );
}
