import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Timer, Pause, Play, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WorkoutTimerProps {
  duration: number; // in seconds
  isRunning: boolean;
  onComplete: () => void;
  onTick?: (remaining: number) => void;
  onPause?: () => void;
  onResume?: () => void;
  onReset?: () => void;
}

/**
 * Workout timer with visual progress
 * Calls onTick for voice coaching cues
 */
export function WorkoutTimer({
  duration,
  isRunning,
  onComplete,
  onTick,
  onPause,
  onResume,
  onReset,
}: WorkoutTimerProps) {
  const [remaining, setRemaining] = useState(duration);
  const [isPaused, setIsPaused] = useState(false);

  // Reset timer when duration changes
  useEffect(() => {
    setRemaining(duration);
    setIsPaused(false);
  }, [duration]);

  // Timer logic
  useEffect(() => {
    if (!isRunning || isPaused || remaining <= 0) return;

    const interval = setInterval(() => {
      setRemaining((prev) => {
        const newValue = prev - 1;
        onTick?.(newValue);
        
        if (newValue <= 0) {
          onComplete();
          return 0;
        }
        return newValue;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, isPaused, remaining, onComplete, onTick]);

  const handlePauseResume = useCallback(() => {
    if (isPaused) {
      setIsPaused(false);
      onResume?.();
    } else {
      setIsPaused(true);
      onPause?.();
    }
  }, [isPaused, onPause, onResume]);

  const handleReset = useCallback(() => {
    setRemaining(duration);
    setIsPaused(false);
    onReset?.();
  }, [duration, onReset]);

  const progress = ((duration - remaining) / duration) * 100;
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  return (
    <div className="bg-card/80 backdrop-blur-sm rounded-xl p-6 border border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Timer className="w-5 h-5 text-primary" />
          <span className="font-semibold">Workout Timer</span>
        </div>
        <div className="flex gap-2">
          {isRunning && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={handlePauseResume}
                className="h-8 w-8 p-0"
              >
                {isPaused ? (
                  <Play className="w-4 h-4" />
                ) : (
                  <Pause className="w-4 h-4" />
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleReset}
                className="h-8 w-8 p-0"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Time display */}
      <div className="text-center mb-4">
        <motion.span
          key={remaining}
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          className="text-5xl font-bold tabular-nums"
        >
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </motion.span>
        {isPaused && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-yellow-500 mt-1"
          >
            PAUSED
          </motion.p>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-3 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-primary to-primary/70"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Status text */}
      <p className="text-center text-sm text-muted-foreground mt-2">
        {!isRunning
          ? 'Ready to start'
          : remaining <= 5
          ? 'Almost done! 💪'
          : remaining <= 10
          ? 'Final stretch!'
          : 'Keep going!'}
      </p>
    </div>
  );
}
