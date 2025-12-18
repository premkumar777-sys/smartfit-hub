import React from 'react';
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
  const wrapperClasses = cn(
    "relative inline-block group"
  );

  const buttonClasses = cn(
    "relative inline-flex items-center px-6 py-3 rounded-lg bg-[#00FF9C] text-black font-semibold",
    "hover:brightness-95 hover:scale-[1.03]",
    "transition-all duration-300 ease-out z-10",
    "focus:outline-none focus:ring-2 focus:ring-[#00FF9C] focus:ring-offset-2 focus:ring-offset-gray-900",
    className
  );

  const content = (
    <div className={wrapperClasses}>
      {/* Animated gradient border */}
      <div
        className="absolute -inset-[2px] rounded-lg opacity-75 blur-sm transition-all duration-300 group-hover:opacity-100 group-hover:blur-md group-hover:-inset-[3px]"
        style={{
          background: 'linear-gradient(90deg, #00FF9C, #4CC9F0, #7B2CBF, #FF6B9D, #00FF9C)',
          backgroundSize: '300% 100%',
          animation: 'gradient-shift 3s ease infinite',
        }}
      />

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
      `}</style>
    </div>
  );

  return content;
};

export default NeonButton;
