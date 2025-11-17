import { useEffect, useRef, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import * as poseDetection from "@tensorflow-models/pose-detection";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Camera, StopCircle } from "lucide-react";

export default function PoseDetector() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detector, setDetector] = useState<poseDetection.PoseDetector | null>(null);
  const [repCount, setRepCount] = useState(0);
  const [isDown, setIsDown] = useState(false);
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

  const loadModel = async () => {
    try {
      await tf.ready();
      const detectorConfig = {
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
      };
      const poseDetector = await poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet,
        detectorConfig
      );
      setDetector(poseDetector);
    } catch (error) {
      console.error("Error loading model:", error);
      toast({
        title: "Error",
        description: "Failed to load pose detection model",
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
        setIsDetecting(true);
        detectPose();
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
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsDetecting(false);
  };

  const detectPose = async () => {
    if (!detector || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    const detect = async () => {
      if (!isDetecting) return;

      const poses = await detector.estimatePoses(video);
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      if (poses.length > 0) {
        const pose = poses[0];
        drawKeypoints(pose.keypoints, ctx);
        drawSkeleton(pose.keypoints, ctx);
        countReps(pose.keypoints);
      }

      requestAnimationFrame(detect);
    };

    detect();
  };

  const drawKeypoints = (keypoints: any[], ctx: CanvasRenderingContext2D) => {
    keypoints.forEach((keypoint) => {
      if (keypoint.score && keypoint.score > 0.3) {
        ctx.beginPath();
        ctx.arc(keypoint.x, keypoint.y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = "#00FF9C";
        ctx.fill();
      }
    });
  };

  const drawSkeleton = (keypoints: any[], ctx: CanvasRenderingContext2D) => {
    const adjacentKeyPoints = [
      [5, 7], [7, 9], [6, 8], [8, 10], [5, 6],
      [5, 11], [6, 12], [11, 12], [11, 13],
      [13, 15], [12, 14], [14, 16]
    ];

    adjacentKeyPoints.forEach(([i, j]) => {
      const kp1 = keypoints[i];
      const kp2 = keypoints[j];
      if (kp1.score > 0.3 && kp2.score > 0.3) {
        ctx.beginPath();
        ctx.moveTo(kp1.x, kp1.y);
        ctx.lineTo(kp2.x, kp2.y);
        ctx.strokeStyle = "#4CC9F0";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });
  };

  const countReps = (keypoints: any[]) => {
    // Simple squat detection based on hip height
    const leftHip = keypoints[11];
    const rightHip = keypoints[12];
    const leftKnee = keypoints[13];
    const rightKnee = keypoints[14];

    if (leftHip.score > 0.3 && rightHip.score > 0.3 && 
        leftKnee.score > 0.3 && rightKnee.score > 0.3) {
      const hipY = (leftHip.y + rightHip.y) / 2;
      const kneeY = (leftKnee.y + rightKnee.y) / 2;
      const threshold = 50;

      if (hipY > kneeY - threshold && !isDown) {
        setIsDown(true);
      } else if (hipY < kneeY - threshold * 2 && isDown) {
        setIsDown(false);
        setRepCount(prev => prev + 1);
        toast({
          title: "Great job!",
          description: `Rep ${repCount + 1} completed`,
        });
      }
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">AI Pose Detector</h2>
          <div className="text-3xl font-bold text-primary">
            Reps: {repCount}
          </div>
        </div>

        <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover opacity-0"
            onLoadedMetadata={() => {
              if (canvasRef.current && videoRef.current) {
                canvasRef.current.width = videoRef.current.videoWidth;
                canvasRef.current.height = videoRef.current.videoHeight;
              }
            }}
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
            onClick={() => setRepCount(0)} 
            variant="outline"
          >
            Reset Count
          </Button>
        </div>

        <div className="text-sm text-muted-foreground space-y-2">
          <p>• Position yourself so your full body is visible in the camera</p>
          <p>• Perform squats to count reps automatically</p>
          <p>• The AI will track your movements in real-time</p>
        </div>
      </div>
    </Card>
  );
}
