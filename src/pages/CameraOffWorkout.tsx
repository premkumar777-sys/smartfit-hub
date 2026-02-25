import { useState, useCallback, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  Video,
  PlayCircle,
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
// Video data for the workout videos section
const WORKOUT_VIDEOS = [
  {
    id: 1,
    title: "Squats",
    duration: "0:24",
    thumbnail: "/videos/thumbnails/squat.jpg",
    videoUrl: "squat.mp4",
    category: "Squats",
  },
  {
    id: 2,
    title: "Triceps",
    duration: "0:24",
    thumbnail: "/videos/thumbnails/triceps.png",
    videoUrl: "overheadtriceps.mp4",
    category: "Arms",
  },
  {
    id: 3,
    title: "Push-Ups",
    duration: "0:23",
    thumbnail: "/videos/thumbnails/pushup.png",
    videoUrl: "pushup.mp4",
    category: "Upper Body",
  },
  {
    id: 4,
    title: "Core Strengthening",
    duration: "0:46",
    thumbnail: "/videos/thumbnails/core.png",
    videoUrl: "abs.mp4",
    category: "Core",
  },
  {
    id: 5,
    title: "Bicep Workout",
    duration: "0:25",
    thumbnail: "/videos/thumbnails/bicep.png",
    videoUrl: "bicep.mp4",
    category: "Arms",
  },
  {
    id: 6,
    title: "Lat Pulls",
    duration: "0:32",
    thumbnail: "/videos/thumbnails/latpulls.png",
    videoUrl: "latpulls.mp4",
    category: "Lats",
  },
  {
    id: 7,
    title: "ChestFly Workout",
    duration: "0:23",
    thumbnail: "/videos/thumbnails/chestfly.png",
    videoUrl: "chestfly.mp4",
    category: "Chest",
  },
  {
    id: 8,
    title: "Shoulder Press",
    duration: "0:26",
    thumbnail: "/videos/thumbnails/shoulderpress.png",
    videoUrl: "shoulderpress.mp4",
    category: "Shoulders",
  },
  {
    id: 9,
    title: "Pullups",
    duration: "0:20",
    thumbnail: "/videos/thumbnails/pullup.png",
    videoUrl: "pullups.mp4",
    category: "Upper Body",
  },
];

export default function CameraOffWorkout() {
  const navigate = useNavigate();
  const [selectedExercise, setSelectedExercise] = useState<Exercise>('idle');
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [trainerMode, setTrainerMode] = useState<'3d' | 'real'>('3d');
  const [animationPhase, setAnimationPhase] = useState<'down' | 'up' | 'hold'>('hold');
  const [currentCueIndex, setCurrentCueIndex] = useState(0);
  const [activeVideo, setActiveVideo] = useState<typeof WORKOUT_VIDEOS[0] | null>(null);

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
          <Button onClick={() => navigate(-1)} variant="ghost">
            <ArrowLeft className="mr-2" aria-hidden="true" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <div className="flex p-1 bg-muted rounded-lg border border-border mr-4">
              <button
                onClick={() => setTrainerMode('3d')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${trainerMode === '3d' ? 'bg-primary text-black shadow-lg' : 'text-muted-foreground hover:text-primary'}`}
              >
                3D AI
              </button>
              <button
                onClick={() => setTrainerMode('real')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${trainerMode === 'real' ? 'bg-primary text-black shadow-lg' : 'text-muted-foreground hover:text-primary'}`}
              >
                Pure Real
              </button>
            </div>
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
            {trainerMode === '3d' ? (
              <TrainerScene
                exercise={isWorkoutActive ? selectedExercise : 'idle'}
                isAnimating={isWorkoutActive || selectedExercise !== 'idle'}
              />
            ) : (
              <div className="relative w-full h-[400px] md:h-[500px] rounded-2xl overflow-hidden bg-black border border-primary/20 group">
                {selectedExercise === 'idle' ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 bg-gradient-to-br from-neutral-900 to-black">
                    <Video className="w-16 h-16 text-primary/20" />
                    <p className="text-muted-foreground uppercase tracking-widest text-xs font-black">Select an exercise to initialize video</p>
                  </div>
                ) : (
                  <video
                    key={selectedExercise}
                    src={`/${selectedExercise}.mp4`}
                    autoPlay
                    loop
                    muted
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                  />
                )}
                <div className="absolute inset-0 pointer-events-none border-[1px] border-white/5 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                <div className="absolute bottom-6 left-6 flex items-center gap-3">
                  <div className="px-3 py-1 rounded-full bg-primary/20 border border-primary/30 backdrop-blur-md">
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">Live Demonstration</span>
                  </div>
                </div>
              </div>
            )}

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
                    className={`p-4 rounded-xl border transition-all ${selectedExercise === exercise.id
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

        {/* Workout Videos Section */}
        <div className="mt-12">
          <div className="mb-6">
            <h2 className="text-3xl md:text-4xl font-bold leading-tight mb-2 flex items-center gap-3">
              <Video className="w-8 h-8 text-primary" />
              Workout Videos
            </h2>
            <p className="text-lg text-muted-foreground">
              Watch these guided workout videos to perfect your form and technique
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {WORKOUT_VIDEOS.map((video) => (
              <motion.div
                key={video.id}
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveVideo(video)}
                className="group relative bg-card/80 backdrop-blur-sm rounded-2xl overflow-hidden border border-border hover:border-primary/50 transition-all duration-300 cursor-pointer"
              >
                {/* Video Thumbnail */}
                <div className="relative aspect-video bg-gradient-to-br from-primary/20 via-primary/10 to-muted overflow-hidden">
                  {/* Thumbnail image */}
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      // Hide broken image and show fallback
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  {/* Fallback icon when no thumbnail */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Dumbbell className="w-16 h-16 text-primary/30" />
                  </div>

                  {/* Play button overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center shadow-lg shadow-primary/30"
                    >
                      <PlayCircle className="w-10 h-10 text-primary-foreground" />
                    </motion.div>
                  </div>

                  {/* Duration badge */}
                  <div className="absolute bottom-2 right-2 px-2 py-1 rounded-md bg-black/70 text-xs font-medium text-white">
                    {video.duration}
                  </div>

                  {/* Category badge */}
                  <div className="absolute top-2 left-2 px-2 py-1 rounded-md bg-primary/90 text-xs font-semibold text-primary-foreground">
                    {video.category}
                  </div>
                </div>

                {/* Video info */}
                <div className="p-4">
                  <h4 className="font-semibold text-lg group-hover:text-primary transition-colors">
                    {video.title}
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                    <Video className="w-4 h-4" />
                    Click to watch
                  </p>
                </div>

                {/* Glow effect on hover */}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{
                    boxShadow: 'inset 0 0 20px rgba(0, 255, 156, 0.1), 0 0 30px rgba(0, 255, 156, 0.15)'
                  }}
                />
              </motion.div>
            ))}
          </div>

          {/* Add more videos hint */}
          <div className="mt-8 text-center">
            <p className="text-muted-foreground text-sm">
              💡 <strong>Tip:</strong> You can add your own workout videos by placing them in the <code className="bg-muted px-2 py-1 rounded text-xs">/public/videos</code> folder
            </p>
          </div>
        </div>

        {/* Video Player Modal */}
        <AnimatePresence>
          {activeVideo && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
              onClick={() => setActiveVideo(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", damping: 20 }}
                className="relative w-full max-w-4xl bg-card rounded-2xl overflow-hidden border border-border shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <div>
                    <h3 className="text-xl font-bold">{activeVideo.title}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-primary/20 text-primary text-xs font-medium">
                        {activeVideo.category}
                      </span>
                      <span>{activeVideo.duration}</span>
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveVideo(null)}
                    className="hover:bg-destructive/20 hover:text-destructive"
                  >
                    ✕ Close
                  </Button>
                </div>

                {/* Video Player */}
                <div className="relative aspect-video bg-black">
                  <video
                    src={activeVideo.videoUrl}
                    controls
                    autoPlay
                    className="w-full h-full"
                    poster={activeVideo.thumbnail}
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>

                {/* Modal Footer */}
                <div className="p-4 bg-muted/30 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    <strong>Pro tip:</strong> Follow along with the video and practice proper form.
                    Use the 3D trainer above to see the exercise from different angles.
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </Container>

      {/* Video Player Modal */}
      <AnimatePresence>
        {activeVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
            onClick={() => setActiveVideo(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 20 }}
              className="relative w-full max-w-4xl bg-card rounded-2xl overflow-hidden border border-border shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div>
                  <h3 className="text-xl font-bold">{activeVideo.title}</h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-primary/20 text-primary text-xs font-medium">
                      {activeVideo.category}
                    </span>
                    <span>{activeVideo.duration}</span>
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveVideo(null)}
                  className="hover:bg-destructive/20 hover:text-destructive"
                >
                  ✕ Close
                </Button>
              </div>

              {/* Video Player */}
              <div className="relative aspect-video bg-black">
                <video
                  src={activeVideo.videoUrl}
                  controls
                  autoPlay
                  className="w-full h-full"
                  poster={activeVideo.thumbnail}
                >
                  Your browser does not support the video tag.
                </video>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-muted/30 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  <strong>Pro tip:</strong> Follow along with the video and practice proper form.
                  Use the 3D trainer above to see the exercise from different angles.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
