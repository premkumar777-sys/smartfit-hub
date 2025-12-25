import { useEffect, useRef, useState } from 'react';

interface Node {
    x: number;
    y: number;
    vx: number;
    vy: number;
}

export function AICursor() {
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [nodes, setNodes] = useState<Node[]>([]);
    const [isVisible, setIsVisible] = useState(false);
    const [scanAngle, setScanAngle] = useState(0);

    // Initialize neural nodes
    useEffect(() => {
        const initialNodes: Node[] = Array(8).fill(null).map(() => ({
            x: 0,
            y: 0,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
        }));
        setNodes(initialNodes);
    }, []);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePos({ x: e.clientX, y: e.clientY });
            setIsVisible(true);
        };

        const handleMouseLeave = () => setIsVisible(false);

        window.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, []);

    // Animate nodes and scanning effect
    useEffect(() => {
        const interval = setInterval(() => {
            // Update node positions (orbit around cursor)
            setNodes(prev => prev.map((node, i) => {
                const angle = (Date.now() * 0.002 + i * (Math.PI * 2 / 8));
                const radius = 35 + Math.sin(Date.now() * 0.003 + i) * 10;
                return {
                    ...node,
                    x: Math.cos(angle) * radius,
                    y: Math.sin(angle) * radius,
                    vx: node.vx,
                    vy: node.vy,
                };
            }));

            // Scanning effect
            setScanAngle(prev => (prev + 3) % 360);
        }, 16);

        return () => clearInterval(interval);
    }, []);

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-[9999]">
            <svg className="w-full h-full">
                <defs>
                    {/* AI gradient */}
                    <linearGradient id="aiGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#00ff9c" />
                        <stop offset="50%" stopColor="#00ccff" />
                        <stop offset="100%" stopColor="#9945ff" />
                    </linearGradient>

                    {/* Glow filter */}
                    <filter id="aiGlow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="4" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>

                    {/* Scanning gradient */}
                    <linearGradient id="scanGradient" gradientTransform={`rotate(${scanAngle})`}>
                        <stop offset="0%" stopColor="#00ff9c" stopOpacity="0" />
                        <stop offset="50%" stopColor="#00ff9c" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#00ff9c" stopOpacity="0" />
                    </linearGradient>
                </defs>

                {/* Neural network connections */}
                {nodes.map((node, i) => (
                    nodes.slice(i + 1).map((node2, j) => {
                        const x1 = mousePos.x + node.x;
                        const y1 = mousePos.y + node.y;
                        const x2 = mousePos.x + node2.x;
                        const y2 = mousePos.y + node2.y;
                        const dist = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
                        const opacity = Math.max(0, 0.6 - dist / 100);

                        return (
                            <line
                                key={`${i}-${j}`}
                                x1={x1}
                                y1={y1}
                                x2={x2}
                                y2={y2}
                                stroke="url(#aiGradient)"
                                strokeWidth="1"
                                opacity={opacity}
                            />
                        );
                    })
                ))}

                {/* Neural nodes */}
                {nodes.map((node, i) => (
                    <g key={i}>
                        <circle
                            cx={mousePos.x + node.x}
                            cy={mousePos.y + node.y}
                            r={4 + Math.sin(Date.now() * 0.005 + i) * 2}
                            fill="url(#aiGradient)"
                            filter="url(#aiGlow)"
                        />
                    </g>
                ))}

                {/* Scanning ring */}
                <circle
                    cx={mousePos.x}
                    cy={mousePos.y}
                    r={50}
                    fill="none"
                    stroke="url(#scanGradient)"
                    strokeWidth="2"
                    opacity={0.5}
                />

                {/* Outer tech ring */}
                <circle
                    cx={mousePos.x}
                    cy={mousePos.y}
                    r={25}
                    fill="none"
                    stroke="url(#aiGradient)"
                    strokeWidth="2"
                    strokeDasharray="5 3"
                    filter="url(#aiGlow)"
                    style={{
                        transform: `rotate(${scanAngle}deg)`,
                        transformOrigin: `${mousePos.x}px ${mousePos.y}px`,
                    }}
                />

                {/* Inner core */}
                <circle
                    cx={mousePos.x}
                    cy={mousePos.y}
                    r={8}
                    fill="url(#aiGradient)"
                    filter="url(#aiGlow)"
                />

                {/* AI brain icon */}
                <g transform={`translate(${mousePos.x - 6}, ${mousePos.y - 6})`}>
                    <path
                        d="M6 2C4.5 2 3 3 3 5C2 5 1 6 1 7.5C1 9 2 10 3 10C3 11 4 12 6 12C8 12 9 11 9 10C10 10 11 9 11 7.5C11 6 10 5 9 5C9 3 7.5 2 6 2Z"
                        fill="none"
                        stroke="#111"
                        strokeWidth="1.5"
                    />
                    <circle cx="4" cy="6" r="1" fill="#111" />
                    <circle cx="8" cy="6" r="1" fill="#111" />
                    <path d="M4 8.5Q6 10 8 8.5" stroke="#111" strokeWidth="1" fill="none" />
                </g>

                {/* Data streams */}
                {[0, 1, 2, 3].map(i => {
                    const angle = (scanAngle + i * 90) * (Math.PI / 180);
                    const x1 = mousePos.x + Math.cos(angle) * 55;
                    const y1 = mousePos.y + Math.sin(angle) * 55;
                    const x2 = mousePos.x + Math.cos(angle) * 75;
                    const y2 = mousePos.y + Math.sin(angle) * 75;

                    return (
                        <line
                            key={i}
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            stroke="#00ff9c"
                            strokeWidth="2"
                            strokeLinecap="round"
                            opacity={0.6}
                        />
                    );
                })}
            </svg>

            {/* Binary text effect */}
            <div
                className="absolute text-[10px] font-mono text-primary/40"
                style={{
                    left: mousePos.x + 35,
                    top: mousePos.y - 20,
                }}
            >
                {['01', '10', '11'][Math.floor(Date.now() / 100) % 3]}
            </div>
        </div>
    );
}
