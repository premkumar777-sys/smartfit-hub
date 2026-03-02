import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft,
    Camera,
    CameraOff,
    Eye,
    RotateCcw,
    Activity,
    Target,
    AlertTriangle,
    ChevronRight,
    Zap,
    TrendingUp,
    CheckCircle2,
    Flame,
    Dumbbell,
    PersonStanding,
    ArrowUpDown,
    Waves,
    Footprints,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/Container";
import { toast } from "sonner";
import * as poseDetection from "@tensorflow-models/pose-detection";
import * as tf from "@tensorflow/tfjs";

// ─── Types ─────────────────────────────────────────────
type Exercise = "squat" | "pushup" | "bicepCurl" | "lunge" | "shoulderPress" | "tricepExtension" | "lateralRaise" | "romanianDeadlift" | "jumpingJack";

interface ExerciseConfig {
    id: Exercise;
    name: string;
    icon: React.ReactNode;
    description: string;
    targetAngles: { joint: string; down: number; up: number };
    keypointsUsed: string[];
    tips: string[];
}

interface RepState {
    count: number;
    phase: "up" | "down";
    angle: number;
    feedback: string;
    feedbackType: "good" | "warning" | "info";
}

// ─── Exercise Configs ──────────────────────────────────
const EXERCISES: ExerciseConfig[] = [
    {
        id: "squat",
        name: "Squats",
        icon: <Activity className="w-5 h-5" />,
        description: "Track squat depth and knee alignment",
        targetAngles: { joint: "knee", down: 90, up: 160 },
        keypointsUsed: ["left_hip", "left_knee", "left_ankle"],
        tips: [
            "Keep knees aligned with toes",
            "Push hips back as you descend",
            "Keep chest up and core tight",
            "Feet shoulder-width apart",
        ],
    },
    {
        id: "pushup",
        name: "Push-ups",
        icon: <Target className="w-5 h-5" />,
        description: "Monitor elbow angle and body line",
        targetAngles: { joint: "elbow", down: 90, up: 160 },
        keypointsUsed: ["left_shoulder", "left_elbow", "left_wrist"],
        tips: [
            "Hands slightly wider than shoulders",
            "Keep elbows at 45° from body",
            "Maintain straight line head to heels",
            "Lower chest to near floor",
        ],
    },
    {
        id: "bicepCurl",
        name: "Bicep Curls",
        icon: <Zap className="w-5 h-5" />,
        description: "Track curl range of motion and form",
        targetAngles: { joint: "elbow", down: 160, up: 40 },
        keypointsUsed: ["left_shoulder", "left_elbow", "left_wrist"],
        tips: [
            "Keep elbows close to body",
            "Control the movement both ways",
            "Squeeze at the top",
            "Don't swing the weights",
        ],
    },
    {
        id: "lunge",
        name: "Lunges",
        icon: <Footprints className="w-5 h-5" />,
        description: "Track front knee angle and hip depth",
        targetAngles: { joint: "knee", down: 90, up: 160 },
        keypointsUsed: ["left_hip", "left_knee", "left_ankle"],
        tips: [
            "Step forward with one foot",
            "Lower back knee toward the floor",
            "Front knee stays over ankle",
            "Keep torso upright and core tight",
        ],
    },
    {
        id: "shoulderPress",
        name: "Shoulder Press",
        icon: <ArrowUpDown className="w-5 h-5" />,
        description: "Track overhead press range of motion",
        targetAngles: { joint: "elbow", down: 90, up: 160 },
        keypointsUsed: ["left_shoulder", "left_elbow", "left_wrist"],
        tips: [
            "Start with elbows at 90° at shoulder height",
            "Press straight up, lock out at the top",
            "Keep core braced throughout",
            "Don't flare elbows too wide",
        ],
    },
    {
        id: "tricepExtension",
        name: "Tricep Extension",
        icon: <Flame className="w-5 h-5" />,
        description: "Track elbow extension overhead",
        targetAngles: { joint: "elbow", down: 50, up: 160 },
        keypointsUsed: ["left_shoulder", "left_elbow", "left_wrist"],
        tips: [
            "Keep upper arms still beside ears",
            "Lower weight behind head with control",
            "Fully extend at the top to squeeze triceps",
            "Don't flare elbows outward",
        ],
    },
    {
        id: "lateralRaise",
        name: "Lateral Raises",
        icon: <Waves className="w-5 h-5" />,
        description: "Track shoulder raise angle",
        targetAngles: { joint: "shoulder", down: 20, up: 85 },
        keypointsUsed: ["left_hip", "left_shoulder", "left_elbow"],
        tips: [
            "Slight bend in elbows throughout",
            "Raise to shoulder height, not higher",
            "Control the descent slowly",
            "Avoid shrugging shoulders",
        ],
    },
    {
        id: "romanianDeadlift",
        name: "Romanian Deadlift",
        icon: <Dumbbell className="w-5 h-5" />,
        description: "Track hip hinge depth and back angle",
        targetAngles: { joint: "hip", down: 70, up: 160 },
        keypointsUsed: ["left_shoulder", "left_hip", "left_knee"],
        tips: [
            "Hinge at the hips, not the waist",
            "Keep back flat throughout the movement",
            "Soft bend in knees, feel the hamstrings",
            "Drive hips forward to stand up",
        ],
    },
    {
        id: "jumpingJack",
        name: "Jumping Jacks",
        icon: <PersonStanding className="w-5 h-5" />,
        description: "Track arm raise and full-body movement",
        targetAngles: { joint: "shoulder", down: 20, up: 150 },
        keypointsUsed: ["left_hip", "left_shoulder", "left_elbow"],
        tips: [
            "Land softly on balls of feet",
            "Raise arms fully overhead each rep",
            "Keep a steady rhythm",
            "Engage core throughout",
        ],
    },
];

