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

  // Throttle mouse move for better performance
  const mouseMoveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle mouse movement for 3D depth and morphing effects (optimized)
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || !cardRef.current) return;

    // Throttle updates to ~60fps
    if (mouseMoveTimeoutRef.current) return;

    mouseMoveTimeoutRef.current = setTimeout(() => {
      mouseMoveTimeoutRef.current = null;
    }, 16);

    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;

    // Simplified calculations for better performance
    const depthX = (mouseX / rect.width) * 12; // Reduced from 15
    const depthY = (mouseY / rect.height) * 12; // Reduced from 15

    // Simplified distance calculation
    const distanceFromCenter = Math.abs(mouseX) + Math.abs(mouseY);
    const maxDistance = rect.width + rect.height;

    setTilt({ rotateX: depthY * 0.5, rotateY: depthX * 0.5 }); // Reduced rotation
    setMousePosition({ x: mouseX * 0.05, y: mouseY * 0.05 }); // Reduced parallax
    setGlowIntensity(Math.min(1, distanceFromCenter / (maxDistance * 0.3)));
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
    
    // Clear throttle timeout
    if (mouseMoveTimeoutRef.current) {
      clearTimeout(mouseMoveTimeoutRef.current);
      mouseMoveTimeoutRef.current = null;
    }
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

  // Optimized floating animation using requestAnimationFrame
  useEffect(() => {
    if (prefersReducedMotion || isHovered) return;

    let animationFrame: number;
    let startTime = Date.now();

    const animate = () => {
      if (!cardRef.current || isHovered) return;

      const elapsed = (Date.now() - startTime) * 0.001;
      const floatY = Math.sin(elapsed + index * 0.5) * 2; // Reduced from 3
      const breatheScale = 1 + Math.sin(elapsed * 0.6 + index * 0.3) * 0.01; // Reduced breathing

      // Use transform3d for GPU acceleration
      cardRef.current.style.transform = `translate3d(0, ${floatY}px, 0) scale(${breatheScale})`;
      
      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [isHovered, index, prefersReducedMotion]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mouseMoveTimeoutRef.current) {
        clearTimeout(mouseMoveTimeoutRef.current);
      }
    };
  }, []);

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
        transform: prefersReducedMotion ? undefined : `perspective(1200px) translate3d(0, 0, ${glowIntensity * 20}px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) scale(${1 + glowIntensity * 0.05})`,
        boxShadow: `0 ${8 + glowIntensity * 8}px ${24 + glowIntensity * 12}px rgba(0, 0, 0, ${0.3 + glowIntensity * 0.15}), 0 0 ${glowIntensity * 20}px rgba(0, 255, 156, ${glowIntensity * 0.3})`,
        willChange: 'transform, box-shadow'
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
        {/* Icon with optimized 3D depth effect */}
        <motion.div
          className="flex justify-center mb-6"
          style={{
            transform: prefersReducedMotion ? undefined : `translate3d(${mousePosition.x * 0.05}px, ${mousePosition.y * 0.05}px, ${glowIntensity * 15}px) scale(${1 + glowIntensity * 0.08})`,
            willChange: 'transform'
          }}
        >
          <motion.div
            animate={isHovered ? { scale: 1.08 } : { scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <Icon
              className={cn(
                "h-12 w-12 transition-colors duration-300",
                isHovered || isFocused ? "text-[#00FF9C] drop-shadow-[0_0_8px_rgba(0,255,156,0.5)]" : "text-[#00FF9C]/80"
              )}
            />
          </motion.div>
        </motion.div>

        {/* Title with optimized layering */}
        <motion.h3
          className="text-xl font-bold mb-4 text-center text-white leading-relaxed"
          style={{
            transform: prefersReducedMotion ? undefined : `translate3d(${mousePosition.x * 0.03}px, ${mousePosition.y * 0.03}px, ${glowIntensity * 10}px)`,
            willChange: 'transform'
          }}
          animate={isHovered ? { scale: 1.01 } : { scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          {title}
        </motion.h3>

        {/* Description with subtle depth */}
        <motion.p
          className="text-gray-300 text-center leading-relaxed"
          style={{
            transform: prefersReducedMotion ? undefined : `translate3d(${mousePosition.x * 0.015}px, ${mousePosition.y * 0.015}px, ${glowIntensity * 5}px)`,
            willChange: 'transform'
          }}
          transition={{ duration: 0.2 }}
        >
          {description}
        </motion.p>
      </div>

      {/* Optimized particle effects on hover (reduced for performance) */}
      <AnimatePresence>
        {isHovered && !prefersReducedMotion && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1.5 h-1.5 rounded-full"
                style={{
                  background: ['#00FF9C', '#4CC9F0', '#7B2CBF'][i],
                  boxShadow: `0 0 8px ${['#00FF9C', '#4CC9F0', '#7B2CBF'][i]}`
                }}
                initial={{
                  opacity: 0,
                  scale: 0,
                  x: '50%',
                  y: '50%'
                }}
                animate={{
                  opacity: [0, 0.6, 0],
                  scale: [0, 1.2, 0],
                  x: ['50%', `${30 + i * 20}%`, '50%'],
                  y: ['50%', `${40 + i * 15}%`, '50%']
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  delay: i * 0.3,
                  ease: "easeInOut"
                }}
              />
            ))}

            {/* Single energy wave for better performance */}
            <motion.div
              className="absolute inset-0 rounded-2xl border border-[#00FF9C]/20"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1.05, opacity: [0, 0.4, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
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
