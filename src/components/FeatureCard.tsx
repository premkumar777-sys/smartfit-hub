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
      className="feature-card group relative h-full p-6 rounded-xl bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-sm border border-gray-700/50 overflow-hidden transition-all duration-300 ease-out cursor-pointer"
      style={{
        transform: `perspective(1000px) rotateX(${rotation.rotateX}deg) rotateY(${rotation.rotateY}deg) ${isHovered ? 'scale(1.05)' : 'scale(1)'}`,
        transformStyle: 'preserve-3d',
        boxShadow: isHovered
          ? '0 25px 50px -12px rgba(0, 255, 156, 0.25), 0 0 0 1px rgba(0, 255, 156, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
          : '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
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
        className={`absolute inset-0 rounded-xl transition-opacity duration-300 ${isHovered ? 'opacity-20' : 'opacity-0'}`}
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(0, 255, 156, 0.3) 0%, transparent 70%)',
        }}
      />

      {/* Floating particles */}
      <div className={`absolute top-4 right-4 w-2 h-2 bg-[#00FF9C] rounded-full transition-opacity duration-500 ${isHovered ? 'opacity-100' : 'opacity-0'}`} />
      <div className={`absolute bottom-6 left-6 w-1 h-1 bg-[#00FF9C] rounded-full transition-opacity duration-700 ${isHovered ? 'opacity-100' : 'opacity-0'}`} style={{ animationDelay: '0.2s' }} />

      <div className="relative z-10">
        {/* Icon with hover animation */}
        <div
          className="mb-4 transition-transform duration-300 ease-out"
          style={{
            transform: isHovered ? `translateY(-4px) scale(1.1)` : 'translateY(0) scale(1)',
          }}
        >
          <Icon className="h-10 w-10 text-[#00FF9C] transition-all duration-300" />
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold mb-3 leading-relaxed text-white transition-transform duration-300">
          {title}
        </h3>

        {/* Description */}
        <p className="leading-relaxed text-gray-300 transition-all duration-300">
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
