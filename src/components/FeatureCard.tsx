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

  // Handle mouse movement for 3D depth and morphing effects
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || !cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;

    // Calculate 3D perspective shift (creates depth effect)
    const depthX = (mouseX / (rect.width / 2)) * 15; // -15 to 15
    const depthY = (mouseY / (rect.height / 2)) * 15; // -15 to 15

    // Calculate morphing scale based on mouse position
    const distanceFromCenter = Math.sqrt(mouseX * mouseX + mouseY * mouseY);
    const maxDistance = Math.sqrt((rect.width / 2) ** 2 + (rect.height / 2) ** 2);
    const morphScale = 1 + (distanceFromCenter / maxDistance) * 0.1; // 1.0 to 1.1

    setTilt({ rotateX: depthY, rotateY: depthX });
    setMousePosition({ x: mouseX / 10, y: mouseY / 10 }); // Reduced parallax
    setGlowIntensity(Math.min(1, distanceFromCenter / (maxDistance / 2)));
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

  // Enhanced floating animation with subtle breathing effect
  useEffect(() => {
    if (prefersReducedMotion) return;

    const interval = setInterval(() => {
      if (!isHovered && cardRef.current) {
        const time = Date.now() * 0.002;
        const floatY = Math.sin(time + index * 0.5) * 3;
        const breatheScale = 1 + Math.sin(time * 0.8 + index * 0.3) * 0.02; // Subtle breathing
        const subtleRotate = Math.sin(time * 0.5 + index * 0.7) * 0.5; // Subtle rotation

        cardRef.current.style.transform = `translateY(${floatY}px) scale(${breatheScale}) rotateZ(${subtleRotate}deg)`;
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
        "transition-all duration-400 ease-out",
        "hover:shadow-2xl hover:shadow-[#00FF9C]/20",
        "focus:outline-none focus:ring-2 focus:ring-[#00FF9C] focus:ring-offset-2 focus:ring-offset-gray-900",
        "cursor-pointer select-none",
        isHovered && "scale-105 border-[#00FF9C]/30",
        isFocused && "scale-105 ring-2 ring-[#00FF9C] border-[#00FF9C]/30"
      )}
      style={{
        transform: prefersReducedMotion ? undefined : `perspective(1200px) translateZ(${glowIntensity * 30}px) rotateX(${tilt.rotateX * 0.5}deg) rotateY(${tilt.rotateY * 0.5}deg) scale(${1 + glowIntensity * 0.08})`,
        boxShadow: `0 ${8 + glowIntensity * 12}px ${32 + glowIntensity * 20}px rgba(0, 0, 0, ${0.3 + glowIntensity * 0.2}), 0 0 ${glowIntensity * 25}px rgba(0, 255, 156, ${glowIntensity * 0.4}), 0 0 ${glowIntensity * 40}px rgba(76, 201, 240, ${glowIntensity * 0.2})`
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
        {/* Icon with 3D depth effect */}
        <motion.div
          className="flex justify-center mb-6"
          style={{
            transform: prefersReducedMotion ? undefined : `translateZ(${glowIntensity * 20}px) translate(${mousePosition.x * 0.08}px, ${mousePosition.y * 0.08}px) scale(${1 + glowIntensity * 0.1})`
          }}
        >
          <motion.div
            animate={isHovered ? { rotateY: 15, scale: 1.1 } : { rotateY: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <Icon
              className={cn(
                "h-12 w-12 transition-all duration-500",
                isHovered || isFocused ? "text-[#00FF9C] drop-shadow-[0_0_10px_rgba(0,255,156,0.6)]" : "text-[#00FF9C]/80"
              )}
            />
          </motion.div>
        </motion.div>

        {/* Title with 3D layering */}
        <motion.h3
          className="text-xl font-bold mb-4 text-center text-white leading-relaxed"
          style={{
            transform: prefersReducedMotion ? undefined : `translateZ(${glowIntensity * 15}px) translate(${mousePosition.x * 0.04}px, ${mousePosition.y * 0.04}px)`
          }}
          animate={isHovered ? { scale: 1.02 } : { scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          {title}
        </motion.h3>

        {/* Description with subtle depth */}
        <motion.p
          className="text-gray-300 text-center leading-relaxed"
          style={{
            transform: prefersReducedMotion ? undefined : `translateZ(${glowIntensity * 10}px) translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`
          }}
          animate={isHovered ? { opacity: 0.9 } : { opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {description}
        </motion.p>
      </div>

      {/* Enhanced 3D particle effects on hover */}
      <AnimatePresence>
        {isHovered && !prefersReducedMotion && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  background: `linear-gradient(45deg, ${['#00FF9C', '#4CC9F0', '#7B2CBF'][i % 3]}, transparent)`,
                  boxShadow: `0 0 10px ${['#00FF9C', '#4CC9F0', '#7B2CBF'][i % 3]}`
                }}
                initial={{
                  opacity: 0,
                  scale: 0,
                  x: Math.random() * 100 + '%',
                  y: Math.random() * 100 + '%',
                  rotateZ: 0
                }}
                animate={{
                  opacity: [0, 0.8, 0],
                  scale: [0, 1.5, 0],
                  x: [
                    Math.random() * 100 + '%',
                    Math.random() * 100 + '%',
                    Math.random() * 100 + '%'
                  ],
                  y: [
                    Math.random() * 100 + '%',
                    Math.random() * 100 + '%',
                    Math.random() * 100 + '%'
                  ],
                  rotateZ: [0, 180, 360]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 0.4,
                  ease: "easeInOut"
                }}
              />
            ))}

            {/* Energy waves */}
            <motion.div
              className="absolute inset-0 rounded-2xl border-2 border-[#00FF9C]/30"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1.1, opacity: [0, 0.5, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
            />
            <motion.div
              className="absolute inset-2 rounded-xl border border-[#4CC9F0]/20"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1.05, opacity: [0, 0.3, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, delay: 0.5, ease: "easeOut" }}
            />
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
