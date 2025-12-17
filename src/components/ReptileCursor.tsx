import { useEffect, useRef, useState } from 'react';

interface Point {
    x: number;
    y: number;
}

const TRAIL_LENGTH = 20;
const SEGMENT_DISTANCE = 15;

export function ReptileCursor() {
    const [points, setPoints] = useState<Point[]>([]);
    const [isVisible, setIsVisible] = useState(false);
    const mousePos = useRef<Point>({ x: 0, y: 0 });
    const animationRef = useRef<number>();

    useEffect(() => {
        // Initialize trail points
        const initialPoints: Point[] = Array(TRAIL_LENGTH).fill({ x: 0, y: 0 });
        setPoints(initialPoints);

        const handleMouseMove = (e: MouseEvent) => {
            mousePos.current = { x: e.clientX, y: e.clientY };
            setIsVisible(true);
        };

        const handleMouseLeave = () => {
            setIsVisible(false);
        };

        const animate = () => {
            setPoints(prevPoints => {
                const newPoints = [...prevPoints];

                // Head follows mouse
                newPoints[0] = {
                    x: newPoints[0].x + (mousePos.current.x - newPoints[0].x) * 0.3,
                    y: newPoints[0].y + (mousePos.current.y - newPoints[0].y) * 0.3,
                };

                // Each segment follows the one ahead
                for (let i = 1; i < newPoints.length; i++) {
                    const prev = newPoints[i - 1];
                    const curr = newPoints[i];
                    const dx = prev.x - curr.x;
                    const dy = prev.y - curr.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist > SEGMENT_DISTANCE) {
                        const ratio = SEGMENT_DISTANCE / dist;
                        newPoints[i] = {
                            x: prev.x - dx * ratio,
                            y: prev.y - dy * ratio,
                        };
                    }
                }

                return newPoints;
            });

            animationRef.current = requestAnimationFrame(animate);
        };

        window.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseleave', handleMouseLeave);
        animationRef.current = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseleave', handleMouseLeave);
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, []);

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-[9999]">
            <svg className="w-full h-full">
                {/* Reptile body trail */}
                {points.map((point, index) => {
                    const size = Math.max(4, 14 - index * 0.5);
                    const opacity = 1 - (index / TRAIL_LENGTH) * 0.7;
                    const hue = 140 + index * 3; // Green to teal gradient

                    return (
                        <circle
                            key={index}
                            cx={point.x}
                            cy={point.y}
                            r={size}
                            fill={`hsla(${hue}, 70%, 50%, ${opacity})`}
                            style={{
                                filter: index === 0 ? 'drop-shadow(0 0 8px rgba(0, 255, 150, 0.6))' : undefined,
                            }}
                        />
                    );
                })}

                {/* Eyes on the head */}
                {points[0] && (
                    <>
                        <circle cx={points[0].x - 5} cy={points[0].y - 4} r={3} fill="white" />
                        <circle cx={points[0].x + 5} cy={points[0].y - 4} r={3} fill="white" />
                        <circle cx={points[0].x - 5} cy={points[0].y - 4} r={1.5} fill="#111" />
                        <circle cx={points[0].x + 5} cy={points[0].y - 4} r={1.5} fill="#111" />
                    </>
                )}

                {/* Tongue (flicks occasionally) */}
                {points[0] && points[1] && (
                    <path
                        d={`M ${points[0].x} ${points[0].y + 8} 
                Q ${points[0].x} ${points[0].y + 18} ${points[0].x - 4} ${points[0].y + 22}
                M ${points[0].x} ${points[0].y + 18} 
                Q ${points[0].x} ${points[0].y + 18} ${points[0].x + 4} ${points[0].y + 22}`}
                        stroke="#ff4444"
                        strokeWidth="2"
                        fill="none"
                        strokeLinecap="round"
                        style={{
                            animation: 'flick 0.5s ease-in-out infinite',
                        }}
                    />
                )}
            </svg>

            <style>{`
        @keyframes flick {
          0%, 100% { opacity: 0; }
          30%, 70% { opacity: 1; }
        }
      `}</style>
        </div>
    );
}
