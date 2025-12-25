import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NeonButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  href?: string;
  children: React.ReactNode;
  className?: string;
}

const NeonButton: React.FC<NeonButtonProps> = ({
  href,
  children,
  className,
  onClick,
  ...props
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const wrapperClasses = cn(
    "relative inline-block group"
  );

  const buttonClasses = cn(
    "relative inline-flex items-center px-6 py-3 rounded-lg bg-[#00FF9C] text-black font-semibold",
    "hover:brightness-110 hover:scale-[1.05]",
    "transition-all duration-300 ease-out z-10",
    "focus:outline-none focus:ring-2 focus:ring-[#00FF9C] focus:ring-offset-2 focus:ring-offset-gray-900",
    className
  );

  const content = (
    <div
      className={wrapperClasses}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Animated gradient border */}
      <div
        className="absolute -inset-[2px] rounded-lg opacity-75 blur-sm transition-all duration-300 group-hover:opacity-100 group-hover:blur-md group-hover:-inset-[3px]"
        style={{
          background: 'linear-gradient(90deg, #00FF9C, #4CC9F0, #7B2CBF, #FF6B9D, #00FF9C)',
          backgroundSize: '300% 100%',
          animation: 'gradient-shift 3s ease infinite',
        }}
      />

      {/* Sparkle particles on hover */}
      {isHovered && (
        <>
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full pointer-events-none"
              style={{
                left: `${10 + Math.random() * 80}%`,
                top: `${10 + Math.random() * 80}%`,
                animation: `sparkle-${i % 4} 0.8s ease-out forwards`,
                boxShadow: '0 0 6px 2px rgba(255,255,255,0.8)',
              }}
            />
          ))}
        </>
      )}

      {/* Ripple effect */}
      <div
        className={`absolute inset-0 rounded-lg overflow-hidden pointer-events-none ${isHovered ? 'opacity-100' : 'opacity-0'}`}
        style={{ transition: 'opacity 0.3s' }}
      >
        <div
          className="absolute inset-0 rounded-lg"
          style={{
            background: 'radial-gradient(circle at center, rgba(255,255,255,0.4) 0%, transparent 70%)',
            animation: isHovered ? 'ripple 0.6s ease-out' : 'none',
          }}
        />
      </div>

      {/* Inner glow border */}
      <div
        className="absolute -inset-[1px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: 'linear-gradient(135deg, rgba(0,255,156,0.8), rgba(76,201,240,0.8), rgba(123,44,191,0.8))',
        }}
      />

      {/* Main button */}
      {href ? (
        <a href={href} className={buttonClasses}>
          <span className="relative z-10 flex items-center gap-2">
            {children}
          </span>
          {/* Arrow icon with slide effect */}
          <span
            className="relative z-10 ml-2 transition-transform duration-300 group-hover:translate-x-1"
            style={{ display: 'inline-block' }}
          >
            →
          </span>
        </a>
      ) : (
        <Button
          className={buttonClasses}
          onClick={onClick}
          {...props}
        >
          <span className="relative z-10 flex items-center gap-2">
            {children}
          </span>
        </Button>
      )}

      <style>{`
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        @keyframes ripple {
          0% { transform: scale(0); opacity: 1; }
          100% { transform: scale(2); opacity: 0; }
        }
        
        @keyframes sparkle-0 {
          0% { transform: translate(0, 0) scale(0); opacity: 1; }
          100% { transform: translate(-20px, -30px) scale(1); opacity: 0; }
        }
        @keyframes sparkle-1 {
          0% { transform: translate(0, 0) scale(0); opacity: 1; }
          100% { transform: translate(25px, -25px) scale(1.2); opacity: 0; }
        }
        @keyframes sparkle-2 {
          0% { transform: translate(0, 0) scale(0); opacity: 1; }
          100% { transform: translate(-15px, 20px) scale(0.8); opacity: 0; }
        }
        @keyframes sparkle-3 {
          0% { transform: translate(0, 0) scale(0); opacity: 1; }
          100% { transform: translate(20px, 15px) scale(1); opacity: 0; }
        }
      `}</style>
    </div>
  );

  return content;
};

export default NeonButton;
