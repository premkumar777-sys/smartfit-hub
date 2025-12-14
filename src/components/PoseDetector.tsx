import { useEffect, useRef, useState, useCallback } from "react";
import * as tf from "@tensorflow/tfjs";
import * as poseDetection from "@tensorflow-models/pose-detection";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Camera, StopCircle, RotateCcw, ChevronDown, Volume2, VolumeX } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ExerciseType = "squat" | "pushup" | "lunge" | "jumpingJack" | "bicepCurl";

// Voice feedback utility
const speak = (text: string, rate: number = 1.2) => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.pitch = 1;
    utterance.volume = 1;
    window.speechSynthesis.speak(utterance);
  }
};

interface ExerciseConfig {
  name: string;
  description: string;
  detectRep: (keypoints: poseDetection.Keypoint[], isDown: boolean) => { isDown: boolean; repCompleted: boolean };
}

const EXERCISES: Record<ExerciseType, ExerciseConfig> = {
  squat: {
    name: "Squats",
    description: "Stand with feet shoulder-width apart, lower your hips until thighs are parallel to ground",
    detectRep: (keypoints, isDown) => {
      const leftHip = keypoints[11];
      const rightHip = keypoints[12];
      const leftKnee = keypoints[13];
      const rightKnee = keypoints[14];

      if (leftHip.score && rightHip.score && leftKnee.score && rightKnee.score &&
          leftHip.score > 0.3 && rightHip.score > 0.3 && 
          leftKnee.score > 0.3 && rightKnee.score > 0.3) {
        const hipY = (leftHip.y + rightHip.y) / 2;
        const kneeY = (leftKnee.y + rightKnee.y) / 2;
        const threshold = 50;

        if (hipY > kneeY - threshold && !isDown) {
          return { isDown: true, repCompleted: false };
        } else if (hipY < kneeY - threshold * 2 && isDown) {
          return { isDown: false, repCompleted: true };
        }
      }
      return { isDown, repCompleted: false };
    }
  },
  pushup: {
    name: "Push-ups",
    description: "Start in plank position, lower chest to ground, then push back up",
    detectRep: (keypoints, isDown) => {
      const leftShoulder = keypoints[5];
      const rightShoulder = keypoints[6];
      const leftElbow = keypoints[7];
      const rightElbow = keypoints[8];
      const leftWrist = keypoints[9];
      const rightWrist = keypoints[10];

      if (leftShoulder.score && rightShoulder.score && leftElbow.score && rightElbow.score &&
          leftShoulder.score > 0.3 && rightShoulder.score > 0.3 &&
          leftElbow.score > 0.3 && rightElbow.score > 0.3) {
        const shoulderY = (leftShoulder.y + rightShoulder.y) / 2;
        const elbowY = (leftElbow.y + rightElbow.y) / 2;
        
        // Down position: shoulders close to or below elbows
        if (shoulderY >= elbowY - 20 && !isDown) {
          return { isDown: true, repCompleted: false };
        } else if (shoulderY < elbowY - 60 && isDown) {
          return { isDown: false, repCompleted: true };
        }
      }
      return { isDown, repCompleted: false };
    }
  },
  lunge: {
    name: "Lunges",
    description: "Step forward and lower your body until both knees are bent at 90 degrees",
    detectRep: (keypoints, isDown) => {
      const leftHip = keypoints[11];
      const rightHip = keypoints[12];
      const leftKnee = keypoints[13];
      const rightKnee = keypoints[14];
      const leftAnkle = keypoints[15];
      const rightAnkle = keypoints[16];

      if (leftHip.score && rightHip.score && leftKnee.score && rightKnee.score &&
          leftAnkle.score && rightAnkle.score &&
          leftHip.score > 0.3 && rightHip.score > 0.3 && 
          leftKnee.score > 0.3 && rightKnee.score > 0.3 &&
          leftAnkle.score > 0.3 && rightAnkle.score > 0.3) {
        
        const hipY = (leftHip.y + rightHip.y) / 2;
        const kneeY = Math.min(leftKnee.y, rightKnee.y);
        const ankleSpread = Math.abs(leftAnkle.x - rightAnkle.x);
        
        // Lunge detected when legs are spread and hips are low
        if (ankleSpread > 100 && hipY > kneeY - 30 && !isDown) {
          return { isDown: true, repCompleted: false };
        } else if ((ankleSpread < 80 || hipY < kneeY - 80) && isDown) {
          return { isDown: false, repCompleted: true };
        }
      }
      return { isDown, repCompleted: false };
    }
  },
  jumpingJack: {
    name: "Jumping Jacks",
    description: "Jump while spreading legs and raising arms overhead, then return",
    detectRep: (keypoints, isDown) => {
      const leftWrist = keypoints[9];
      const rightWrist = keypoints[10];
      const leftAnkle = keypoints[15];
      const rightAnkle = keypoints[16];
      const leftShoulder = keypoints[5];
      const rightShoulder = keypoints[6];

      if (leftWrist.score && rightWrist.score && leftAnkle.score && rightAnkle.score &&
          leftShoulder.score && rightShoulder.score &&
          leftWrist.score > 0.3 && rightWrist.score > 0.3 &&
          leftAnkle.score > 0.3 && rightAnkle.score > 0.3 &&
          leftShoulder.score > 0.3 && rightShoulder.score > 0.3) {
        
        const shoulderY = (leftShoulder.y + rightShoulder.y) / 2;
        const wristY = (leftWrist.y + rightWrist.y) / 2;
        const ankleSpread = Math.abs(leftAnkle.x - rightAnkle.x);
        
        // Arms up and legs spread = "up" position
        if (wristY < shoulderY && ankleSpread > 150 && !isDown) {
          return { isDown: true, repCompleted: false };
        } else if (wristY > shoulderY + 50 && ankleSpread < 100 && isDown) {
          return { isDown: false, repCompleted: true };
        }
      }
      return { isDown, repCompleted: false };
    }
  },
  bicepCurl: {
    name: "Bicep Curls",
    description: "Keep elbows at sides, curl weights up toward shoulders",
    detectRep: (keypoints, isDown) => {
      const leftShoulder = keypoints[5];
      const rightShoulder = keypoints[6];
      const leftElbow = keypoints[7];
      const rightElbow = keypoints[8];
      const leftWrist = keypoints[9];
      const rightWrist = keypoints[10];

      if (leftShoulder.score && rightShoulder.score && 
          leftElbow.score && rightElbow.score &&
          leftWrist.score && rightWrist.score &&
          leftShoulder.score > 0.3 && rightShoulder.score > 0.3 &&
          leftElbow.score > 0.3 && rightElbow.score > 0.3 &&
          leftWrist.score > 0.3 && rightWrist.score > 0.3) {
        
        const shoulderY = (leftShoulder.y + rightShoulder.y) / 2;
        const elbowY = (leftElbow.y + rightElbow.y) / 2;
        const wristY = (leftWrist.y + rightWrist.y) / 2;
        
        // Curled position: wrists near shoulders
        if (wristY < elbowY && !isDown) {
          return { isDown: true, repCompleted: false };
        } else if (wristY > elbowY + 50 && isDown) {
          return { isDown: false, repCompleted: true };
        }
      }
      return { isDown, repCompleted: false };
    }
  }
};

