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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { AngleGuidance } from '@/components/AngleGuidance';
import { WorkoutTimer } from '@/components/WorkoutTimer';
import { useVoiceCoach } from '@/hooks/useVoiceCoach';

type Exercise = 'squat' | 'pushup' | 'bicep' | 'overheadtriceps' | 'abs' | 'latpulls' | 'chestfly' | 'shoulderpress' | 'pullups' | 'legpress' | 'totalshoulder' | 'tricepext' | 'upperbody' | 'backrelaxing' | 'barshoulder' | 'idle';

interface ExerciseConfig {
  id: Exercise;
  name: string;
  duration: number;
  icon: React.ReactNode;
  description: string;
  videoFile: string;
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
    videoFile: 'squat.mp4',
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
    videoFile: 'pushup.mp4',
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
    id: 'bicep',
    name: 'Bicep Curls',
    duration: 30,
    icon: <Dumbbell className="w-5 h-5" />,
    description: 'Isolate and build your bicep muscles',
    videoFile: 'bicep.mp4',
    voiceIntro: 'Bicep curls! Keep your elbows fixed at your sides. Control the movement up and down.',
    voiceMidCues: [
      'Squeeze at the top of the curl!',
      'Control the descent, don\'t let gravity do the work!',
      'Keep those elbows still!',
      'Great control! Keep it up!',
    ],
    voiceComplete: 'Bicep curls finished! Feel that pump!',
  },
  {
    id: 'overheadtriceps',
    name: 'Overhead Triceps',
    duration: 30,
    icon: <Dumbbell className="w-5 h-5" />,
    description: 'Target your triceps with overhead extensions',
    videoFile: 'overheadtriceps.mp4',
    voiceIntro: 'Overhead tricep extensions! Keep your core tight and elbows pointing forward.',
    voiceMidCues: [
      'Extend fully at the top!',
      'Control the weight on the way down!',
      'Keep your elbows close to your head!',
    ],
    voiceComplete: 'Triceps are on fire! Great job.',
  },
  {
    id: 'abs',
    name: 'Core & Abs',
    duration: 30,
    icon: <Dumbbell className="w-5 h-5" />,
    description: 'Strengthen your core and abs',
    videoFile: 'abs.mp4',
    voiceIntro: 'Time to work the core! Keep your movements controlled and focus on the squeeze.',
    voiceMidCues: [
      'Breathe out on the exertion!',
      'Keep your lower back flat!',
      'Squeeze those abs tightly!',
    ],
    voiceComplete: 'Core workout complete! Feel the burn!',
  },
  {
    id: 'latpulls',
    name: 'Lat Pulls',
    duration: 30,
    icon: <Dumbbell className="w-5 h-5" />,
    description: 'Build a strong back with lat pulldowns',
    videoFile: 'latpulls.mp4',
    voiceIntro: 'Lat pulldowns! Keep your chest up and pull through your elbows.',
    voiceMidCues: [
      'Squeeze your shoulder blades together!',
      'Control the weight as it goes up!',
      'Keep that chest puffed out!',
    ],
    voiceComplete: 'Back workout complete! Excellent pulls.',
  },
  {
    id: 'chestfly',
    name: 'Chest Fly',
    duration: 30,
    icon: <Dumbbell className="w-5 h-5" />,
    description: 'Isolate the pectoral muscles',
    videoFile: 'chestfly.mp4',
    voiceIntro: 'Chest flys! Keep a slight bend in your elbows and open up the chest.',
    voiceMidCues: [
      'Feel the stretch at the bottom!',
      'Squeeze your chest together at the top!',
      'Keep your movements smooth!',
    ],
    voiceComplete: 'Chest flys done! Great isolation.',
  },
  {
    id: 'shoulderpress',
    name: 'Shoulder Press',
    duration: 30,
    icon: <Dumbbell className="w-5 h-5" />,
    description: 'Build your deltoids with overhead presses',
    videoFile: 'shoulderpress.mp4',
    voiceIntro: 'Shoulder press time! Core engaged, press straight up.',
    voiceMidCues: [
      'Don\'t arch your lower back!',
      'Full extension at the top!',
      'Control the eccentric phase!',
    ],
    voiceComplete: 'Shoulders are crushed! Well done.',
  },
  {
    id: 'pullups',
    name: 'Pull-ups',
    duration: 30,
    icon: <Dumbbell className="w-5 h-5" />,
    description: 'The ultimate upper body bodyweight exercise',
    videoFile: 'pullups.mp4',
    voiceIntro: 'Pull-ups! Hang with a full grip, engage your lats, and pull your chin over the bar.',
    voiceMidCues: [
      'Pull your elbows down and back!',
      'No swinging, keep it controlled!',
      'Squeeze at the top!',
    ],
    voiceComplete: 'Amazing pull-ups! You are getting stronger.',
  },
  {
    id: 'legpress',
    name: 'Leg Press',
    duration: 30,
    icon: <Dumbbell className="w-5 h-5" />,
    description: 'Build powerful quads and glutes on the leg press',
    videoFile: 'LegPress.mp4',
    voiceIntro: 'Leg press! Feet flat on the platform, shoulder-width apart. Push through your heels.',
    voiceMidCues: [
      'Full range of motion, lower slowly!',
      'Keep your lower back pressed to the seat!',
      'Drive through those heels!',
    ],
    voiceComplete: 'Leg press complete! Your quads are working!',
  },
  {
    id: 'totalshoulder',
    name: 'Total Shoulder',
    duration: 30,
    icon: <Dumbbell className="w-5 h-5" />,
    description: 'Full deltoid workout hitting all three heads',
    videoFile: 'TotalShoulder.mp4',
    voiceIntro: 'Total shoulder workout! Keep your core tight and focus on each part of the deltoid.',
    voiceMidCues: [
      'Control the movement, feel the burn!',
      'Keep your elbows slightly bent!',
      'Squeeze at the top!',
    ],
    voiceComplete: 'Total shoulder workout complete! Great work!',
  },
  {
    id: 'tricepext',
    name: 'Tricep Extension',
    duration: 30,
    icon: <Dumbbell className="w-5 h-5" />,
    description: 'Isolate and build your tricep muscles',
    videoFile: 'tricep extension.mp4',
    voiceIntro: 'Tricep extensions! Lock your elbows in and extend fully overhead.',
    voiceMidCues: [
      'Elbows fixed, only forearms move!',
      'Full extension at the top!',
      'Slow and controlled descent!',
    ],
    voiceComplete: 'Triceps destroyed! Excellent work.',
  },
  {
    id: 'upperbody',
    name: 'Upper Body',
    duration: 45,
    icon: <Dumbbell className="w-5 h-5" />,
    description: 'Complete upper body strength training',
    videoFile: 'UpperBody.mp4',
    voiceIntro: 'Full upper body workout! Focus on chest, shoulders, and arms throughout.',
    voiceMidCues: [
      'Keep your core engaged the whole time!',
      'Control every rep!',
      'Almost halfway, keep pushing!',
    ],
    voiceComplete: 'Full upper body done! You crushed it!',
  },
  {
    id: 'backrelaxing',
    name: 'Back Relaxing',
    duration: 30,
    icon: <Dumbbell className="w-5 h-5" />,
    description: 'Gentle back stretching and relaxation exercises',
    videoFile: 'Back Relaxing.mp4',
    voiceIntro: 'Back relaxation stretches! Move slowly and breathe deeply throughout.',
    voiceMidCues: [
      'Breathe deeply and release the tension!',
      'Elongate your spine with each breath!',
      'Let your back fully relax!',
    ],
    voiceComplete: 'Back stretches complete! Feel that relief!',
  },
  {
    id: 'barshoulder',
    name: 'Barbell Shoulder',
    duration: 30,
    icon: <Dumbbell className="w-5 h-5" />,
    description: 'Heavy barbell shoulder press for mass building',
    videoFile: 'BarShoulder.mp4',
    voiceIntro: 'Barbell shoulder press! Grip the bar just outside shoulder-width, core tight, press it up!',
    voiceMidCues: [
      'Full lockout at the top!',
      'Don\'t let your lower back arch!',
      'Control the bar on the way down!',
    ],
    voiceComplete: 'Barbell shoulder press done! Massive delts incoming!',
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
  {
    id: 10,
    title: "Leg Press",
    duration: "",
    thumbnail: "/videos/thumbnails/legpress.png",
    videoUrl: "Leg Press.mp4",
    category: "Legs",
  },
  {
    id: 11,
    title: "Tricep Extension",
    duration: "",
    thumbnail: "/videos/thumbnails/tricepext2.png",
    videoUrl: "tricep extension.mp4",
    category: "Arms",
  },
  {
    id: 12,
    title: "Glutes",
    duration: "",
    thumbnail: "/videos/thumbnails/glutes.png",
    videoUrl: "glutes.mp4",
    category: "Legs",
  },
  {
    id: 13,
    title: "Leg Press",
    duration: "",
    thumbnail: "/videos/thumbnails/legpress2.png",
    videoUrl: "LegPress.mp4",
    category: "Legs",
  },
  {
    id: 14,
    title: "Total Shoulder",
    duration: "",
    thumbnail: "/videos/thumbnails/totalshoulder.png",
    videoUrl: "TotalShoulder.mp4",
    category: "Shoulders",
  },
  {
    id: 15,
    title: "Upper Body",
    duration: "",
    thumbnail: "/videos/thumbnails/upperbody.png",
    videoUrl: "UpperBody.mp4",
    category: "Upper Body",
  },
  {
    id: 16,
    title: "Back Relaxing",
    duration: "",
    thumbnail: "/videos/thumbnails/backrelaxing.png",
    videoUrl: "Back Relaxing.mp4",
    category: "Back",
  },
  {
    id: 17,
    title: "Barbell Shoulder",
    duration: "",
    thumbnail: "/videos/thumbnails/barshoulder.png",
    videoUrl: "BarShoulder.mp4",
    category: "Shoulders",
  },
];

