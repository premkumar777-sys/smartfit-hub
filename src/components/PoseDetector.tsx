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
const isValidKeypoint = (kp: poseDetection.Keypoint | undefined, minScore = 0.05): kp is poseDetection.Keypoint => {
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

      // Down position: knee bent past 130 degrees (lower = more bent)
      // Standing: knee extended past 150 degrees
      if (kneeAngle < 130 && !isDown) {
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

      // Down position: elbow bent past 110 degrees
      // Up position: elbow extended past 150 degrees
      if (elbowAngle < 110 && !isDown) {
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

      // Down position: front knee bent past 125 degrees
      // Standing: knee extended past 155 degrees
      if (kneeAngle < 125 && !isDown) {
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

      // Curled position: elbow bent past 70 degrees (small angle = fully curled)
      // Extended: elbow extended past 140 degrees
      if (elbowAngle < 70 && !isDown) {
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
  const [repCelebration, setRepCelebration] = useState(false);
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
      console.log("Loading TensorFlow.js...");

      // Try WebGL first, fallback to CPU
      try {
        await tf.setBackend('webgl');
        await tf.ready();
        console.log("TensorFlow.js ready with WebGL backend");
      } catch (webglError) {
        console.warn("WebGL backend failed, trying CPU:", webglError);
        await tf.setBackend('cpu');
        await tf.ready();
        console.log("TensorFlow.js ready with CPU backend");
      }

      console.log("Creating pose detector...");
      let poseDetector;

      try {
        // Try Thunder model first (more accurate - super accuracy mode)
        const thunderConfig: poseDetection.MoveNetModelConfig = {
          modelType: poseDetection.movenet.modelType.SINGLEPOSE_THUNDER,
          enableSmoothing: true,
        };

        poseDetector = await poseDetection.createDetector(
          poseDetection.SupportedModels.MoveNet,
          thunderConfig
        );
        console.log("Thunder model (Super Accuracy) loaded successfully");
      } catch (thunderError) {
        console.warn("Thunder model failed, trying Lightning model:", thunderError);

        // Fallback to Lightning model (faster but less accurate)
        const lightningConfig: poseDetection.MoveNetModelConfig = {
          modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
          enableSmoothing: true,
        };

        poseDetector = await poseDetection.createDetector(
          poseDetection.SupportedModels.MoveNet,
          lightningConfig
        );
        console.log("Lightning model loaded successfully");
      }

      setDetector(poseDetector);
      console.log("Pose detector loaded successfully:", poseDetector);
      toast({
        title: "Ready",
        description: "AI Pose Detector loaded successfully",
      });
    } catch (error) {
      console.error("Error loading model:", error);
      console.error("Error details:", error.message, error.stack);

      toast({
        title: "Error",
        description: `Failed to load pose detection model: ${error.message}. Please refresh the page.`,
        variant: "destructive",
      });
    }
  };

  const startCamera = async () => {
    setHasRequestedPermission(true);

    try {
      // Check HTTPS requirement for camera access
      if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
        toast({
          title: "HTTPS Required",
          description: "Camera access requires HTTPS. Please access this site using https:// or use localhost for development.",
          variant: "destructive",
        });
        return;
      }

      // Check if camera is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast({
          title: "Browser Not Supported",
          description: `Your browser (${navigator.userAgent.split(' ')[0]}) doesn't support camera access. Please use Chrome, Firefox, Edge, or Safari.`,
          variant: "destructive",
        });
        return;
      }

      // Request camera permission with very flexible constraints
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: "user" // Use front camera
          },
          audio: false
        });
      } catch (frontCameraError) {
        console.log("Front camera not available, trying default camera:", frontCameraError);
        try {
          // More flexible fallback
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 640 },
              height: { ideal: 480 }
            },
            audio: false
          });
        } catch (defaultCameraError) {
          console.log("Default camera failed, trying minimal constraints:", defaultCameraError);
          // Last resort: minimal constraints
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
          });
        }
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        isDetectingRef.current = true;
        setIsDetecting(true);

        videoRef.current.onloadedmetadata = () => {
          if (canvasRef.current && videoRef.current) {
            console.log("Video dimensions:", videoRef.current.videoWidth, "x", videoRef.current.videoHeight);
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
            console.log("Canvas dimensions set to:", canvasRef.current.width, "x", canvasRef.current.height);

            // Ensure video is playing
            videoRef.current.play().then(() => {
              console.log("Video started playing");
              detectPose();
            }).catch((playError) => {
              console.error("Video play failed:", playError);
              detectPose(); // Try anyway
            });
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

    let lastFrameTime = 0;
    const targetFPS = 15; // Limit to 15 FPS for better performance
    const frameInterval = 1000 / targetFPS;

    const detect = async (currentTime: number) => {
      if (!isDetectingRef.current) return;

      // Limit frame rate for better performance
      if (currentTime - lastFrameTime < frameInterval) {
        requestAnimationFrame(detect);
        return;
      }
      lastFrameTime = currentTime;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      let poses: poseDetection.Pose[] = [];
      if (detector) {
        try {
          // Debug: Check if video is ready
          console.log("Video state - readyState:", video.readyState, "networkState:", video.networkState, "dimensions:", video.videoWidth, "x", video.videoHeight);

          if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) { // HAVE_CURRENT_DATA or better
            console.log("Attempting pose detection...");
            poses = await detector.estimatePoses(video, {
              maxPoses: 1,
              flipHorizontal: false,
              scoreThreshold: 0.05, // Super low threshold for better persistence
            });
            console.log("Poses detected:", poses.length);
            if (poses.length > 0) {
              console.log("First pose keypoints:", poses[0].keypoints.length);
              console.log("Keypoint scores:", poses[0].keypoints.map(kp => kp.score));
            }
          } else {
            console.log("Video not ready for pose detection");
          }
        } catch (error) {
          console.error("Pose detection error:", error);
          console.error("Error stack:", error.stack);
          // Continue with empty poses if detection fails
        }
      } else {
        console.log("Detector not available - model not loaded yet");
      }

      // Always try to process keypoints, even if no full pose detected
      let keypointsToDraw: poseDetection.Keypoint[] = [];
      let avgScore = 0;

      if (poses.length > 0) {
        const pose = poses[0];
        keypointsToDraw = pose.keypoints;
        avgScore = calculateAverageScore(pose.keypoints);
        const validKeypoints = pose.keypoints.filter(kp => kp.score && kp.score > 0.05).length;

        console.log("Pose detected with", validKeypoints, "valid keypoints, avg score:", avgScore);

        updateFormQuality(avgScore);

        // Only count reps if we have enough valid keypoints for the exercise
        if (validKeypoints >= 8) { // Require at least 8 keypoints for basic pose detection
          countReps(pose.keypoints);
        }
      } else {
        // Create empty keypoints array to show we're trying to detect
        keypointsToDraw = Array.from({ length: 17 }, (_, i) => ({
          x: 0,
          y: 0,
          score: 0,
          name: ['nose', 'left_eye', 'right_eye', 'left_ear', 'right_ear', 'left_shoulder', 'right_shoulder',
            'left_elbow', 'right_elbow', 'left_wrist', 'right_wrist', 'left_hip', 'right_hip',
            'left_knee', 'right_knee', 'left_ankle', 'right_ankle'][i] as any
        }));

        console.log("No pose detected - showing empty keypoints for reference");
      }

      // Always update debug angles and draw keypoints/skeleton
      updateDebugAngles(keypointsToDraw);

      // Draw skeleton first (so keypoints appear on top)
      if (poses.length > 0) {
        drawSkeleton(keypointsToDraw, ctx);
      }

      // Draw keypoints
      drawKeypoints(keypointsToDraw, ctx);

      // Draw angles dynamically on canvas near joints
      drawAnglesOnCanvas(keypointsToDraw, ctx);

      // Show accuracy indicator or low confidence message
      if (poses.length > 0 && avgScore > 0) {
        drawAccuracyIndicator(avgScore, ctx, canvas);
      } else {
        drawLowConfidenceIndicator(ctx, canvas);
      }

      // Draw celebration effect if active
      if (repCelebration) {
        drawRepCelebration(ctx, canvas);
      }

      requestAnimationFrame(detect);
    };

    requestAnimationFrame(detect);
  };

  const calculateAverageScore = (keypoints: poseDetection.Keypoint[]): number => {
    const scores = keypoints.filter(kp => kp.score !== undefined).map(kp => kp.score!);
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  };

  const drawAccuracyIndicator = (accuracy: number, ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const percentage = Math.round(accuracy * 100);
    const centerX = canvas.width - 80;
    const centerY = 80;
    const radius = 35;

    // Background circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fill();

    // Accuracy arc
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - 5, -Math.PI / 2, -Math.PI / 2 + (percentage / 100) * 2 * Math.PI);
    ctx.lineWidth = 6;

    // Color based on accuracy
    if (percentage >= 80) {
      ctx.strokeStyle = "#00FF9C";
    } else if (percentage >= 60) {
      ctx.strokeStyle = "#FFB800";
    } else {
      ctx.strokeStyle = "#FF4444";
    }
    ctx.stroke();

    // Percentage text
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "center";
    ctx.fillText(`${percentage}%`, centerX, centerY + 2);

    // Label
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "12px Arial";
    ctx.fillText("Accuracy", centerX, centerY + 20);
  };

  const drawLowConfidenceIndicator = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const centerX = canvas.width - 100;
    const centerY = 120;

    // Small indicator background
    ctx.fillStyle = "rgba(255, 152, 0, 0.9)";
    ctx.fillRect(centerX - 80, centerY - 25, 160, 50);

    // Border
    ctx.strokeStyle = "#FF6B35";
    ctx.lineWidth = 2;
    ctx.strokeRect(centerX - 80, centerY - 25, 160, 50);

    // Text
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 14px Arial";
    ctx.textAlign = "center";
    ctx.fillText("🔍 Detecting...", centerX, centerY - 5);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "12px Arial";
    ctx.fillText("Low confidence", centerX, centerY + 15);
  };

  const drawRepCelebration = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Pulsing background effect
    const time = Date.now() * 0.005;
    const pulse = Math.sin(time) * 0.5 + 0.5;
    const radius = 100 + pulse * 50;

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fillStyle = `rgba(0, 255, 156, ${0.2 - pulse * 0.1})`;
    ctx.fill();

    // Celebration text
    ctx.fillStyle = "#00FF9C";
    ctx.font = "bold 32px Arial";
    ctx.textAlign = "center";
    ctx.fillText("🎉 PERFECT!", centerX, centerY - 10);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "16px Arial";
    ctx.fillText("Rep counted!", centerX, centerY + 20);
  };

  const drawAnglesOnCanvas = (keypoints: poseDetection.Keypoint[], ctx: CanvasRenderingContext2D) => {
    const minScore = 0.1;

    // Draw angles near joints dynamically
    const drawAngle = (angle: number | null, centerX: number, centerY: number, offsetX: number = 0, offsetY: number = 0) => {
      if (angle !== null) {
        const x = centerX + offsetX;
        const y = centerY + offsetY;

        // Background for angle text
        const text = `${Math.round(angle)}°`;
        ctx.font = "bold 14px Arial";
        const textWidth = ctx.measureText(text).width;
        const padding = 4;

        ctx.fillStyle = "rgba(138, 43, 226, 0.85)"; // Purple background like reference
        ctx.fillRect(x - textWidth / 2 - padding, y - 12, textWidth + padding * 2, 20);

        // Angle text
        ctx.fillStyle = "#FFFFFF";
        ctx.textAlign = "center";
        ctx.fillText(text, x, y + 4);
      }
    };

    // Calculate and draw knee angles
    const leftHip = keypoints[11];
    const leftKnee = keypoints[13];
    const leftAnkle = keypoints[15];
    const rightHip = keypoints[12];
    const rightKnee = keypoints[14];
    const rightAnkle = keypoints[16];

    if (isValidKeypoint(leftHip, minScore) && isValidKeypoint(leftKnee, minScore) && isValidKeypoint(leftAnkle, minScore)) {
      const angle = calculateAngle(leftHip, leftKnee, leftAnkle);
      drawAngle(angle, leftKnee.x, leftKnee.y, 25, -20);
    }

    if (isValidKeypoint(rightHip, minScore) && isValidKeypoint(rightKnee, minScore) && isValidKeypoint(rightAnkle, minScore)) {
      const angle = calculateAngle(rightHip, rightKnee, rightAnkle);
      drawAngle(angle, rightKnee.x, rightKnee.y, 25, -20);
    }

    // Calculate and draw hip angles
    const leftShoulder = keypoints[5];
    const rightShoulder = keypoints[6];

    if (isValidKeypoint(leftShoulder, minScore) && isValidKeypoint(leftHip, minScore) && isValidKeypoint(leftKnee, minScore)) {
      const angle = calculateAngle(leftShoulder, leftHip, leftKnee);
      drawAngle(angle, leftHip.x, leftHip.y, 25, 10);
    }

    if (isValidKeypoint(rightShoulder, minScore) && isValidKeypoint(rightHip, minScore) && isValidKeypoint(rightKnee, minScore)) {
      const angle = calculateAngle(rightShoulder, rightHip, rightKnee);
      drawAngle(angle, rightHip.x, rightHip.y, -25, 10);
    }

    // Calculate and draw ankle angles (for reference)
    if (isValidKeypoint(leftKnee, minScore) && isValidKeypoint(leftAnkle, minScore)) {
      const angle = calculateAngle(leftHip, leftKnee, leftAnkle);
      drawAngle(angle, leftAnkle.x, leftAnkle.y, 0, 25);
    }

    if (isValidKeypoint(rightKnee, minScore) && isValidKeypoint(rightAnkle, minScore)) {
      const angle = calculateAngle(rightHip, rightKnee, rightAnkle);
      drawAngle(angle, rightAnkle.x, rightAnkle.y, 0, 25);
    }
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
    const keypointLabels: { [key: number]: string } = {
      5: "Shoulder", 6: "Shoulder",
      7: "Elbow", 8: "Elbow",
      9: "Wrist", 10: "Wrist",
      11: "Hip", 12: "Hip",
      13: "Knee", 14: "Knee",
      15: "Ankle", 16: "Ankle"
    };

    keypoints.forEach((keypoint, index) => {
      // Always show keypoints if they have any detection
      const shouldShow = keypoint.score && keypoint.score > 0.05;
      const confidence = keypoint.score || 0;

      if (shouldShow) {
        const radius = Math.max(5, Math.min(10, confidence * 8));

        // Draw keypoint - yellow circle like reference image
        ctx.beginPath();
        ctx.arc(keypoint.x, keypoint.y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = "#FFD700"; // Yellow/Gold color
        ctx.fill();

        // White border
        ctx.beginPath();
        ctx.arc(keypoint.x, keypoint.y, radius, 0, 2 * Math.PI);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw label for major joints (like reference image)
        if (keypointLabels[index]) {
          ctx.fillStyle = "#FFFFFF";
          ctx.font = "bold 12px Arial";
          ctx.textAlign = "center";
          ctx.strokeStyle = "rgba(0, 0, 0, 0.8)";
          ctx.lineWidth = 3;
          ctx.lineJoin = "round";
          ctx.miterLimit = 2;

          const labelY = keypoint.y - radius - 10;
          ctx.strokeText(keypointLabels[index], keypoint.x, labelY);
          ctx.fillText(keypointLabels[index], keypoint.x, labelY);
        }
      }
    });
  };

  const drawSkeleton = (keypoints: poseDetection.Keypoint[], ctx: CanvasRenderingContext2D) => {
    const adjacentKeyPoints = [
      [5, 7], [7, 9], [6, 8], [8, 10], [5, 6],
      [5, 11], [6, 12], [11, 12], [11, 13],
      [13, 15], [12, 14], [14, 16]
    ];

    // Color-coded skeleton lines (like the reference image)
    const getLineColor = (kp1Index: number, kp2Index: number) => {
      // Arms and torso - light blue
      if ([5, 6, 7, 8, 9, 10, 11, 12].includes(kp1Index) && [5, 6, 7, 8, 9, 10, 11, 12].includes(kp2Index)) {
        return "#4A90E2"; // Light blue
      }
      // Legs - light green
      if ([11, 12, 13, 14, 15, 16].includes(kp1Index) && [11, 12, 13, 14, 15, 16].includes(kp2Index)) {
        return "#7ED321"; // Light green
      }
      return "#4CC9F0"; // Default blue
    };

    adjacentKeyPoints.forEach(([i, j]) => {
      const kp1 = keypoints[i];
      const kp2 = keypoints[j];
      if (kp1.score && kp2.score && kp1.score > 0.05 && kp2.score > 0.05) {
        const avgConfidence = (kp1.score + kp2.score) / 2;
        const lineWidth = Math.max(3, Math.min(6, avgConfidence * 5));
        const lineColor = getLineColor(i, j);

        // Draw main skeleton line with color coding
        ctx.beginPath();
        ctx.moveTo(kp1.x, kp1.y);
        ctx.lineTo(kp2.x, kp2.y);
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
      }
    });
  };

  const updateDebugAngles = useCallback((keypoints: poseDetection.Keypoint[]) => {
    // Always calculate angles, even with low-confidence keypoints
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

    // Calculate angles with lower confidence threshold for debug
    const debugMinScore = debugMode ? 0.05 : 0.25;

    // Calculate knee angles
    if (isValidKeypoint(leftHip, debugMinScore) && isValidKeypoint(leftKnee, debugMinScore) && isValidKeypoint(leftAnkle, debugMinScore)) {
      angles.leftKnee = Math.round(calculateAngle(leftHip, leftKnee, leftAnkle));
    }
    if (isValidKeypoint(rightHip, debugMinScore) && isValidKeypoint(rightKnee, debugMinScore) && isValidKeypoint(rightAnkle, debugMinScore)) {
      angles.rightKnee = Math.round(calculateAngle(rightHip, rightKnee, rightAnkle));
    }

    // Calculate elbow angles
    if (isValidKeypoint(leftShoulder, debugMinScore) && isValidKeypoint(leftElbow, debugMinScore) && isValidKeypoint(leftWrist, debugMinScore)) {
      angles.leftElbow = Math.round(calculateAngle(leftShoulder, leftElbow, leftWrist));
    }
    if (isValidKeypoint(rightShoulder, debugMinScore) && isValidKeypoint(rightElbow, debugMinScore) && isValidKeypoint(rightWrist, debugMinScore)) {
      angles.rightElbow = Math.round(calculateAngle(rightShoulder, rightElbow, rightWrist));
    }

    // Calculate hip angles (for lunges/squats)
    if (isValidKeypoint(leftShoulder, debugMinScore) && isValidKeypoint(leftHip, debugMinScore) && isValidKeypoint(leftKnee, debugMinScore)) {
      angles.leftHip = Math.round(calculateAngle(leftShoulder, leftHip, leftKnee));
    }
    if (isValidKeypoint(rightShoulder, debugMinScore) && isValidKeypoint(rightHip, debugMinScore) && isValidKeypoint(rightKnee, debugMinScore)) {
      angles.rightHip = Math.round(calculateAngle(rightShoulder, rightHip, rightKnee));
    }

    // Calculate ankle spread ratio (for jumping jacks)
    if (isValidKeypoint(leftHip, debugMinScore) && isValidKeypoint(rightHip, debugMinScore) && isValidKeypoint(leftAnkle, debugMinScore) && isValidKeypoint(rightAnkle, debugMinScore)) {
      const hipWidth = Math.abs(leftHip.x - rightHip.x);
      const ankleWidth = Math.abs(leftAnkle.x - rightAnkle.x);
      angles.ankleSpread = Math.round((ankleWidth / hipWidth) * 100) / 100;
    }

    // Check arms up
    if (isValidKeypoint(leftShoulder, debugMinScore) && isValidKeypoint(leftWrist, debugMinScore) && isValidKeypoint(rightShoulder, debugMinScore) && isValidKeypoint(rightWrist, debugMinScore)) {
      angles.armsUp = leftWrist.y < leftShoulder.y && rightWrist.y < rightShoulder.y;
    }

    setDebugAngles(angles);
  }, [debugMode]);

  const countReps = useCallback((keypoints: poseDetection.Keypoint[]) => {
    const exercise = EXERCISES[selectedExercise];
    const result = exercise.detectRep(keypoints, isDownRef.current);

    if (result.isDown !== isDownRef.current) {
      isDownRef.current = result.isDown;
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

        // Trigger celebration effect
        setRepCelebration(true);
        setTimeout(() => setRepCelebration(false), 1500);

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

        {/* Enhanced Form Quality Indicator */}
        {isDetecting && formQuality && (
          <div className={`flex items-center gap-3 px-6 py-3 rounded-xl border-2 transition-all duration-300 ${formQuality === "good" ? "bg-green-500/20 border-green-400/50 text-green-400 shadow-lg shadow-green-400/20" :
            formQuality === "fair" ? "bg-yellow-500/20 border-yellow-400/50 text-yellow-400 shadow-lg shadow-yellow-400/20" :
              "bg-red-500/20 border-red-400/50 text-red-400 shadow-lg shadow-red-400/20"
            }`}>
            <div className={`w-4 h-4 rounded-full animate-pulse ${formQuality === "good" ? "bg-green-400" :
              formQuality === "fair" ? "bg-yellow-400" :
                "bg-red-400"
              }`} />
            <div className="flex flex-col">
              <span className="font-bold text-lg capitalize">Form: {formQuality}</span>
              <span className="text-sm opacity-80">
                {formQuality === "good" && "Excellent! Keep it up! 💪"}
                {formQuality === "fair" && "Good form, minor adjustments needed"}
                {formQuality === "poor" && "Move closer to camera for better detection"}
              </span>
            </div>
          </div>
        )}

        <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`absolute inset-0 w-full h-full object-cover ${debugMode ? 'opacity-50' : 'opacity-0'}`}
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
          />

          {/* Exercise and status indicator overlay */}
          {isDetecting && (
            <div className="absolute top-4 left-4 space-y-2">
              <div className="bg-black/70 text-white px-4 py-2 rounded-lg border border-white/20">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <span className="font-semibold text-sm">Tracking: {EXERCISES[selectedExercise].name}</span>
                </div>
              </div>

              {/* Debug status */}
              {debugMode && (
                <div className="bg-black/70 text-white px-4 py-2 rounded-lg border border-white/20 text-xs space-y-1">
                  <div>Detector: {detector ? '✅ Loaded' : '❌ Not loaded'}</div>
                  <div>Video Ready: {videoRef.current?.readyState >= 2 ? '✅ Ready' : '❌ Not ready'}</div>
                  <div>Video Size: {videoRef.current?.videoWidth}x{videoRef.current?.videoHeight}</div>
                  <div>Canvas: {canvasRef.current?.width}x{canvasRef.current?.height}</div>
                  <div>Backend: {tf.getBackend()}</div>
                </div>
              )}
            </div>
          )}

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
                <div>L: {debugAngles.leftKnee !== null ? `${debugAngles.leftKnee}°` : '—'}</div>
                <div>R: {debugAngles.rightKnee !== null ? `${debugAngles.rightKnee}°` : '—'}</div>
              </div>
              <div className="border-b border-white/20 pb-2 mb-2">
                <div className="text-muted-foreground text-xs uppercase">Elbows</div>
                <div>L: {debugAngles.leftElbow !== null ? `${debugAngles.leftElbow}°` : '—'}</div>
                <div>R: {debugAngles.rightElbow !== null ? `${debugAngles.rightElbow}°` : '—'}</div>
              </div>
              <div className="border-b border-white/20 pb-2 mb-2">
                <div className="text-muted-foreground text-xs uppercase">Hips</div>
                <div>L: {debugAngles.leftHip !== null ? `${debugAngles.leftHip}°` : '—'}</div>
                <div>R: {debugAngles.rightHip !== null ? `${debugAngles.rightHip}°` : '—'}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs uppercase">Other</div>
                <div>Spread: {debugAngles.ankleSpread !== null ? `${debugAngles.ankleSpread}x` : '—'}</div>
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
          {debugMode && (
            <Button
              onClick={async () => {
                if (detector && videoRef.current && videoRef.current.readyState >= 2) {
                  try {
                    const testPoses = await detector.estimatePoses(videoRef.current, {
                      maxPoses: 1,
                      flipHorizontal: false,
                      scoreThreshold: 0.1,
                    });
                    console.log("Manual test - Poses detected:", testPoses.length);
                    if (testPoses.length > 0) {
                      console.log("Manual test - Keypoints:", testPoses[0].keypoints.length);
                      alert(`Test successful! Detected ${testPoses[0].keypoints.length} keypoints`);
                    } else {
                      alert("Test failed - No poses detected");
                    }
                  } catch (error) {
                    console.error("Manual test error:", error);
                    alert(`Test error: ${error.message}`);
                  }
                } else {
                  alert("Detector not ready or video not loaded");
                }
              }}
              variant="outline"
              size="sm"
              title="Test pose detection manually"
            >
              Test
            </Button>
          )}
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
