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
  const innerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState({ x: 0, y: 0, z: 0 });
  const [isFocused, setIsFocused] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  // Throttle mouse move for better performance
  const mouseMoveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const rafRef = useRef<number | null>(null);

  // New 3D card flip animation on mouse move
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || !cardRef.current) return;

    // Throttle updates
    if (mouseMoveTimeoutRef.current) return;

    mouseMoveTimeoutRef.current = setTimeout(() => {
      mouseMoveTimeoutRef.current = null;
    }, 16);

    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;

    // Calculate rotation for 3D flip effect (gentler to reduce shake)
    const rotateY = (mouseX / rect.width) * 10; // -10 to 10 degrees
    const rotateX = -(mouseY / rect.height) * 8; // -8 to 8 degrees

    // Calculate mouse position for parallax (smaller range)
    const normalizedX = (mouseX / (rect.width / 2)) * 60;
    const normalizedY = (mouseY / (rect.height / 2)) * 60;

    setRotation({ x: rotateX, y: rotateY, z: 0 });
    setMousePosition({ x: normalizedX, y: normalizedY });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotation({ x: 0, y: 0, z: 0 });
    setMousePosition({ x: 0, y: 0 });
    
    if (mouseMoveTimeoutRef.current) {
      clearTimeout(mouseMoveTimeoutRef.current);
      mouseMoveTimeoutRef.current = null;
    }
  };

  // Keyboard accessibility
  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
    }
  };

  // Smooth floating animation with card stack effect
  useEffect(() => {
    if (prefersReducedMotion) return;

    let startTime = Date.now();
    const baseDelay = index * 0.2; // Stagger cards

    const animate = () => {
      if (!cardRef.current || isHovered) {
        rafRef.current = requestAnimationFrame(animate);
        return;
      }

      const elapsed = (Date.now() - startTime) * 0.001;
      const floatY = Math.sin(elapsed * 0.8 + baseDelay) * 1.5;
      const floatX = Math.cos(elapsed * 0.6 + baseDelay) * 1;

      // Minimal movement to avoid visible shake
      cardRef.current.style.transform = `translate3d(${floatX}px, ${floatY}px, 0)`;
      
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isHovered, index, prefersReducedMotion]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mouseMoveTimeoutRef.current) {
        clearTimeout(mouseMoveTimeoutRef.current);
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const cardContent = (
    <motion.div
      ref={cardRef}
      className={cn(
        "feature-card-3d group relative p-8 rounded-2xl",
        "bg-gradient-to-br from-gray-900/90 to-gray-800/70",
        "backdrop-blur-md border-2 border-transparent",
        "transition-all duration-300 ease-out",
        "focus:outline-none focus:ring-2 focus:ring-[#00FF9C] focus:ring-offset-2 focus:ring-offset-gray-900",
        "cursor-pointer select-none overflow-hidden",
        isHovered && "border-[#00FF9C]/40",
        isFocused && "ring-2 ring-[#00FF9C] border-[#00FF9C]/40"
      )}
      style={{
        transformStyle: 'preserve-3d',
        perspective: '1000px',
        transform: prefersReducedMotion ? undefined : `perspective(1000px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) rotateZ(${rotation.z}deg)`,
        willChange: 'transform'
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
      {/* Animated gradient background */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle at ${50 + mousePosition.x * 0.1}% ${50 + mousePosition.y * 0.1}%, rgba(0, 255, 156, 0.15), transparent 70%)`
        }}
      />

      {/* Glowing border effect */}
      <div 
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          boxShadow: isHovered ? `inset 0 0 30px rgba(0, 255, 156, 0.2), 0 0 40px rgba(0, 255, 156, 0.3)` : 'none'
        }}
      />

      {/* Content wrapper with 3D transform */}
      <div
        ref={innerRef}
        className="relative z-10"
        style={{
          transform: prefersReducedMotion ? undefined : `translateZ(20px) translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`,
          transformStyle: 'preserve-3d',
          willChange: 'transform'
        }}
      >
        {/* Icon with 3D rotation */}
        <motion.div
          className="flex justify-center mb-6"
          style={{
            transform: prefersReducedMotion ? undefined : `translateZ(30px) rotateY(${rotation.y * 0.25}deg)`,
            transformStyle: 'preserve-3d'
          }}
        >
          <motion.div
            animate={isHovered ? { 
              scale: 1.15,
              rotateY: 180,
              rotateX: 10
            } : { 
              scale: 1,
              rotateY: 0,
              rotateX: 0
            }}
            transition={{ 
              type: "spring", 
              stiffness: 200, 
              damping: 15,
              duration: 0.6
            }}
            style={{ transformStyle: 'preserve-3d' }}
          >
            <Icon
              className={cn(
                "h-12 w-12 transition-all duration-500",
                isHovered || isFocused 
                  ? "text-[#00FF9C] drop-shadow-[0_0_15px_rgba(0,255,156,0.7)]" 
                  : "text-[#00FF9C]/80"
              )}
            />
          </motion.div>
        </motion.div>

        {/* Title with 3D depth */}
        <motion.h3
          className="text-xl font-bold mb-4 text-center text-white leading-relaxed"
          style={{
            transform: prefersReducedMotion ? undefined : `translateZ(25px)`,
            transformStyle: 'preserve-3d'
          }}
          animate={isHovered ? { 
            scale: 1.05,
            y: -5
          } : { 
            scale: 1,
            y: 0
          }}
          transition={{ duration: 0.3 }}
        >
          {title}
        </motion.h3>

        {/* Description */}
        <motion.p
          className="text-gray-300 text-center leading-relaxed"
          style={{
            transform: prefersReducedMotion ? undefined : `translateZ(15px)`,
            transformStyle: 'preserve-3d'
          }}
          animate={isHovered ? { opacity: 0.95 } : { opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {description}
        </motion.p>
      </div>

      {/* 3D corner accents */}
      <div className="absolute top-0 left-0 w-20 h-20 border-t-2 border-l-2 border-[#00FF9C]/0 group-hover:border-[#00FF9C]/50 rounded-tl-2xl transition-all duration-500" />
      <div className="absolute bottom-0 right-0 w-20 h-20 border-b-2 border-r-2 border-[#00FF9C]/0 group-hover:border-[#00FF9C]/50 rounded-br-2xl transition-all duration-500" />

      {/* Animated particles on hover */}
      <AnimatePresence>
        {isHovered && !prefersReducedMotion && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full bg-[#00FF9C]"
                style={{
                  boxShadow: `0 0 6px #00FF9C, 0 0 12px #00FF9C`
                }}
                initial={{
                  opacity: 0,
                  scale: 0,
                  x: '50%',
                  y: '50%',
                  z: 0
                }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 2, 0],
                  x: [`${40 + i * 5}%`, `${60 - i * 5}%`, `${50 + i * 3}%`],
                  y: [`${45 + i * 3}%`, `${55 - i * 3}%`, `${50 - i * 2}%`],
                  z: [0, 50, 0]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.25,
                  ease: "easeInOut"
                }}
              />
            ))}

            {/* Rotating ring effect */}
            <motion.div
              className="absolute inset-4 rounded-xl border border-[#00FF9C]/20"
              animate={{ rotateZ: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
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