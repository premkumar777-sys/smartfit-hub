import { useEffect, useRef, useState, useCallback } from "react";
import * as tf from "@tensorflow/tfjs";
import * as poseDetection from "@tensorflow-models/pose-detection";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Camera, StopCircle, RotateCcw, ChevronDown, Volume2, VolumeX, Bug } from "lucide-react";
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

// Calculate angle between three points (in degrees)
const calculateAngle = (
  a: { x: number; y: number },
  b: { x: number; y: number },
  c: { x: number; y: number }
): number => {
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180) / Math.PI);
  if (angle > 180) angle = 360 - angle;
  return angle;
};

// Check if keypoint is valid (exists and has good confidence)
const isValidKeypoint = (kp: poseDetection.Keypoint | undefined, minScore = 0.25): kp is poseDetection.Keypoint => {
  return kp !== undefined && kp.score !== undefined && kp.score > minScore;
};

const EXERCISES: Record<ExerciseType, ExerciseConfig> = {
  squat: {
    name: "Squats",
    description: "Stand with feet shoulder-width apart, lower your hips until thighs are parallel to ground",
    detectRep: (keypoints, isDown) => {
      // Use angle-based detection for squats (knee angle)
      const leftHip = keypoints[11];
      const leftKnee = keypoints[13];
      const leftAnkle = keypoints[15];
      const rightHip = keypoints[12];
      const rightKnee = keypoints[14];
      const rightAnkle = keypoints[16];

      // Check left side
      const leftValid = isValidKeypoint(leftHip) && isValidKeypoint(leftKnee) && isValidKeypoint(leftAnkle);
      // Check right side
      const rightValid = isValidKeypoint(rightHip) && isValidKeypoint(rightKnee) && isValidKeypoint(rightAnkle);

      if (!leftValid && !rightValid) return { isDown, repCompleted: false };

      let kneeAngle = 180;
      
      if (leftValid) {
        kneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
      } else if (rightValid) {
        kneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);
      }

      // Down position: knee bent past 120 degrees (lower = more bent)
      // Standing: knee extended past 150 degrees
      if (kneeAngle < 120 && !isDown) {
        return { isDown: true, repCompleted: false };
      } else if (kneeAngle > 150 && isDown) {
        return { isDown: false, repCompleted: true };
      }
      
      return { isDown, repCompleted: false };
    }
  },
  pushup: {
    name: "Push-ups",
    description: "Start in plank position, lower chest to ground, then push back up",
    detectRep: (keypoints, isDown) => {
      // Use elbow angle for push-up detection
      const leftShoulder = keypoints[5];
      const leftElbow = keypoints[7];
      const leftWrist = keypoints[9];
      const rightShoulder = keypoints[6];
      const rightElbow = keypoints[8];
      const rightWrist = keypoints[10];

      const leftValid = isValidKeypoint(leftShoulder) && isValidKeypoint(leftElbow) && isValidKeypoint(leftWrist);
      const rightValid = isValidKeypoint(rightShoulder) && isValidKeypoint(rightElbow) && isValidKeypoint(rightWrist);

      if (!leftValid && !rightValid) return { isDown, repCompleted: false };

      let elbowAngle = 180;
      
      if (leftValid) {
        elbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
      } else if (rightValid) {
        elbowAngle = calculateAngle(rightShoulder, rightElbow, rightWrist);
      }

      // Down position: elbow bent past 100 degrees
      // Up position: elbow extended past 150 degrees
      if (elbowAngle < 100 && !isDown) {
        return { isDown: true, repCompleted: false };
      } else if (elbowAngle > 150 && isDown) {
        return { isDown: false, repCompleted: true };
      }
      
      return { isDown, repCompleted: false };
    }
  },
  lunge: {
    name: "Lunges",
    description: "Step forward and lower your body until both knees are bent at 90 degrees",
    detectRep: (keypoints, isDown) => {
      // Use front knee angle for lunge detection
      const leftHip = keypoints[11];
      const leftKnee = keypoints[13];
      const leftAnkle = keypoints[15];
      const rightHip = keypoints[12];
      const rightKnee = keypoints[14];
      const rightAnkle = keypoints[16];

      const leftValid = isValidKeypoint(leftHip) && isValidKeypoint(leftKnee) && isValidKeypoint(leftAnkle);
      const rightValid = isValidKeypoint(rightHip) && isValidKeypoint(rightKnee) && isValidKeypoint(rightAnkle);

      if (!leftValid && !rightValid) return { isDown, repCompleted: false };

      // Check which leg is forward (lower ankle y = more forward in camera view typically inverted)
      let kneeAngle = 180;
      
      if (leftValid && rightValid) {
        // Use the leg with the smaller knee angle (more bent = front leg in lunge)
        const leftAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
        const rightAngle = calculateAngle(rightHip, rightKnee, rightAnkle);
        kneeAngle = Math.min(leftAngle, rightAngle);
      } else if (leftValid) {
        kneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
      } else {
        kneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);
      }

      // Down position: front knee bent past 110 degrees
      // Standing: knee extended past 155 degrees
      if (kneeAngle < 110 && !isDown) {
        return { isDown: true, repCompleted: false };
      } else if (kneeAngle > 155 && isDown) {
        return { isDown: false, repCompleted: true };
      }
      
      return { isDown, repCompleted: false };
    }
  },
  jumpingJack: {
    name: "Jumping Jacks",
    description: "Jump while spreading legs and raising arms overhead, then return",
    detectRep: (keypoints, isDown) => {
      // Use arm angle relative to body and leg spread
      const leftShoulder = keypoints[5];
      const rightShoulder = keypoints[6];
      const leftWrist = keypoints[9];
      const rightWrist = keypoints[10];
      const leftHip = keypoints[11];
      const rightHip = keypoints[12];
      const leftAnkle = keypoints[15];
      const rightAnkle = keypoints[16];

      const armsValid = isValidKeypoint(leftShoulder) && isValidKeypoint(rightShoulder) && 
                        isValidKeypoint(leftWrist) && isValidKeypoint(rightWrist);
      const legsValid = isValidKeypoint(leftHip) && isValidKeypoint(rightHip) &&
                        isValidKeypoint(leftAnkle) && isValidKeypoint(rightAnkle);

      if (!armsValid || !legsValid) return { isDown, repCompleted: false };

      // Calculate arm angles (angle from shoulder to wrist relative to vertical)
      const leftArmUp = leftWrist.y < leftShoulder.y;
      const rightArmUp = rightWrist.y < rightShoulder.y;
      const armsUp = leftArmUp && rightArmUp;

      // Calculate leg spread using hip width as reference
      const hipWidth = Math.abs(leftHip.x - rightHip.x);
      const ankleWidth = Math.abs(leftAnkle.x - rightAnkle.x);
      const legsSpread = ankleWidth > hipWidth * 1.5;

      // Arms up and legs spread = "up" position
      if (armsUp && legsSpread && !isDown) {
        return { isDown: true, repCompleted: false };
      } else if (!armsUp && !legsSpread && isDown) {
        return { isDown: false, repCompleted: true };
      }
      
      return { isDown, repCompleted: false };
    }
  },
  bicepCurl: {
    name: "Bicep Curls",
    description: "Keep elbows at sides, curl weights up toward shoulders",
    detectRep: (keypoints, isDown) => {
      // Use elbow angle for bicep curl detection
      const leftShoulder = keypoints[5];
      const leftElbow = keypoints[7];
      const leftWrist = keypoints[9];
      const rightShoulder = keypoints[6];
      const rightElbow = keypoints[8];
      const rightWrist = keypoints[10];

      const leftValid = isValidKeypoint(leftShoulder) && isValidKeypoint(leftElbow) && isValidKeypoint(leftWrist);
      const rightValid = isValidKeypoint(rightShoulder) && isValidKeypoint(rightElbow) && isValidKeypoint(rightWrist);

      if (!leftValid && !rightValid) return { isDown, repCompleted: false };

      let elbowAngle = 180;
      
      if (leftValid && rightValid) {
        // Average both arms
        const leftAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
        const rightAngle = calculateAngle(rightShoulder, rightElbow, rightWrist);
        elbowAngle = (leftAngle + rightAngle) / 2;
      } else if (leftValid) {
        elbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
      } else {
        elbowAngle = calculateAngle(rightShoulder, rightElbow, rightWrist);
      }

      // Curled position: elbow bent past 60 degrees (small angle = fully curled)
      // Extended: elbow extended past 140 degrees
      if (elbowAngle < 60 && !isDown) {
        return { isDown: true, repCompleted: false };
      } else if (elbowAngle > 140 && isDown) {
        return { isDown: false, repCompleted: true };
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
  const [debugMode, setDebugMode] = useState(false);
  const [hasRequestedPermission, setHasRequestedPermission] = useState(false);
  const [debugAngles, setDebugAngles] = useState<{
    leftKnee: number | null;
    rightKnee: number | null;
    leftElbow: number | null;
    rightElbow: number | null;
    leftHip: number | null;
    rightHip: number | null;
    ankleSpread: number | null;
    armsUp: boolean;
  }>({
    leftKnee: null,
    rightKnee: null,
    leftElbow: null,
    rightElbow: null,
    leftHip: null,
    rightHip: null,
    ankleSpread: null,
    armsUp: false,
  });
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
    setHasRequestedPermission(true);

    try {
      // Check if camera is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast({
          title: "Camera Not Supported",
          description: "Your browser doesn't support camera access. Please use a modern browser like Chrome or Firefox.",
          variant: "destructive",
        });
        return;
      }

      // Request camera permission with better constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user" // Use front camera
        },
        audio: false
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

      toast({
        title: "Camera Access Granted",
        description: "Your camera is now active for pose detection.",
      });

    } catch (error: any) {
      console.error("Error accessing camera:", error);

      // Provide specific error messages based on error type
      let errorMessage = "Unable to access camera. ";
      let errorTitle = "Camera Error";

      if (error.name === 'NotAllowedError') {
        errorMessage += "Please allow camera access in your browser settings and try again.";
        errorTitle = "Camera Permission Denied";
      } else if (error.name === 'NotFoundError') {
        errorMessage += "No camera found on this device.";
        errorTitle = "No Camera Detected";
      } else if (error.name === 'NotReadableError') {
        errorMessage += "Camera is being used by another application.";
        errorTitle = "Camera In Use";
      } else if (error.name === 'OverconstrainedError') {
        errorMessage += "Camera doesn't support the required video quality.";
        errorTitle = "Camera Not Compatible";
      } else if (error.name === 'SecurityError') {
        errorMessage += "Camera access is restricted. Please check your browser security settings.";
        errorTitle = "Security Restriction";
      } else {
        errorMessage += "Please check your browser permissions and try again.";
      }

      toast({
        title: errorTitle,
        description: errorMessage,
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
        
        // Update debug angles
        if (debugMode) {
          updateDebugAngles(pose.keypoints);
        }
        
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

  const updateDebugAngles = useCallback((keypoints: poseDetection.Keypoint[]) => {
    const leftHip = keypoints[11];
    const leftKnee = keypoints[13];
    const leftAnkle = keypoints[15];
    const rightHip = keypoints[12];
    const rightKnee = keypoints[14];
    const rightAnkle = keypoints[16];
    const leftShoulder = keypoints[5];
    const leftElbow = keypoints[7];
    const leftWrist = keypoints[9];
    const rightShoulder = keypoints[6];
    const rightElbow = keypoints[8];
    const rightWrist = keypoints[10];

    const angles: typeof debugAngles = {
      leftKnee: null,
      rightKnee: null,
      leftElbow: null,
      rightElbow: null,
      leftHip: null,
      rightHip: null,
      ankleSpread: null,
      armsUp: false,
    };

    // Calculate knee angles
    if (isValidKeypoint(leftHip) && isValidKeypoint(leftKnee) && isValidKeypoint(leftAnkle)) {
      angles.leftKnee = Math.round(calculateAngle(leftHip, leftKnee, leftAnkle));
    }
    if (isValidKeypoint(rightHip) && isValidKeypoint(rightKnee) && isValidKeypoint(rightAnkle)) {
      angles.rightKnee = Math.round(calculateAngle(rightHip, rightKnee, rightAnkle));
    }

    // Calculate elbow angles
    if (isValidKeypoint(leftShoulder) && isValidKeypoint(leftElbow) && isValidKeypoint(leftWrist)) {
      angles.leftElbow = Math.round(calculateAngle(leftShoulder, leftElbow, leftWrist));
    }
    if (isValidKeypoint(rightShoulder) && isValidKeypoint(rightElbow) && isValidKeypoint(rightWrist)) {
      angles.rightElbow = Math.round(calculateAngle(rightShoulder, rightElbow, rightWrist));
    }

    // Calculate hip angles (for lunges/squats)
    if (isValidKeypoint(leftShoulder) && isValidKeypoint(leftHip) && isValidKeypoint(leftKnee)) {
      angles.leftHip = Math.round(calculateAngle(leftShoulder, leftHip, leftKnee));
    }
    if (isValidKeypoint(rightShoulder) && isValidKeypoint(rightHip) && isValidKeypoint(rightKnee)) {
      angles.rightHip = Math.round(calculateAngle(rightShoulder, rightHip, rightKnee));
    }

    // Calculate ankle spread ratio (for jumping jacks)
    if (isValidKeypoint(leftHip) && isValidKeypoint(rightHip) && isValidKeypoint(leftAnkle) && isValidKeypoint(rightAnkle)) {
      const hipWidth = Math.abs(leftHip.x - rightHip.x);
      const ankleWidth = Math.abs(leftAnkle.x - rightAnkle.x);
      angles.ankleSpread = Math.round((ankleWidth / hipWidth) * 100) / 100;
    }

    // Check arms up
    if (isValidKeypoint(leftShoulder) && isValidKeypoint(leftWrist) && isValidKeypoint(rightShoulder) && isValidKeypoint(rightWrist)) {
      angles.armsUp = leftWrist.y < leftShoulder.y && rightWrist.y < rightShoulder.y;
    }

    setDebugAngles(angles);
  }, []);

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
          
          {/* Debug Overlay */}
          {isDetecting && debugMode && (
            <div className="absolute top-4 left-4 bg-black/80 text-white p-4 rounded-lg text-sm font-mono space-y-1 max-w-[200px]">
              <div className="text-primary font-bold mb-2">🔧 Debug Angles</div>
              <div className="border-b border-white/20 pb-2 mb-2">
                <div className="text-muted-foreground text-xs uppercase">Knees</div>
                <div>L: {debugAngles.leftKnee ?? '—'}°</div>
                <div>R: {debugAngles.rightKnee ?? '—'}°</div>
              </div>
              <div className="border-b border-white/20 pb-2 mb-2">
                <div className="text-muted-foreground text-xs uppercase">Elbows</div>
                <div>L: {debugAngles.leftElbow ?? '—'}°</div>
                <div>R: {debugAngles.rightElbow ?? '—'}°</div>
              </div>
              <div className="border-b border-white/20 pb-2 mb-2">
                <div className="text-muted-foreground text-xs uppercase">Hips</div>
                <div>L: {debugAngles.leftHip ?? '—'}°</div>
                <div>R: {debugAngles.rightHip ?? '—'}°</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs uppercase">Other</div>
                <div>Spread: {debugAngles.ankleSpread ?? '—'}x</div>
                <div>Arms Up: {debugAngles.armsUp ? '✓' : '✗'}</div>
              </div>
              <div className="border-t border-white/20 pt-2 mt-2 text-xs text-muted-foreground">
                <div>State: {isDown ? 'DOWN' : 'UP'}</div>
              </div>
            </div>
          )}
        </div>

        {/* Camera Permission Notice */}
        {!isDetecting && !hasRequestedPermission && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <Camera className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-blue-400">Camera Permission Required</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  SmartFit AI needs camera access to track your exercises in real-time.
                  When you click "Start Camera", your browser will ask for permission to access your camera.
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>•</span>
                  <span>Your video feed stays private and is only used for pose detection</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>•</span>
                  <span>You can revoke permission anytime in your browser settings</span>
                </div>
              </div>
            </div>
          </div>
        )}

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
          <Button
            onClick={() => setDebugMode(prev => !prev)}
            variant={debugMode ? "secondary" : "outline"}
            title={debugMode ? "Hide debug overlay" : "Show debug overlay"}
          >
            <Bug className="h-4 w-4" />
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
