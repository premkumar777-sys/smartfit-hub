import { motion, AnimatePresence } from 'framer-motion';
import { Target, ArrowDown, RotateCcw } from 'lucide-react';

interface AngleGuidanceProps {
  exercise: 'squat' | 'pushup' | 'bicepCurl' | 'idle';
  phase: 'down' | 'up' | 'hold';
}

interface GuidanceData {
  title: string;
  angles: { label: string; value: string; icon: React.ReactNode }[];
  tips: string[];
}

/**
 * Visual angle guidance display
 * Shows instructional angle hints synchronized with animation
 * Does NOT calculate real user angles - purely instructional
 */
export function AngleGuidance({ exercise, phase }: AngleGuidanceProps) {
  const getGuidanceData = (): GuidanceData | null => {
    switch (exercise) {
      case 'squat':
        return {
          title: 'Squat Form Guide',
          angles: [
            { label: 'Knee Angle', value: phase === 'down' ? '≈ 90°' : '≈ 180°', icon: <Target className="w-4 h-4" /> },
            { label: 'Hip Angle', value: phase === 'down' ? '≈ 90°' : '≈ 180°', icon: <RotateCcw className="w-4 h-4" /> },
            { label: 'Back', value: 'Straight', icon: <ArrowDown className="w-4 h-4" /> },
          ],
          tips: [
            'Keep knees aligned with toes',
            'Push hips back as you descend',
            'Keep chest up and core tight',
            'Feet shoulder-width apart',
          ],
        };
      case 'pushup':
        return {
          title: 'Push-up Form Guide',
          angles: [
            { label: 'Elbow Angle', value: phase === 'down' ? '≈ 90°' : '≈ 180°', icon: <Target className="w-4 h-4" /> },
            { label: 'Body Line', value: 'Straight', icon: <ArrowDown className="w-4 h-4" /> },
            { label: 'Core', value: 'Engaged', icon: <RotateCcw className="w-4 h-4" /> },
          ],
          tips: [
            'Hands slightly wider than shoulders',
            'Keep elbows at 45° from body',
            'Maintain straight line from head to heels',
            'Lower chest to near floor',
          ],
        };
      case 'bicepCurl':
        return {
          title: 'Bicep Curl Form Guide',
          angles: [
            { label: 'Elbow Position', value: 'Fixed at side', icon: <Target className="w-4 h-4" /> },
            { label: 'Forearm Angle', value: phase === 'up' ? '≈ 30°' : '≈ 150°', icon: <RotateCcw className="w-4 h-4" /> },
            { label: 'Wrist', value: 'Neutral', icon: <ArrowDown className="w-4 h-4" /> },
          ],
          tips: [
            'Keep elbows close to body',
            'Control the movement both ways',
            'Squeeze at the top',
            'Don\'t swing the weights',
          ],
        };
      default:
        return null;
    }
  };

  const data = getGuidanceData();

  if (!data) {
    return (
      <div className="bg-card/80 backdrop-blur-sm rounded-xl p-6 border border-border">
        <p className="text-muted-foreground text-center">
          Select an exercise to see form guidance
        </p>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={exercise}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-card/80 backdrop-blur-sm rounded-xl p-6 border border-border space-y-4"
      >
        <h3 className="text-lg font-bold text-primary">{data.title}</h3>

        {/* Angle indicators */}
        <div className="grid grid-cols-3 gap-3">
          {data.angles.map((angle, index) => (
            <motion.div
              key={angle.label}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              className="bg-muted/50 rounded-lg p-3 text-center"
            >
              <div className="flex justify-center text-primary mb-1">
                {angle.icon}
              </div>
              <p className="text-xs text-muted-foreground">{angle.label}</p>
              <motion.p
                key={`${angle.label}-${angle.value}`}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                className="text-sm font-bold text-foreground"
              >
                {angle.value}
              </motion.p>
            </motion.div>
          ))}
        </div>

        {/* Tips */}
        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground">Key Points:</p>
          <ul className="space-y-1">
            {data.tips.map((tip, index) => (
              <motion.li
                key={tip}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="text-sm text-muted-foreground flex items-start gap-2"
              >
                <span className="text-primary mt-1">•</span>
                {tip}
              </motion.li>
            ))}
          </ul>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
