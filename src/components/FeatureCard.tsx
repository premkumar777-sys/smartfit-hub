import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  link?: string;
  delay?: number;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  icon: Icon,
  title,
  description,
  link,
  delay = 0
}) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
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

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);

  // Calculate 3D rotation based on mouse position
  const calculateRotation = () => {
    if (!cardRef.current) return { rotateX: 0, rotateY: 0 };

    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((mousePosition.y - centerY) / centerY) * -10; // Max 10deg
    const rotateY = ((mousePosition.x - centerX) / centerX) * 10; // Max 10deg

    return { rotateX, rotateY };
  };

  const rotation = calculateRotation();
  const isActive = isHovered || isFocused;

  const cardContent = (
    <div
      ref={cardRef}
      className="feature-card group relative h-full p-8 rounded-2xl bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-md border border-gray-700/50 transition-all duration-300 ease-out overflow-hidden cursor-pointer"
      style={{
        transform: isActive
          ? `perspective(1000px) rotateX(${rotation.rotateX}deg) rotateY(${rotation.rotateY}deg) scale(1.05)`
          : 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)',
        transformStyle: 'preserve-3d',
        boxShadow: isActive
          ? '0 25px 50px -12px rgba(0, 255, 156, 0.25), 0 0 0 1px rgba(0, 255, 156, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
          : '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      tabIndex={0}
      role="button"
      aria-label={`${title}: ${description}`}
      style={{
        animationDelay: `${delay}ms`,
      } as React.CSSProperties}
    >
      {/* Parallax glow effect */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(0, 255, 156, 0.15) 0%, transparent 50%)`,
        }}
      />

      {/* Neon border glow */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
           style={{
             boxShadow: 'inset 0 0 0 1px rgba(0, 255, 156, 0.5), 0 0 20px rgba(0, 255, 156, 0.2)',
           }}
      />

      {/* Floating particles effect */}
      <div className="absolute top-4 right-4 w-2 h-2 bg-[#00FF9C] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse" />
      <div className="absolute bottom-6 left-6 w-1 h-1 bg-[#00FF9C] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 animate-pulse" style={{ animationDelay: '0.2s' }} />

      <div className="relative z-10">
        {/* Icon with parallax */}
        <div
          className="mb-6 transition-transform duration-300 ease-out"
          style={{
            transform: isActive ? `translateY(-8px) translateZ(20px)` : 'translateY(0) translateZ(0)',
          }}
        >
          <Icon className="h-12 w-12 text-[#00FF9C] transition-all duration-300 group-hover:scale-110" />
        </div>

        {/* Title with parallax */}
        <h3
          className="text-xl font-bold mb-4 leading-relaxed text-white transition-transform duration-300 ease-out"
          style={{
            transform: isActive ? `translateZ(15px)` : 'translateZ(0)',
          }}
        >
          {title}
        </h3>

        {/* Description with parallax */}
        <p
          className="leading-relaxed text-gray-300 transition-all duration-300 ease-out"
          style={{
            transform: isActive ? `translateZ(10px)` : 'translateZ(0)',
          }}
        >
          {description}
        </p>
      </div>

      {/* Hover flash effect */}
      <div className="absolute inset-0 rounded-2xl bg-[#00FF9C] opacity-0 group-hover:opacity-10 group-hover:animate-flash transition-opacity duration-150 pointer-events-none" />
    </div>
  );

  return link ? (
    <Link to={link} className="block h-full focus:outline-none focus:ring-2 focus:ring-[#00FF9C] focus:ring-offset-2 focus:ring-offset-gray-900 rounded-2xl">
      {cardContent}
    </Link>
  ) : (
    cardContent
  );
};