export default function CameraOffWorkout() {
  const navigate = useNavigate();
  const [selectedExercise, setSelectedExercise] = useState<Exercise>('idle');
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

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
            <div className="relative w-full h-[400px] md:h-[500px] rounded-2xl overflow-hidden bg-black border border-primary/20 group">
              {selectedExercise === 'idle' ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 bg-gradient-to-br from-neutral-900 to-black">
                  <Video className="w-16 h-16 text-primary/20" />
                  <p className="text-muted-foreground uppercase tracking-widest text-xs font-black">Select an exercise to initialize video</p>
                </div>
              ) : (
                <video
                  key={selectedExercise}
                  src={currentExerciseConfig?.videoFile ? `/${currentExerciseConfig.videoFile}` : `/${selectedExercise}.mp4`}
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
            {/* Exercise selector */}
            <div className="bg-card/80 backdrop-blur-sm rounded-xl p-4 border border-border">
              <p className="text-sm font-semibold mb-3">Select Exercise:</p>
              <Select 
                value={selectedExercise === 'idle' ? '' : selectedExercise} 
                onValueChange={(value) => handleExerciseSelect(value as Exercise)}
                disabled={isWorkoutActive}
              >
                <SelectTrigger className="w-full h-14 bg-muted/50 border-border hover:border-primary/50 text-base">
                  <SelectValue placeholder="Choose an exercise to practice" />
                </SelectTrigger>
                <SelectContent>
                  {EXERCISES.map((exercise) => (
                    <SelectItem 
                      key={exercise.id} 
                      value={exercise.id}
                      className="cursor-pointer py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-primary">{exercise.icon}</div>
                        <span className="font-medium">{exercise.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
        </div>
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
                  key={activeVideo.videoUrl}
                  src={activeVideo.videoUrl}
                  controls
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