export default function PoseDetector() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const isDetectingRef = useRef(false);
  const [detector, setDetector] = useState<poseDetection.PoseDetector | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseType>("squat");
  const [repCount, setRepCount] = useState(0);
  const [isDown, setIsDown] = useState(false);
  const isDownRef = useRef(false);
  const [formQuality, setFormQuality] = useState<"good" | "fair" | "poor" | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const lastFormFeedbackRef = useRef<string | null>(null);
  const formFeedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadModel();
    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Sync isDown state with ref
  useEffect(() => {
    isDownRef.current = isDown;
  }, [isDown]);

  const loadModel = async () => {
    try {
      await tf.setBackend('webgl');
      await tf.ready();
      console.log("TensorFlow.js ready with backend:", tf.getBackend());
      
      const detectorConfig: poseDetection.MoveNetModelConfig = {
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
        enableSmoothing: true,
      };
      const poseDetector = await poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet,
        detectorConfig
      );
      setDetector(poseDetector);
      console.log("Pose detector loaded successfully");
      toast({
        title: "Ready",
        description: "AI Pose Detector loaded successfully",
      });
    } catch (error) {
      console.error("Error loading model:", error);
      toast({
        title: "Error",
        description: "Failed to load pose detection model. Please refresh the page.",
        variant: "destructive",
      });
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        isDetectingRef.current = true;
        setIsDetecting(true);
        
        videoRef.current.onloadedmetadata = () => {
          if (canvasRef.current && videoRef.current) {
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
            detectPose();
          }
        };
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    isDetectingRef.current = false;
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsDetecting(false);
    setFormQuality(null);
  };

  const detectPose = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    const detect = async () => {
      if (!isDetectingRef.current) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      let poses: poseDetection.Pose[] = [];
      if (detector) {
        poses = await detector.estimatePoses(video);
      }

      if (poses.length > 0) {
        const pose = poses[0];
        const avgScore = calculateAverageScore(pose.keypoints);
        updateFormQuality(avgScore);
        
        drawKeypoints(pose.keypoints, ctx);
        drawSkeleton(pose.keypoints, ctx);
        countReps(pose.keypoints);
      }

      requestAnimationFrame(detect);
    };

    detect();
  };

  const calculateAverageScore = (keypoints: poseDetection.Keypoint[]): number => {
    const scores = keypoints.filter(kp => kp.score !== undefined).map(kp => kp.score!);
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  };

  const updateFormQuality = useCallback((avgScore: number) => {
    let quality: "good" | "fair" | "poor";
    if (avgScore > 0.7) {
      quality = "good";
    } else if (avgScore > 0.5) {
      quality = "fair";
    } else {
      quality = "poor";
    }
    
    setFormQuality(quality);
    
    // Voice feedback for form corrections (debounced)
    if (voiceEnabled && quality !== "good" && lastFormFeedbackRef.current !== quality) {
      if (formFeedbackTimeoutRef.current) {
        clearTimeout(formFeedbackTimeoutRef.current);
      }
      formFeedbackTimeoutRef.current = setTimeout(() => {
        if (quality === "poor") {
          speak("Move closer to camera", 1.0);
        } else if (quality === "fair") {
          speak("Adjust your position", 1.0);
        }
        lastFormFeedbackRef.current = quality;
      }, 2000);
    } else if (quality === "good") {
      lastFormFeedbackRef.current = null;
    }
  }, [voiceEnabled]);

  const drawKeypoints = (keypoints: poseDetection.Keypoint[], ctx: CanvasRenderingContext2D) => {
    keypoints.forEach((keypoint) => {
      if (keypoint.score && keypoint.score > 0.3) {
        ctx.beginPath();
        ctx.arc(keypoint.x, keypoint.y, 6, 0, 2 * Math.PI);
        ctx.fillStyle = formQuality === "good" ? "#00FF9C" : formQuality === "fair" ? "#FFB800" : "#FF4444";
        ctx.fill();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });
  };

  const drawSkeleton = (keypoints: poseDetection.Keypoint[], ctx: CanvasRenderingContext2D) => {
    const adjacentKeyPoints = [
      [5, 7], [7, 9], [6, 8], [8, 10], [5, 6],
      [5, 11], [6, 12], [11, 12], [11, 13],
      [13, 15], [12, 14], [14, 16]
    ];

    adjacentKeyPoints.forEach(([i, j]) => {
      const kp1 = keypoints[i];
      const kp2 = keypoints[j];
      if (kp1.score && kp2.score && kp1.score > 0.3 && kp2.score > 0.3) {
        ctx.beginPath();
        ctx.moveTo(kp1.x, kp1.y);
        ctx.lineTo(kp2.x, kp2.y);
        ctx.strokeStyle = formQuality === "good" ? "#4CC9F0" : formQuality === "fair" ? "#FFB800" : "#FF4444";
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    });
  };

  const countReps = useCallback((keypoints: poseDetection.Keypoint[]) => {
    const exercise = EXERCISES[selectedExercise];
    const result = exercise.detectRep(keypoints, isDownRef.current);
    
    if (result.isDown !== isDownRef.current) {
      setIsDown(result.isDown);
    }
    
    if (result.repCompleted) {
      setRepCount(prev => {
        const newCount = prev + 1;
        if (voiceEnabled) {
          speak(`${newCount}`);
        }
        toast({
          title: "Perfect Rep! 💪",
          description: `${exercise.name}: Rep ${newCount} completed`,
        });
        return newCount;
      });
    }
  }, [selectedExercise, toast, voiceEnabled]);

  const handleExerciseChange = (exercise: ExerciseType) => {
    setSelectedExercise(exercise);
    setRepCount(0);
    setIsDown(false);
    isDownRef.current = false;
    if (voiceEnabled) {
      speak(`Now tracking ${EXERCISES[exercise].name}`, 1.0);
    }
    toast({
      title: "Exercise Changed",
      description: `Now tracking: ${EXERCISES[exercise].name}`,
    });
  };

  const toggleVoice = () => {
    setVoiceEnabled(prev => {
      const newState = !prev;
      if (newState) {
        speak("Voice feedback on", 1.0);
      } else {
        window.speechSynthesis.cancel();
      }
      return newState;
    });
  };

  const resetCount = () => {
    setRepCount(0);
    setIsDown(false);
    isDownRef.current = false;
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">AI Pose Detector</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {EXERCISES[selectedExercise].description}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="min-w-[140px]">
                  {EXERCISES[selectedExercise].name}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {(Object.keys(EXERCISES) as ExerciseType[]).map((key) => (
                  <DropdownMenuItem
                    key={key}
                    onClick={() => handleExerciseChange(key)}
                    className={selectedExercise === key ? "bg-accent" : ""}
                  >
                    {EXERCISES[key].name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="text-3xl font-bold text-primary min-w-[100px] text-right">
              {repCount} <span className="text-lg font-normal text-muted-foreground">reps</span>
            </div>
          </div>
        </div>

        {/* Form Quality Indicator */}
        {isDetecting && formQuality && (
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
            formQuality === "good" ? "bg-green-500/20 text-green-400" :
            formQuality === "fair" ? "bg-yellow-500/20 text-yellow-400" :
            "bg-red-500/20 text-red-400"
          }`}>
            <div className={`w-3 h-3 rounded-full ${
              formQuality === "good" ? "bg-green-400" :
              formQuality === "fair" ? "bg-yellow-400" :
              "bg-red-400"
            }`} />
            <span className="font-medium capitalize">Form Quality: {formQuality}</span>
            {formQuality === "poor" && <span className="text-sm ml-2">- Move closer to camera</span>}
          </div>
        )}

        <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover opacity-0"
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
          />
          {!isDetecting && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center space-y-4">
                <Camera className="w-16 h-16 mx-auto text-muted-foreground" />
                <p className="text-muted-foreground">Start camera to begin workout tracking</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-4">
          {!isDetecting ? (
            <Button onClick={startCamera} variant="hero" className="flex-1">
              <Camera className="mr-2" />
              Start Camera
            </Button>
          ) : (
            <Button onClick={stopCamera} variant="destructive" className="flex-1">
              <StopCircle className="mr-2" />
              Stop Camera
            </Button>
          )}
          <Button 
            onClick={resetCount} 
            variant="outline"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button
            onClick={toggleVoice}
            variant={voiceEnabled ? "secondary" : "outline"}
            title={voiceEnabled ? "Disable voice feedback" : "Enable voice feedback"}
          >
            {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>
        </div>

        <div className="text-sm text-muted-foreground space-y-2">
          <p>• Position yourself so your full body is visible in the camera</p>
          <p>• Select your exercise from the dropdown menu above</p>
          <p>• The AI will track your movements and count perfect reps automatically</p>
        </div>
      </div>
    </Card>
  );
}
