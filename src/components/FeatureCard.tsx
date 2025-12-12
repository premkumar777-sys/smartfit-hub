import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  link?: string;
  index?: number;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  icon: Icon,
  title,
  description,
  link,
  index = 0
}) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setMousePosition({ x, y });
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    setMousePosition({ x: 0, y: 0 });
  };

  // Calculate 3D rotation based on mouse position
  const calculateRotation = () => {
    if (!cardRef.current || !isHovered) return { rotateX: 0, rotateY: 0 };

    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((mousePosition.y - centerY) / centerY) * -8; // Max 8deg
    const rotateY = ((mousePosition.x - centerX) / centerX) * 8; // Max 8deg

    return { rotateX, rotateY };
  };

  const rotation = calculateRotation();

  const cardContent = (
    <div
      ref={cardRef}
      className="feature-card group relative h-full p-6 rounded-xl bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-sm border border-gray-700/50 overflow-hidden cursor-pointer"
      style={{
        transform: `perspective(1000px) rotateX(${rotation.rotateX}deg) rotateY(${rotation.rotateY}deg) ${isHovered ? 'scale(1.02)' : 'scale(1)'}`,
        transformStyle: 'preserve-3d',
        boxShadow: isHovered
          ? '0 20px 40px -12px rgba(0, 255, 156, 0.3), 0 0 0 1px rgba(0, 255, 156, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
          : '0 4px 12px -2px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        animationDelay: `${index * 100}ms`,
      } as React.CSSProperties}
    >
      {/* Hover glow effect */}
      <div
        className={`absolute inset-0 rounded-xl transition-all duration-500 ease-out ${isHovered ? 'opacity-25' : 'opacity-0'}`}
        style={{
          background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(0, 255, 156, 0.4) 0%, rgba(0, 255, 156, 0.2) 30%, transparent 70%)`,
          filter: 'blur(1px)',
        }}
      />

      {/* Subtle border glow */}
      <div
        className={`absolute inset-0 rounded-xl transition-all duration-600 ease-out ${isHovered ? 'opacity-100' : 'opacity-0'}`}
        style={{
          boxShadow: 'inset 0 0 0 1px rgba(0, 255, 156, 0.3), 0 0 20px rgba(0, 255, 156, 0.1)',
        }}
      />

      {/* Floating particles */}
      <div className={`absolute top-4 right-4 w-2 h-2 bg-[#00FF9C] rounded-full transition-all duration-600 ease-out ${isHovered ? 'opacity-100 scale-125' : 'opacity-0 scale-75'}`}
           style={{ filter: 'blur(0.5px)' }} />
      <div className={`absolute bottom-6 left-6 w-1 h-1 bg-[#00FF9C] rounded-full transition-all duration-800 ease-out ${isHovered ? 'opacity-100 scale-150' : 'opacity-0 scale-50'}`}
           style={{ animationDelay: '0.1s', filter: 'blur(0.3px)' }} />
      <div className={`absolute top-1/2 left-4 w-1 h-1 bg-[#00FF9C] rounded-full transition-all duration-1000 ease-out ${isHovered ? 'opacity-80 scale-110' : 'opacity-0 scale-90'}`}
           style={{ animationDelay: '0.3s', filter: 'blur(0.2px)' }} />

      <div className="relative z-10">
        {/* Icon with hover animation */}
        <div
          className="mb-4 transition-all duration-400 ease-out"
          style={{
            transform: isHovered ? `translateY(-6px) scale(1.15) rotate(5deg)` : 'translateY(0) scale(1) rotate(0deg)',
          }}
        >
          <Icon className="h-10 w-10 text-[#00FF9C] transition-all duration-400 drop-shadow-lg" />
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold mb-3 leading-relaxed text-white transition-all duration-400 ease-out"
            style={{
              transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
            }}>
          {title}
        </h3>

        {/* Description */}
        <p className="leading-relaxed text-gray-300 transition-all duration-400 ease-out"
           style={{
             transform: isHovered ? 'translateY(-1px)' : 'translateY(0)',
           }}>
          {description}
        </p>
      </div>

      {/* Hover flash effect */}
      <div className={`absolute inset-0 rounded-xl bg-[#00FF9C] transition-opacity duration-150 ${isHovered ? 'opacity-5' : 'opacity-0'}`} />
    </div>
  );

  return link ? (
    <Link to={link} className="block h-full focus:outline-none focus:ring-2 focus:ring-[#00FF9C] focus:ring-offset-2 focus:ring-offset-gray-900 rounded-xl">
      {cardContent}
    </Link>
  ) : (
    cardContent
  );
};
