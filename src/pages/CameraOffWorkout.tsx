import { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Play,
  Square,
  Volume2,
  VolumeX,
  Dumbbell,
  Trophy,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/Container';
import { TrainerScene } from '@/components/TrainerScene';
import { AngleGuidance } from '@/components/AngleGuidance';
import { WorkoutTimer } from '@/components/WorkoutTimer';
import { useVoiceCoach } from '@/hooks/useVoiceCoach';

type Exercise = 'squat' | 'pushup' | 'bicepCurl' | 'idle';

interface ExerciseConfig {
  id: Exercise;
  name: string;
  duration: number;
  icon: React.ReactNode;
  description: string;
  voiceIntro: string;
  voiceMidCues: string[];
  voiceComplete: string;
}

const EXERCISES: ExerciseConfig[] = [
  {
    id: 'squat',
    name: 'Squats',
    duration: 30,
    icon: <Dumbbell className="w-5 h-5" />,
    description: 'Build lower body strength with proper squat form',
    voiceIntro: 'Let\'s start with squats! Stand with feet shoulder-width apart. Keep your back straight and core engaged.',
    voiceMidCues: [
      'Lower down, keep those knees behind your toes!',
      'Push through your heels as you come up!',
      'Great form! Keep that chest up!',
      'Halfway there, you\'re doing amazing!',
    ],
    voiceComplete: 'Excellent work on those squats! Take a moment to rest.',
  },
  {
    id: 'pushup',
    name: 'Push-ups',
    duration: 30,
    icon: <Dumbbell className="w-5 h-5" />,
    description: 'Strengthen chest, shoulders, and triceps',
    voiceIntro: 'Time for push-ups! Get into plank position. Keep your body in a straight line from head to heels.',
    voiceMidCues: [
      'Lower your chest to the ground, elbows at 45 degrees!',
      'Push up strong! Engage that core!',
      'Keep breathing! You\'ve got this!',
      'Almost there, maintain that form!',
    ],
    voiceComplete: 'Push-ups complete! Great upper body work!',
  },
  {
    id: 'bicepCurl',
    name: 'Bicep Curls',
    duration: 30,
    icon: <Dumbbell className="w-5 h-5" />,
    description: 'Isolate and build your bicep muscles',
    voiceIntro: 'Bicep curls! Keep your elbows fixed at your sides. Control the movement up and down.',
    voiceMidCues: [
      'Squeeze at the top of the curl!',
      'Control the descent, don\'t let gravity do the work!',
      'Keep those elbows still!',
      'Great control! Keep it up!',
    ],
    voiceComplete: 'Bicep curls finished! Feel that pump!',
  },
];

/**
 * Camera OFF Workout Page
 * Provides a 3D exercise demonstration system with voice coaching
 * Users follow along with the animated trainer - no camera required
 */
export default function CameraOffWorkout() {
  const [selectedExercise, setSelectedExercise] = useState<Exercise>('idle');
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [animationPhase, setAnimationPhase] = useState<'down' | 'up' | 'hold'>('hold');
  const [currentCueIndex, setCurrentCueIndex] = useState(0);

  const { speak, stop } = useVoiceCoach({ rate: 0.95, pitch: 1.1 });

  const currentExerciseConfig = EXERCISES.find((e) => e.id === selectedExercise);

  // Handle exercise selection
  const handleExerciseSelect = useCallback((exercise: Exercise) => {
    if (isWorkoutActive) return;
    setSelectedExercise(exercise);
    setIsComplete(false);
  }, [isWorkoutActive]);

  // Start workout
  const handleStartWorkout = useCallback(() => {
    if (selectedExercise === 'idle') return;
    
    setIsWorkoutActive(true);
    setIsComplete(false);
    setCurrentCueIndex(0);

    if (voiceEnabled && currentExerciseConfig) {
      speak(currentExerciseConfig.voiceIntro, true);
    }
  }, [selectedExercise, voiceEnabled, currentExerciseConfig, speak]);

  // Stop workout
  const handleStopWorkout = useCallback(() => {
    setIsWorkoutActive(false);
    stop();
  }, [stop]);

  // Timer tick handler for voice cues
  const handleTimerTick = useCallback((remaining: number) => {
    // Update animation phase based on time (simulate up/down motion)
    const phase = remaining % 4 < 2 ? 'down' : 'up';
    setAnimationPhase(phase);

    // Voice cues at specific intervals
    if (voiceEnabled && currentExerciseConfig) {
      const cues = currentExerciseConfig.voiceMidCues;
      const interval = Math.floor(currentExerciseConfig.duration / (cues.length + 1));
      
      const cueIndex = Math.floor((currentExerciseConfig.duration - remaining) / interval);
      if (cueIndex > currentCueIndex && cueIndex <= cues.length) {
        speak(cues[cueIndex - 1], true);
        setCurrentCueIndex(cueIndex);
      }

      // Countdown at the end
      if (remaining === 5) speak('Five seconds left!', true);
      if (remaining === 3) speak('Three!', true);
      if (remaining === 2) speak('Two!', true);
      if (remaining === 1) speak('One!', true);
    }
  }, [voiceEnabled, currentExerciseConfig, currentCueIndex, speak]);

  // Timer complete handler
  const handleTimerComplete = useCallback(() => {
    setIsWorkoutActive(false);
    setIsComplete(true);
    
    if (voiceEnabled && currentExerciseConfig) {
      speak(currentExerciseConfig.voiceComplete, true);
    }
  }, [voiceEnabled, currentExerciseConfig, speak]);

  // Load voices on mount
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  return (
    <div className="min-h-screen bg-background py-20">
      <Container>
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <Button asChild variant="ghost">
            <Link to="/dashboard" aria-label="Back to dashboard">
              <ArrowLeft className="mr-2" aria-hidden="true" />
              Back to Dashboard
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className="flex items-center gap-2"
          >
            {voiceEnabled ? (
              <>
                <Volume2 className="w-4 h-4" />
                Voice On
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4" />
                Voice Off
              </>
            )}
          </Button>
        </div>

        {/* Title */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-2 flex items-center gap-3">
            <Sparkles className="w-10 h-10 text-primary" />
            3D Trainer Mode
          </h1>
          <p className="text-lg text-muted-foreground">
            Follow the animated trainer - no camera required! Watch the form demonstration and follow along.
          </p>
        </div>

        {/* Main content grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: 3D Trainer */}
          <div className="lg:col-span-2 space-y-4">
            <TrainerScene
              exercise={isWorkoutActive ? selectedExercise : 'idle'}
              isAnimating={isWorkoutActive || selectedExercise !== 'idle'}
            />

            {/* Exercise selector */}
            <div className="bg-card/80 backdrop-blur-sm rounded-xl p-4 border border-border">
              <p className="text-sm font-semibold mb-3">Select Exercise:</p>
              <div className="grid grid-cols-3 gap-3">
                {EXERCISES.map((exercise) => (
                  <motion.button
                    key={exercise.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleExerciseSelect(exercise.id)}
                    disabled={isWorkoutActive}
                    className={`p-4 rounded-xl border transition-all ${
                      selectedExercise === exercise.id
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-muted/50 border-border hover:border-primary/50'
                    } ${isWorkoutActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      {exercise.icon}
                      <span className="text-sm font-medium">{exercise.name}</span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Start/Stop button */}
            <div className="flex justify-center">
              {!isWorkoutActive ? (
                <Button
                  size="lg"
                  onClick={handleStartWorkout}
                  disabled={selectedExercise === 'idle'}
                  className="px-8 py-6 text-lg"
                >
                  <Play className="w-6 h-6 mr-2" />
                  Start Workout
                </Button>
              ) : (
                <Button
                  size="lg"
                  variant="destructive"
                  onClick={handleStopWorkout}
                  className="px-8 py-6 text-lg"
                >
                  <Square className="w-6 h-6 mr-2" />
                  Stop Workout
                </Button>
              )}
            </div>
          </div>

          {/* Right: Guidance & Timer */}
          <div className="space-y-4">
            {/* Timer */}
            <WorkoutTimer
              duration={currentExerciseConfig?.duration || 30}
              isRunning={isWorkoutActive}
              onComplete={handleTimerComplete}
              onTick={handleTimerTick}
            />

            {/* Angle guidance */}
            <AngleGuidance
              exercise={selectedExercise}
              phase={animationPhase}
            />

            {/* Completion message */}
            <AnimatePresence>
              {isComplete && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl p-6 border border-primary/30 text-center"
                >
                  <Trophy className="w-12 h-12 text-primary mx-auto mb-3" />
                  <h3 className="text-xl font-bold mb-2">Workout Complete! 🎉</h3>
                  <p className="text-muted-foreground">
                    Great job following along with the trainer!
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => {
                      setIsComplete(false);
                      setSelectedExercise('idle');
                    }}
                  >
                    Choose Another Exercise
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Info banner */}
        <div className="mt-8 bg-muted/50 rounded-xl p-6 border border-border">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            About 3D Trainer Mode
          </h3>
          <p className="text-muted-foreground text-sm">
            This is a <strong>3D exercise demonstration system</strong>, not real-time form detection.
            Watch the animated trainer to learn proper exercise form, then follow along at your own pace.
            The angle guidance shows you the target positions to aim for during each exercise.
          </p>
        </div>
      </Container>
    </div>
  );
}