// ─── Angle Utility ─────────────────────────────────────
function calculateAngle(
    a: { x: number; y: number },
    b: { x: number; y: number },
    c: { x: number; y: number }
): number {
    const radians =
        Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs((radians * 180) / Math.PI);
    if (angle > 180) angle = 360 - angle;
    return angle;
}

// ─── Component ─────────────────────────────────────────
const WorkoutSession = () => {
    const navigate = useNavigate();

    // State
    const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [isModelLoading, setIsModelLoading] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [repState, setRepState] = useState<RepState>({
        count: 0,
        phase: "up",
        angle: 0,
        feedback: "Select an exercise and start the camera",
        feedbackType: "info",
    });
    const [sessionStats, setSessionStats] = useState({
        totalReps: 0,
        bestAngle: 0,
        duration: 0,
    });
    const [sessionActive, setSessionActive] = useState(false);
    const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);

    // Refs
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const detectorRef = useRef<poseDetection.PoseDetector | null>(null);
    const animFrameRef = useRef<number | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const repStateRef = useRef(repState);

    // Keep ref in sync
    useEffect(() => {
        repStateRef.current = repState;
    }, [repState]);

    // Duration timer
    useEffect(() => {
        if (!sessionActive || !sessionStartTime) return;
        const interval = setInterval(() => {
            setSessionStats((prev) => ({
                ...prev,
                duration: Math.floor((Date.now() - sessionStartTime) / 1000),
            }));
        }, 1000);
        return () => clearInterval(interval);
    }, [sessionActive, sessionStartTime]);

    // ─── Model Loading ──────────────────────────────────
    const loadModel = useCallback(async () => {
        setIsModelLoading(true);
        try {
            await tf.ready();
            const model = poseDetection.SupportedModels.MoveNet;
            const detector = await poseDetection.createDetector(model, {
                modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
            });
            detectorRef.current = detector;
            toast.success("AI model loaded successfully");
        } catch (err) {
            console.error("Error loading model:", err);
            toast.error("Failed to load AI model. Please refresh and try again.");
        } finally {
            setIsModelLoading(false);
        }
    }, []);

    // ─── Camera Start ───────────────────────────────────
    const startCamera = useCallback(async () => {
        if (!selectedExercise) {
            toast.error("Please select an exercise first");
            return;
        }

        setCameraError(null);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "user", width: 640, height: 480 },
            });

            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }

            setIsCameraOn(true);

            if (!detectorRef.current) {
                await loadModel();
            }

            setSessionActive(true);
            setSessionStartTime(Date.now());
            setRepState({
                count: 0,
                phase: "up",
                angle: 0,
                feedback: "Get into starting position",
                feedbackType: "info",
            });

            // Start detection loop
            detectPose();
        } catch (err: unknown) {
            console.error("Camera error:", err);
            const msg =
                err instanceof Error && err.name === "NotAllowedError"
                    ? "Camera access denied. Please allow camera permission in your browser settings."
                    : "Could not access camera. Make sure no other app is using it.";
            setCameraError(msg);
            toast.error(msg);
        }
    }, [selectedExercise, loadModel]);

    // ─── Camera Stop ────────────────────────────────────
    const stopCamera = useCallback(() => {
        if (animFrameRef.current) {
            cancelAnimationFrame(animFrameRef.current);
            animFrameRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setIsCameraOn(false);
        setSessionActive(false);
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopCamera();
            if (detectorRef.current) {
                detectorRef.current.dispose();
            }
        };
    }, [stopCamera]);

    // ─── Pose Detection Loop ───────────────────────────
    const detectPose = useCallback(async () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const detector = detectorRef.current;

        if (!video || !canvas || !detector || video.readyState < 2) {
            animFrameRef.current = requestAnimationFrame(detectPose);
            return;
        }

        try {
            const poses = await detector.estimatePoses(video);
            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            // Clear and draw video frame
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Mirror the canvas
            ctx.save();
            ctx.scale(-1, 1);
            ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
            ctx.restore();

            if (poses.length > 0 && poses[0].keypoints) {
                const keypoints = poses[0].keypoints;
                drawSkeleton(ctx, keypoints, canvas.width);
                processExercise(keypoints, canvas.width);
            }
        } catch (err) {
            // Silently skip detection errors
        }

        animFrameRef.current = requestAnimationFrame(detectPose);
    }, []);

    // ─── Skeleton Drawing ──────────────────────────────
    const drawSkeleton = (
        ctx: CanvasRenderingContext2D,
        keypoints: poseDetection.Keypoint[],
        canvasWidth: number
    ) => {
        const MIN_CONFIDENCE = 0.3;

        // Mirror X coordinates
        const mirror = (x: number) => canvasWidth - x;

        // Draw keypoints
        keypoints.forEach((kp) => {
            if ((kp.score ?? 0) > MIN_CONFIDENCE) {
                ctx.beginPath();
                ctx.arc(mirror(kp.x), kp.y, 6, 0, 2 * Math.PI);
                ctx.fillStyle = "#00FF9C";
                ctx.fill();
                ctx.strokeStyle = "#000";
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        });

        // Draw connections
        const connections = [
            ["left_shoulder", "right_shoulder"],
            ["left_shoulder", "left_elbow"],
            ["left_elbow", "left_wrist"],
            ["right_shoulder", "right_elbow"],
            ["right_elbow", "right_wrist"],
            ["left_shoulder", "left_hip"],
            ["right_shoulder", "right_hip"],
            ["left_hip", "right_hip"],
            ["left_hip", "left_knee"],
            ["left_knee", "left_ankle"],
            ["right_hip", "right_knee"],
            ["right_knee", "right_ankle"],
        ];

        connections.forEach(([nameA, nameB]) => {
            const a = keypoints.find((k) => k.name === nameA);
            const b = keypoints.find((k) => k.name === nameB);
            if (a && b && (a.score ?? 0) > MIN_CONFIDENCE && (b.score ?? 0) > MIN_CONFIDENCE) {
                ctx.beginPath();
                ctx.moveTo(mirror(a.x), a.y);
                ctx.lineTo(mirror(b.x), b.y);
                ctx.strokeStyle = "rgba(0, 255, 156, 0.7)";
                ctx.lineWidth = 3;
                ctx.stroke();
            }
        });
    };

    // ─── Exercise Processing ───────────────────────────
    const processExercise = (
        keypoints: poseDetection.Keypoint[],
        canvasWidth: number
    ) => {
        if (!selectedExercise) return;

        const config = EXERCISES.find((e) => e.id === selectedExercise);
        if (!config) return;

        const getKp = (name: string) => {
            const kp = keypoints.find((k) => k.name === name);
            if (kp && (kp.score ?? 0) > 0.3) {
                // Mirror x for correct angle calculation
                return { x: canvasWidth - kp.x, y: kp.y };
            }
            return null;
        };

        const [nameA, nameB, nameC] = config.keypointsUsed;
        const a = getKp(nameA);
        const b = getKp(nameB);
        const c = getKp(nameC);

        if (!a || !b || !c) {
            setRepState((prev) => ({
                ...prev,
                feedback: "Position yourself so the camera can see your full body",
                feedbackType: "warning",
            }));
            return;
        }

        const angle = calculateAngle(a, b, c);
        const current = repStateRef.current;

        let newPhase = current.phase;
        let newCount = current.count;
        let feedback = "";
        let feedbackType: RepState["feedbackType"] = "info";

        if (selectedExercise === "bicepCurl" || selectedExercise === "tricepExtension") {
            // Curl-type: low angle = fully curled/extended, high angle = starting position
            const extendedThreshold = selectedExercise === "tricepExtension" ? 150 : 140;
            const contractedThreshold = selectedExercise === "tricepExtension" ? 60 : 50;
            if (current.phase === "up" && angle > extendedThreshold) {
                newPhase = "down";
                feedback = selectedExercise === "tricepExtension" ? "Good! Now extend fully" : "Good extension! Now curl up";
                feedbackType = "good";
            } else if (current.phase === "down" && angle < contractedThreshold) {
                newPhase = "up";
                newCount = current.count + 1;
                feedback = `Rep ${newCount}! ${selectedExercise === "tricepExtension" ? "Squeeze those triceps! 💪" : "Great squeeze! 💪"}`;
                feedbackType = "good";
            } else if (current.phase === "down") {
                feedback = selectedExercise === "tricepExtension" ? "Extend arms fully overhead" : "Keep curling, squeeze at the top";
                feedbackType = "info";
            } else {
                feedback = selectedExercise === "tricepExtension" ? "Lower weight behind head" : "Extend arm fully";
                feedbackType = "info";
            }
        } else if (selectedExercise === "lateralRaise" || selectedExercise === "jumpingJack") {
            // Raise-type: high angle = arms raised, low angle = arms down
            if (current.phase === "down" && angle > config.targetAngles.up - 10) {
                newPhase = "up";
                feedback = selectedExercise === "jumpingJack" ? "Arms up! Now back down" : "Shoulder height — now lower with control";
                feedbackType = "good";
            } else if (current.phase === "up" && angle < config.targetAngles.down + 10) {
                newPhase = "down";
                newCount = current.count + 1;
                feedback = `Rep ${newCount}! Keep going! 🔥`;
                feedbackType = "good";
            } else if (current.phase === "down") {
                feedback = selectedExercise === "jumpingJack" ? "Raise arms overhead" : "Raise arms to shoulder height";
                feedbackType = "info";
            } else {
                feedback = "Lower arms back down";
                feedbackType = "info";
            }
        } else {
            // Squat, Pushup, Lunge, Shoulder Press, Romanian Deadlift
            // Low angle = bottom / contracted, high angle = top / extended
            const depthMessages: Record<string, string> = {
                squat: "Great depth! Now push up",
                pushup: "Good depth! Push up strong",
                lunge: "Deep lunge! Now stand back up",
                shoulderPress: "Arms overhead! Now lower with control",
                romanianDeadlift: "Good hip hinge! Drive hips forward to stand",
            };
            const driveMessages: Record<string, string> = {
                squat: "Go lower, aim for 90° at the knee",
                pushup: "Lower your chest more",
                lunge: "Lower the back knee toward the floor",
                shoulderPress: "Lower to 90° at the elbows",
                romanianDeadlift: "Hinge deeper at the hips",
            };
            if (current.phase === "up" && angle < config.targetAngles.down + 10) {
                newPhase = "down";
                feedback = depthMessages[selectedExercise] ?? "Good depth! Now push up";
                feedbackType = "good";
            } else if (current.phase === "down" && angle > config.targetAngles.up - 10) {
                newPhase = "up";
                newCount = current.count + 1;
                feedback = `Rep ${newCount}! Keep it up! 🔥`;
                feedbackType = "good";
            } else if (current.phase === "up" && angle > config.targetAngles.up - 20) {
                feedback = driveMessages[selectedExercise] ?? "Go deeper";
                feedbackType = "info";
            } else {
                feedback = "Good form, keep going!";
                feedbackType = "info";
            }
        }

        setRepState({
            count: newCount,
            phase: newPhase,
            angle: Math.round(angle),
            feedback,
            feedbackType,
        });

        if (newCount > current.count) {
            setSessionStats((prev) => ({
                ...prev,
                totalReps: prev.totalReps + 1,
                bestAngle: Math.min(prev.bestAngle || 999, Math.round(angle)),
            }));
        }
    };

    // ─── Reset Session ──────────────────────────────────
    const resetSession = () => {
        setRepState({
            count: 0,
            phase: "up",
            angle: 0,
            feedback: "Session reset. Get into starting position!",
            feedbackType: "info",
        });
        setSessionStats({ totalReps: 0, bestAngle: 0, duration: 0 });
        setSessionStartTime(Date.now());
    };

    // ─── Format Time ────────────────────────────────────
    const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
    };

    const exerciseConfig = EXERCISES.find((e) => e.id === selectedExercise);

    // ─── Render ─────────────────────────────────────────
    return (
        <div className="min-h-screen py-20">
            <Container className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600">
                                <Eye className="w-6 h-6 text-white" />
                            </div>
                            Real-Time Form Detection
                        </h1>
                        <p className="text-muted-foreground mt-2">
                            AI-powered pose detection analyzes your movement for perfect form
                        </p>
                    </div>
                    <Button variant="ghost" size="lg" onClick={() => navigate(-1)}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                </div>

                {/* Exercise Selector */}
                {!sessionActive && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                    >
                        {EXERCISES.map((ex) => (
                            <button
                                key={ex.id}
                                onClick={() => {
                                    setSelectedExercise(ex.id);
                                    setRepState((prev) => ({
                                        ...prev,
                                        feedback: `${ex.name} selected. Start the camera to begin!`,
                                        feedbackType: "info",
                                    }));
                                }}
                                className={`group relative p-6 rounded-2xl border transition-all duration-300 text-left ${selectedExercise === ex.id
                                    ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
                                    : "border-border bg-card/50 hover:border-primary/50 hover:bg-card/80"
                                    }`}
                            >
                                <div
                                    className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-colors ${selectedExercise === ex.id
                                        ? "bg-primary text-white"
                                        : "bg-muted text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary"
                                        }`}
                                >
                                    {ex.icon}
                                </div>
                                <h3 className="text-lg font-bold mb-1">{ex.name}</h3>
                                <p className="text-sm text-muted-foreground">{ex.description}</p>
                                {selectedExercise === ex.id && (
                                    <motion.div
                                        layoutId="exercise-check"
                                        className="absolute top-4 right-4 text-primary"
                                    >
                                        <CheckCircle2 className="w-6 h-6" />
                                    </motion.div>
                                )}
                            </button>
                        ))}
                    </motion.div>
                )}

                {/* Main Content */}
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Camera Feed */}
                    <div className="lg:col-span-2">
                        <div className="relative rounded-2xl overflow-hidden bg-black/90 border border-border aspect-video">
                            {/* Video (hidden, used as source) */}
                            <video
                                ref={videoRef}
                                className="hidden"
                                playsInline
                                muted
                            />

                            {/* Canvas for skeleton overlay */}
                            <canvas
                                ref={canvasRef}
                                className={`w-full h-full object-contain ${isCameraOn ? "block" : "hidden"}`}
                            />

                            {/* Placeholder when camera is off */}
                            {!isCameraOn && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                                    {isModelLoading ? (
                                        <>
                                            <div className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                                            <p className="text-muted-foreground">Loading AI model...</p>
                                        </>
                                    ) : cameraError ? (
                                        <>
                                            <AlertTriangle className="w-12 h-12 text-yellow-500" />
                                            <p className="text-muted-foreground text-center max-w-sm px-4">
                                                {cameraError}
                                            </p>
                                            <Button onClick={startCamera} variant="outline">
                                                Try Again
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <div className="p-6 rounded-full bg-primary/10">
                                                <Camera className="w-12 h-12 text-primary" />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-lg font-medium text-white mb-1">
                                                    {selectedExercise
                                                        ? "Ready to start"
                                                        : "Select an exercise first"}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {selectedExercise
                                                        ? "Click the button below to activate your camera"
                                                        : "Choose an exercise from above to get started"}
                                                </p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Rep counter overlay */}
                            {isCameraOn && (
                                <>
                                    <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/10">
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider">
                                            Reps
                                        </p>
                                        <p className="text-3xl font-bold text-primary tabular-nums">
                                            {repState.count}
                                        </p>
                                    </div>

                                    <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/10">
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider">
                                            Angle
                                        </p>
                                        <p className="text-3xl font-bold text-white tabular-nums">
                                            {repState.angle}°
                                        </p>
                                    </div>

                                    <div
                                        className={`absolute bottom-4 left-4 right-4 rounded-xl px-4 py-3 border backdrop-blur-sm ${repState.feedbackType === "good"
                                            ? "bg-green-500/20 border-green-500/30 text-green-400"
                                            : repState.feedbackType === "warning"
                                                ? "bg-yellow-500/20 border-yellow-500/30 text-yellow-400"
                                                : "bg-blue-500/20 border-blue-500/30 text-blue-400"
                                            }`}
                                    >
                                        <p className="text-sm font-medium text-center">
                                            {repState.feedback}
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Camera controls */}
                        <div className="flex gap-3 mt-4">
                            {!isCameraOn ? (
                                <Button
                                    variant="hero"
                                    size="lg"
                                    className="flex-1"
                                    onClick={startCamera}
                                    disabled={!selectedExercise || isModelLoading}
                                >
                                    <Camera className="mr-2 h-5 w-5" />
                                    {isModelLoading ? "Loading AI..." : "Start Camera"}
                                </Button>
                            ) : (
                                <>
                                    <Button
                                        variant="destructive"
                                        size="lg"
                                        className="flex-1"
                                        onClick={stopCamera}
                                    >
                                        <CameraOff className="mr-2 h-5 w-5" />
                                        Stop Camera
                                    </Button>
                                    <Button variant="outline" size="lg" onClick={resetSession}>
                                        <RotateCcw className="mr-2 h-5 w-5" />
                                        Reset
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Side Panel */}
                    <div className="space-y-4">
                        {/* Session Stats */}
                        <div className="rounded-2xl border border-border bg-card/50 p-6 space-y-4">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-primary" />
                                Session Stats
                            </h3>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="text-center p-3 rounded-xl bg-muted/30">
                                    <p className="text-2xl font-bold text-primary tabular-nums">
                                        {repState.count}
                                    </p>
                                    <p className="text-xs text-muted-foreground">Reps</p>
                                </div>
                                <div className="text-center p-3 rounded-xl bg-muted/30">
                                    <p className="text-2xl font-bold text-white tabular-nums">
                                        {repState.angle}°
                                    </p>
                                    <p className="text-xs text-muted-foreground">Angle</p>
                                </div>
                                <div className="text-center p-3 rounded-xl bg-muted/30">
                                    <p className="text-2xl font-bold text-white tabular-nums">
                                        {formatTime(sessionStats.duration)}
                                    </p>
                                    <p className="text-xs text-muted-foreground">Time</p>
                                </div>
                            </div>

                            {/* Phase indicator */}
                            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border">
                                <span className="text-sm text-muted-foreground">Phase</span>
                                <span
                                    className={`text-sm font-bold uppercase px-3 py-1 rounded-full ${repState.phase === "down"
                                        ? "bg-orange-500/20 text-orange-400"
                                        : "bg-green-500/20 text-green-400"
                                        }`}
                                >
                                    {repState.phase}
                                </span>
                            </div>
                        </div>

                        {/* Form Guide */}
                        <AnimatePresence mode="wait">
                            {exerciseConfig && (
                                <motion.div
                                    key={selectedExercise}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="rounded-2xl border border-border bg-card/50 p-6 space-y-4"
                                >
                                    <h3 className="text-lg font-bold text-primary">
                                        {exerciseConfig.name} Form Guide
                                    </h3>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3 rounded-xl bg-muted/30 text-center">
                                            <p className="text-xs text-muted-foreground">Target ↓</p>
                                            <p className="text-lg font-bold">
                                                {exerciseConfig.targetAngles.down}°
                                            </p>
                                        </div>
                                        <div className="p-3 rounded-xl bg-muted/30 text-center">
                                            <p className="text-xs text-muted-foreground">Target ↑</p>
                                            <p className="text-lg font-bold">
                                                {exerciseConfig.targetAngles.up}°
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="text-sm font-semibold">Key Points:</p>
                                        <ul className="space-y-1.5">
                                            {exerciseConfig.tips.map((tip, i) => (
                                                <li
                                                    key={i}
                                                    className="text-sm text-muted-foreground flex items-start gap-2"
                                                >
                                                    <ChevronRight className="w-3 h-3 mt-1 text-primary shrink-0" />
                                                    {tip}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* How it works (when no exercise selected) */}
                        {!selectedExercise && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="rounded-2xl border border-border bg-card/50 p-6 space-y-4"
                            >
                                <h3 className="text-lg font-bold">How It Works</h3>
                                <div className="space-y-3">
                                    {[
                                        {
                                            step: "1",
                                            text: "Select an exercise from the cards above",
                                        },
                                        {
                                            step: "2",
                                            text: "Allow camera access and position yourself",
                                        },
                                        {
                                            step: "3",
                                            text: "AI detects your pose and counts reps automatically",
                                        },
                                        {
                                            step: "4",
                                            text: "Get real-time feedback on your form",
                                        },
                                    ].map((item) => (
                                        <div
                                            key={item.step}
                                            className="flex items-start gap-3"
                                        >
                                            <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                                                {item.step}
                                            </div>
                                            <p className="text-sm text-muted-foreground pt-1">
                                                {item.text}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
            </Container>
        </div>
    );
};

export default WorkoutSession;
