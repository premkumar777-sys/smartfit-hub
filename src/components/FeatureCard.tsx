import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  link?: string;
  index: number;
}

export const FeatureCard = ({ icon: Icon, title, description, link, index }: FeatureCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });
  const [glowIntensity, setGlowIntensity] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  // Handle mouse movement for 3D tilt and parallax
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || !cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;

    // Calculate tilt (max 10 degrees)
    const rotateX = (mouseY / (rect.height / 2)) * -10;
    const rotateY = (mouseX / (rect.width / 2)) * 10;

    // Calculate mouse position relative to card for parallax
    const relativeX = (mouseX / (rect.width / 2)) * 100; // -100 to 100
    const relativeY = (mouseY / (rect.height / 2)) * 100; // -100 to 100

    setTilt({ rotateX, rotateY });
    setMousePosition({ x: relativeX, y: relativeY });
    setGlowIntensity(Math.min(1, Math.abs(mouseX) / 100 + Math.abs(mouseY) / 100));
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    setGlowIntensity(1);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ rotateX: 0, rotateY: 0 });
    setMousePosition({ x: 0, y: 0 });
    setGlowIntensity(0);
  };

  // Keyboard accessibility
  const handleFocus = () => {
    setIsFocused(true);
    setGlowIntensity(1);
  };

  const handleBlur = () => {
    setIsFocused(false);
    setGlowIntensity(0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (link) {
        // Handle navigation
      }
    }
  };

  // Floating animation
  useEffect(() => {
    if (prefersReducedMotion) return;

    const interval = setInterval(() => {
      if (!isHovered && cardRef.current) {
        const floatY = Math.sin(Date.now() * 0.002 + index * 0.5) * 2;
        cardRef.current.style.transform = `translateY(${floatY}px)`;
      }
    }, 16);

    return () => clearInterval(interval);
  }, [isHovered, index, prefersReducedMotion]);

  // Flash effect for quick movements
  useEffect(() => {
    if (prefersReducedMotion) return;

    let flashTimeout: NodeJS.Timeout;
    if (glowIntensity > 0.8 && !isHovered) {
      if (cardRef.current) {
        cardRef.current.style.animation = 'flash 0.3s ease-out';
        flashTimeout = setTimeout(() => {
          if (cardRef.current) {
            cardRef.current.style.animation = '';
          }
        }, 300);
      }
    }

    return () => {
      if (flashTimeout) clearTimeout(flashTimeout);
    };
  }, [glowIntensity, isHovered, prefersReducedMotion]);

  const cardContent = (
    <motion.div
      ref={cardRef}
      className={cn(
        "feature-card group relative p-8 rounded-2xl",
        "bg-gradient-to-br from-gray-900/80 to-gray-800/60",
        "backdrop-blur-md border border-gray-700/50",
        "transition-all duration-300 ease-out",
        "hover:shadow-2xl hover:shadow-[#00FF9C]/20",
        "focus:outline-none focus:ring-2 focus:ring-[#00FF9C] focus:ring-offset-2 focus:ring-offset-gray-900",
        "cursor-pointer select-none",
        isHovered && "scale-105",
        isFocused && "scale-105 ring-2 ring-[#00FF9C]"
      )}
      style={{
        transform: prefersReducedMotion ? undefined : `perspective(1000px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)`,
        boxShadow: `0 8px 32px rgba(0, 0, 0, 0.3), 0 0 ${glowIntensity * 20}px rgba(0, 255, 156, ${glowIntensity * 0.3})`
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      tabIndex={link ? 0 : -1}
      role={link ? "button" : "article"}
      aria-label={`${title}: ${description}`}
    >
      {/* Glow border effect */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300"
        style={{
          background: `linear-gradient(135deg, rgba(0, 255, 156, ${glowIntensity * 0.1}), rgba(0, 255, 156, ${glowIntensity * 0.05}))`,
          boxShadow: `inset 0 0 ${glowIntensity * 10}px rgba(0, 255, 156, ${glowIntensity * 0.2})`
        }}
      />

      {/* Content */}
      <div className="relative z-10">
        {/* Icon with parallax */}
        <motion.div
          className="flex justify-center mb-6"
          style={{
            transform: prefersReducedMotion ? undefined : `translate(${mousePosition.x * 0.1}px, ${mousePosition.y * 0.1}px)`
          }}
        >
          <motion.div
            animate={isHovered ? { y: -5 } : { y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <Icon
              className={cn(
                "h-12 w-12 transition-colors duration-300",
                isHovered || isFocused ? "text-[#00FF9C]" : "text-[#00FF9C]/80"
              )}
            />
          </motion.div>
        </motion.div>

        {/* Title with parallax */}
        <motion.h3
          className="text-xl font-bold mb-4 text-center text-white leading-relaxed"
          style={{
            transform: prefersReducedMotion ? undefined : `translate(${mousePosition.x * 0.05}px, ${mousePosition.y * 0.05}px)`
          }}
        >
          {title}
        </motion.h3>

        {/* Description with parallax */}
        <motion.p
          className="text-gray-300 text-center leading-relaxed"
          style={{
            transform: prefersReducedMotion ? undefined : `translate(${mousePosition.x * 0.03}px, ${mousePosition.y * 0.03}px)`
          }}
        >
          {description}
        </motion.p>
      </div>

      {/* Particle effects on hover */}
      <AnimatePresence>
        {isHovered && !prefersReducedMotion && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-[#00FF9C] rounded-full"
                initial={{
                  opacity: 0,
                  scale: 0,
                  x: Math.random() * 100 + '%',
                  y: Math.random() * 100 + '%'
                }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                  x: Math.random() * 100 + '%',
                  y: Math.random() * 100 + '%'
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.3,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );

  return link ? (
    <Link to={link} className="block">
      {cardContent}
    </Link>
  ) : (
    cardContent
  );
};
