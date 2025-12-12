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
  const buttonClasses = cn(
    "inline-flex items-center px-6 py-3 rounded-lg bg-[#00FF9C] text-black font-semibold",
    "hover:brightness-95 hover:scale-[1.03] hover:shadow-[0_0_20px_rgba(0,255,156,0.35)]",
    "transition-all duration-200 ease-out",
    "focus:outline-none focus:ring-2 focus:ring-[#00FF9C] focus:ring-offset-2 focus:ring-offset-gray-900",
    className
  );

  if (href) {
    return (
      <a href={href} className={buttonClasses}>
        {children}
      </a>
    );
  }

  return (
    <Button
      className={buttonClasses}
      onClick={onClick}
      {...props}
    >
      {children}
    </Button>
  );
};

export default NeonButton;
