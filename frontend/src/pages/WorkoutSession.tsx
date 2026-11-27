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
    Sparkles,
    Video,
    Volume2,
    VolumeX,
} from "lucide-react";
import { WorkoutSummaryLogModal } from "@/components/WorkoutSummaryLogModal";
import { WorkoutSummaryData } from "@/components/WorkoutSummaryCard";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/Container";
import { toast } from "sonner";
import * as poseDetection from "@tensorflow-models/pose-detection";
import * as tf from "@tensorflow/tfjs";
import { useGamification } from "@/hooks/useGamification";

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
    depthProgress: number;
    feedback: string;
    feedbackType: "good" | "warning" | "info";
    bodyInFrame: boolean;
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

// ─── 3D Demonstration Videos Mapping (Plan A) ───────────
const EXERCISE_3D_VIDEOS: Record<string, { videoFile: string; name: string }> = {
    squat: { videoFile: "/squat.mp4", name: "Squats" },
    pushup: { videoFile: "/pushup.mp4", name: "Push-ups" },
    bicepCurl: { videoFile: "/bicep.mp4", name: "Bicep Curls" },
    lunge: { videoFile: "/Leg Press.mp4", name: "Lunges & Leg Drive" },
    shoulderPress: { videoFile: "/shoulderpress.mp4", name: "Shoulder Press" },
    tricepExtension: { videoFile: "/overheadtriceps.mp4", name: "Overhead Tricep Extension" },
    lateralRaise: { videoFile: "/TotalShoulder.mp4", name: "Lateral Raise & Delts" },
    romanianDeadlift: { videoFile: "/Back Relaxing.mp4", name: "Hinge & Back Alignment" },
    jumpingJack: { videoFile: "/UpperBody.mp4", name: "Full Body Dynamic Motion" },
};

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
    const gamification = useGamification();

    // State
    const [selectedExercise, setSelectedExercise] = useState<Exercise>("squat");
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
    const [isSoundMuted, setIsSoundMuted] = useState(false);
    const [isModelLoading, setIsModelLoading] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [repState, setRepState] = useState<RepState>({
        count: 0,
        phase: "up",
        angle: 0,
        depthProgress: 0,
        feedback: "Select an exercise and start the camera",
        feedbackType: "info",
        bodyInFrame: true,
    });
    const [sessionStats, setSessionStats] = useState({
        totalReps: 0,
        bestAngle: 0,
        duration: 0,
    });
    const [sessionActive, setSessionActive] = useState(false);
    const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
    const [isLogModalOpen, setIsLogModalOpen] = useState(false);
    const [prefilledData, setPrefilledData] = useState<Partial<WorkoutSummaryData>>({});
    const [show3dPiP, setShow3dPiP] = useState(false);
    const [is3dMuted, setIs3dMuted] = useState(true);
    const [liveFps, setLiveFps] = useState<number>(30);

    // Refs
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const cameraRef = useRef<HTMLDivElement>(null);
    const detectorRef = useRef<poseDetection.PoseDetector | null>(null);
    const animFrameRef = useRef<number | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const repStateRef = useRef(repState);
    const isCameraOnRef = useRef(false);
    const selectedExerciseRef = useRef(selectedExercise);
    const smoothedAngleRef = useRef<number>(0);
    const lastRepTimeRef = useRef<number>(0);
    const isInferringRef = useRef<boolean>(false);
    const lastUiUpdateRef = useRef<number>(0);
    const fpsTrackerRef = useRef<{ frames: number; lastTime: number }>({ frames: 0, lastTime: performance.now() });

    useEffect(() => {
        selectedExerciseRef.current = selectedExercise;
    }, [selectedExercise]);

    // High-definition audio chime & mobile haptic pulse on successful rep completion
    const playRepChime = useCallback(() => {
        if (isSoundMuted) return;
        try {
            if (typeof navigator !== "undefined" && navigator.vibrate) {
                navigator.vibrate([40, 30, 80]);
            }
            const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            if (!AudioCtx) return;
            const ctx = new AudioCtx();
            
            // Primary tone (Crisp modern fitness tracker chime)
            const osc1 = ctx.createOscillator();
            const gain1 = ctx.createGain();
            osc1.type = "sine";
            osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
            osc1.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + 0.14); // D6
            gain1.gain.setValueAtTime(0.3, ctx.currentTime);
            gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.20);
            osc1.connect(gain1);
            gain1.connect(ctx.destination);
            osc1.start();
            osc1.stop(ctx.currentTime + 0.20);

            // Shimmer harmonic sparkle
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.type = "triangle";
            osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.04); // A5
            osc2.frequency.exponentialRampToValueAtTime(1479.98, ctx.currentTime + 0.18); // F#6
            gain2.gain.setValueAtTime(0.18, ctx.currentTime + 0.04);
            gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.24);
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            osc2.start(ctx.currentTime + 0.04);
            osc2.stop(ctx.currentTime + 0.24);
        } catch (_) {}
    }, [isSoundMuted]);

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
        if (detectorRef.current) return detectorRef.current;
        setIsModelLoading(true);
        try {
            if (tf.getBackend() !== "webgl") {
                try {
                    await tf.setBackend("webgl");
                } catch (_) {}
            }
            await tf.ready();
            const model = poseDetection.SupportedModels.MoveNet;
            const detector = await poseDetection.createDetector(model, {
                modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
                enableSmoothing: true,
            });
            detectorRef.current = detector;
            return detector;
        } catch (err) {
            console.error("Error loading model:", err);
            return null;
        } finally {
            setIsModelLoading(false);
        }
    }, []);



    // ─── High-Tech Biomechanical Skeleton Rendering ──────────────────────
    const drawSkeleton = (
        ctx: CanvasRenderingContext2D,
        keypoints: poseDetection.Keypoint[],
        canvasWidth: number,
        canvasHeight: number,
        activeExercise: Exercise
    ): boolean => {
        const MIN_CONFIDENCE = 0.25;
        const isMirrored = facingMode === "user";
        const mirror = (x: number) => (isMirrored ? canvasWidth - x : x);

        // Check if sufficient keypoints are visible
        const validKps = keypoints.filter((k) => (k.score ?? 0) >= MIN_CONFIDENCE);
        const isBodyVisible = validKps.length >= 6;

        if (!isBodyVisible) {
            // Subtle, sleek corner alignment brackets instead of aggressive screaming red borders
            ctx.save();
            ctx.strokeStyle = "rgba(0, 255, 156, 0.3)";
            ctx.lineWidth = 2.5;
            const bLen = 28;
            // Top-left
            ctx.beginPath(); ctx.moveTo(24, 24 + bLen); ctx.lineTo(24, 24); ctx.lineTo(24 + bLen, 24); ctx.stroke();
            // Top-right
            ctx.beginPath(); ctx.moveTo(canvasWidth - 24 - bLen, 24); ctx.lineTo(canvasWidth - 24, 24); ctx.lineTo(canvasWidth - 24, 24 + bLen); ctx.stroke();
            // Bottom-left
            ctx.beginPath(); ctx.moveTo(24, canvasHeight - 24 - bLen); ctx.lineTo(24, canvasHeight - 24); ctx.lineTo(24 + bLen, canvasHeight - 24); ctx.stroke();
            // Bottom-right
            ctx.beginPath(); ctx.moveTo(canvasWidth - 24 - bLen, canvasHeight - 24); ctx.lineTo(canvasWidth - 24, canvasHeight - 24); ctx.lineTo(canvasWidth - 24, canvasHeight - 24 - bLen); ctx.stroke();
            ctx.restore();
            return false;
        }

        // 1. Semi-transparent Torso Muscle Core
        const lSho = keypoints.find((k) => k.name === "left_shoulder");
        const rSho = keypoints.find((k) => k.name === "right_shoulder");
        const lHip = keypoints.find((k) => k.name === "left_hip");
        const rHip = keypoints.find((k) => k.name === "right_hip");

        if (
            lSho && rSho && lHip && rHip &&
            (lSho.score ?? 0) > MIN_CONFIDENCE &&
            (rSho.score ?? 0) > MIN_CONFIDENCE &&
            (lHip.score ?? 0) > MIN_CONFIDENCE &&
            (rHip.score ?? 0) > MIN_CONFIDENCE
        ) {
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(mirror(lSho.x), lSho.y);
            ctx.lineTo(mirror(rSho.x), rSho.y);
            ctx.lineTo(mirror(rHip.x), rHip.y);
            ctx.lineTo(mirror(lHip.x), lHip.y);
            ctx.closePath();
            ctx.fillStyle = "rgba(0, 255, 156, 0.08)";
            ctx.fill();
            ctx.strokeStyle = "rgba(0, 255, 156, 0.35)";
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.restore();
        }

        // 2. High-Tech Cyberpunk Biomechanical Bones
        const connections = [
            ["nose", "left_eye"], ["nose", "right_eye"],
            ["left_eye", "left_ear"], ["right_eye", "right_ear"],
            ["left_shoulder", "right_shoulder"],
            ["left_shoulder", "left_elbow"], ["left_elbow", "left_wrist"],
            ["right_shoulder", "right_elbow"], ["right_elbow", "right_wrist"],
            ["left_shoulder", "left_hip"], ["right_shoulder", "right_hip"],
            ["left_hip", "right_hip"],
            ["left_hip", "left_knee"], ["left_knee", "left_ankle"],
            ["right_hip", "right_knee"], ["right_knee", "right_ankle"],
        ];

        const isLegExercise = activeExercise === "squat" || activeExercise === "lunge" || activeExercise === "romanianDeadlift";

        connections.forEach(([nameA, nameB]) => {
            const a = keypoints.find((k) => k.name === nameA);
            const b = keypoints.find((k) => k.name === nameB);
            if (a && b && (a.score ?? 0) >= MIN_CONFIDENCE && (b.score ?? 0) >= MIN_CONFIDENCE) {
                const isTargetConnection = isLegExercise
                    ? (nameA.includes("hip") || nameA.includes("knee") || nameA.includes("ankle")) &&
                      (nameB.includes("hip") || nameB.includes("knee") || nameB.includes("ankle"))
                    : (nameA.includes("shoulder") || nameA.includes("elbow") || nameA.includes("wrist")) &&
                      (nameB.includes("shoulder") || nameB.includes("elbow") || nameB.includes("wrist"));

                ctx.save();
                ctx.beginPath();
                ctx.moveTo(mirror(a.x), a.y);
                ctx.lineTo(mirror(b.x), b.y);
                ctx.lineCap = "round";
                ctx.lineJoin = "round";

                if (isTargetConnection) {
                    ctx.shadowColor = "#00FF9C";
                    ctx.shadowBlur = 10;
                    ctx.strokeStyle = "#00FF9C";
                    ctx.lineWidth = 4;
                } else {
                    ctx.shadowColor = "rgba(56, 189, 248, 0.4)";
                    ctx.shadowBlur = 4;
                    ctx.strokeStyle = "rgba(56, 189, 248, 0.65)";
                    ctx.lineWidth = 2.5;
                }
                ctx.stroke();
                ctx.restore();
            }
        });

        // 3. Concentric Biomechanical Joint Nodes
        const activeJointNames = isLegExercise
            ? ["left_hip", "right_hip", "left_knee", "right_knee", "left_ankle", "right_ankle"]
            : ["left_shoulder", "right_shoulder", "left_elbow", "right_elbow", "left_wrist", "right_wrist"];

        keypoints.forEach((kp) => {
            if ((kp.score ?? 0) < MIN_CONFIDENCE) return;
            const x = mirror(kp.x);
            const y = kp.y;
            const isActiveJoint = activeJointNames.includes(kp.name || "");

            ctx.save();
            if (isActiveJoint) {
                // Pulsing outer halo
                ctx.beginPath();
                ctx.arc(x, y, 9, 0, 2 * Math.PI);
                ctx.strokeStyle = "rgba(0, 255, 156, 0.6)";
                ctx.lineWidth = 1.8;
                ctx.stroke();

                // Inner glowing node
                ctx.beginPath();
                ctx.arc(x, y, 5, 0, 2 * Math.PI);
                ctx.fillStyle = "#00FF9C";
                ctx.shadowColor = "#00FF9C";
                ctx.shadowBlur = 8;
                ctx.fill();

                // White diamond center
                ctx.beginPath();
                ctx.arc(x, y, 2.5, 0, 2 * Math.PI);
                ctx.fillStyle = "#ffffff";
                ctx.fill();
            } else {
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, 2 * Math.PI);
                ctx.fillStyle = "#38bdf8";
                ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
                ctx.lineWidth = 1;
                ctx.fill();
                ctx.stroke();
            }
            ctx.restore();
        });

        return true;
    };

    // ─── Exercise Processing & Biomechanics Math ───────────────────────────
    const processExercise = (
        keypoints: poseDetection.Keypoint[],
        canvasWidth: number
    ) => {
        const currentExercise = selectedExerciseRef.current || selectedExercise;
        if (!currentExercise) return;

        const config = EXERCISES.find((e) => e.id === currentExercise);
        if (!config) return;

        const isMirrored = facingMode === "user";
        const getKp = (name: string) => {
            const kp = keypoints.find((k) => k.name === name);
            if (kp && (kp.score ?? 0) > 0.2) {
                return { x: isMirrored ? canvasWidth - kp.x : kp.x, y: kp.y, score: kp.score ?? 0 };
            }
            return null;
        };

        // Bilateral joint resolution: inspect both left and right sides, select side with clearer visibility
        let a: { x: number; y: number } | null = null;
        let b: { x: number; y: number } | null = null;
        let c: { x: number; y: number } | null = null;

        if (currentExercise === "squat" || currentExercise === "lunge" || currentExercise === "romanianDeadlift") {
            const lHip = getKp("left_hip");
            const lKnee = getKp("left_knee");
            const lAnkle = getKp("left_ankle");

            const rHip = getKp("right_hip");
            const rKnee = getKp("right_knee");
            const rAnkle = getKp("right_ankle");

            const lScore = (lHip?.score || 0) + (lKnee?.score || 0) + (lAnkle?.score || 0);
            const rScore = (rHip?.score || 0) + (rKnee?.score || 0) + (rAnkle?.score || 0);

            if (rScore > lScore && rHip && rKnee) {
                a = rHip;
                b = rKnee;
                c = rAnkle || { x: rKnee.x, y: rKnee.y + 120 };
            } else if (lHip && lKnee) {
                a = lHip;
                b = lKnee;
                c = lAnkle || { x: lKnee.x, y: lKnee.y + 120 };
            }
        } else if (currentExercise === "bicepCurl" || currentExercise === "pushup" || currentExercise === "shoulderPress" || currentExercise === "tricepExtension") {
            const lSho = getKp("left_shoulder");
            const lElb = getKp("left_elbow");
            const lWri = getKp("left_wrist");

            const rSho = getKp("right_shoulder");
            const rElb = getKp("right_elbow");
            const rWri = getKp("right_wrist");

            const lScore = (lSho?.score || 0) + (lElb?.score || 0) + (lWri?.score || 0);
            const rScore = (rSho?.score || 0) + (rElb?.score || 0) + (rWri?.score || 0);

            if (rScore > lScore && rSho && rElb && rWri) {
                a = rSho;
                b = rElb;
                c = rWri;
            } else if (lSho && lElb && lWri) {
                a = lSho;
                b = lElb;
                c = lWri;
            }
        } else {
            const [nameA, nameB, nameC] = config.keypointsUsed;
            a = getKp(nameA);
            b = getKp(nameB);
            c = getKp(nameC);
        }

        if (!a || !b || !c) {
            setRepState((prev) => ({
                ...prev,
                bodyInFrame: false,
                feedback: "Aligning pose... Step back into full view",
                feedbackType: "warning",
            }));
            return;
        }

        const rawAngle = calculateAngle(a, b, c);

        // Exponential Moving Average (EMA) smoothing to eliminate ugly jitter & flickering numbers
        if (smoothedAngleRef.current === 0) {
            smoothedAngleRef.current = rawAngle;
        } else {
            smoothedAngleRef.current = smoothedAngleRef.current * 0.65 + rawAngle * 0.35;
        }
        const angle = Math.round(smoothedAngleRef.current);

        // Calculate Range of Motion (ROM) / Depth percentage
        let depthProgress = 0;
        if (currentExercise === "squat" || currentExercise === "lunge" || currentExercise === "romanianDeadlift") {
            const minA = config.targetAngles.down; // e.g. 90
            const maxA = config.targetAngles.up;   // e.g. 160
            depthProgress = Math.min(100, Math.max(0, Math.round(((maxA - angle) / (maxA - minA)) * 100)));
        } else if (currentExercise === "bicepCurl") {
            depthProgress = Math.min(100, Math.max(0, Math.round(((160 - angle) / (160 - 40)) * 100)));
        } else if (currentExercise === "tricepExtension") {
            depthProgress = Math.min(100, Math.max(0, Math.round(((angle - 50) / (160 - 50)) * 100)));
        } else if (currentExercise === "pushup") {
            depthProgress = Math.min(100, Math.max(0, Math.round(((160 - angle) / (160 - 90)) * 100)));
        } else if (currentExercise === "lateralRaise" || currentExercise === "jumpingJack") {
            depthProgress = Math.min(100, Math.max(0, Math.round(((angle - 20) / (90 - 20)) * 100)));
        } else {
            const span = config.targetAngles.up - config.targetAngles.down;
            depthProgress = span > 0 ? Math.min(100, Math.max(0, Math.round(((config.targetAngles.up - angle) / span) * 100))) : 50;
        }

        const current = repStateRef.current;
        let newPhase = current.phase;
        let newCount = current.count;
        let feedback = "";
        let feedbackType: RepState["feedbackType"] = "info";

        if (currentExercise === "bicepCurl" || currentExercise === "tricepExtension") {
            if (current.phase === "up" && depthProgress >= 80) {
                newPhase = "down";
                feedback = currentExercise === "tricepExtension" ? "Great stretch! Now extend fully" : "Good contraction! Squeeze biceps";
                feedbackType = "good";
            } else if (current.phase === "down" && depthProgress <= 25) {
                const now = Date.now();
                if (now - lastRepTimeRef.current > 650) {
                    lastRepTimeRef.current = now;
                    newPhase = "up";
                    newCount = current.count + 1;
                    feedback = `Rep ${newCount}! Great squeeze! 💪`;
                    feedbackType = "good";
                    playRepChime();
                }
            } else if (current.phase === "down") {
                feedback = currentExercise === "tricepExtension" ? "Extend arms fully overhead" : "Lower with full control";
                feedbackType = "info";
            } else {
                feedback = currentExercise === "tricepExtension" ? "Lower weight behind head" : "Curl up with steady power";
                feedbackType = "info";
            }
        } else if (currentExercise === "lateralRaise" || currentExercise === "jumpingJack") {
            if (current.phase === "down" && depthProgress >= 80) {
                newPhase = "up";
                feedback = currentExercise === "jumpingJack" ? "Arms up! Now back down" : "Shoulder height reached! Lower slow";
                feedbackType = "good";
            } else if (current.phase === "up" && depthProgress <= 25) {
                const now = Date.now();
                if (now - lastRepTimeRef.current > 650) {
                    lastRepTimeRef.current = now;
                    newPhase = "down";
                    newCount = current.count + 1;
                    feedback = `Rep ${newCount}! Keep the rhythm! 🔥`;
                    feedbackType = "good";
                    playRepChime();
                }
            } else if (current.phase === "down") {
                feedback = currentExercise === "jumpingJack" ? "Raise arms overhead" : "Raise arms to shoulder plane";
                feedbackType = "info";
            } else {
                feedback = "Lower with control";
                feedbackType = "info";
            }
        } else {
            // Squats, Pushups, Lunges, Shoulder Press, Romanian Deadlift
            if (current.phase === "up" && depthProgress >= 80) {
                newPhase = "down";
                feedback = currentExercise === "squat" ? "Perfect depth! Drive up strong" : "Great depth! Push up now";
                feedbackType = "good";
            } else if (current.phase === "down" && depthProgress <= 25) {
                const now = Date.now();
                if (now - lastRepTimeRef.current > 650) {
                    lastRepTimeRef.current = now;
                    newPhase = "up";
                    newCount = current.count + 1;
                    feedback = `Rep ${newCount}! Clean form! 🔥`;
                    feedbackType = "good";
                    playRepChime();
                }
            } else if (current.phase === "up" && depthProgress < 40) {
                feedback = currentExercise === "squat" ? "Descend smoothly into squat" : "Lower with control";
                feedbackType = "info";
            } else {
                feedback = depthProgress >= 60 ? "Almost at parallel, sink slightly deeper!" : "Good form, drive through heels!";
                feedbackType = depthProgress >= 60 ? "good" : "info";
            }
        }

        const now = Date.now();
        const shouldUpdateUi =
            newCount !== current.count ||
            newPhase !== current.phase ||
            now - lastUiUpdateRef.current > 75; // Throttle React state re-renders to ~13 FPS for UI, saving 80% CPU while canvas runs at 60 FPS!

        if (shouldUpdateUi) {
            lastUiUpdateRef.current = now;
            setRepState({
                count: newCount,
                phase: newPhase,
                angle,
                depthProgress,
                feedback,
                feedbackType,
                bodyInFrame: true,
            });

            if (newCount > current.count) {
                setSessionStats((prev) => ({
                    ...prev,
                    totalReps: prev.totalReps + 1,
                    bestAngle: Math.min(prev.bestAngle || 999, angle),
                }));
            }
        }
    };

    // ─── High-Performance 60 FPS Pose Detection Loop ───────────────────────────
    const detectPose = useCallback(async () => {
        if (!isCameraOnRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (!video || !canvas || video.readyState < 2) {
            animFrameRef.current = requestAnimationFrame(detectPose);
            return;
        }

        const ctx = canvas.getContext("2d");
        if (!ctx) {
            animFrameRef.current = requestAnimationFrame(detectPose);
            return;
        }

        // Real-time FPS Calculation
        const now = performance.now();
        fpsTrackerRef.current.frames++;
        if (now - fpsTrackerRef.current.lastTime >= 1000) {
            const calculatedFps = Math.min(60, Math.round((fpsTrackerRef.current.frames * 1000) / (now - fpsTrackerRef.current.lastTime)));
            setLiveFps(calculatedFps);
            fpsTrackerRef.current.frames = 0;
            fpsTrackerRef.current.lastTime = now;
        }

        // Sync overlay canvas dimensions with intrinsic video stream
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 480;
        }

        // Clear previous frame's overlay
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const detector = detectorRef.current;
        const activeEx = selectedExerciseRef.current || selectedExercise;

        // Concurrency guard: skip tick if previous frame inference is still executing to prevent queue backpressure
        if (detector && !isInferringRef.current) {
            isInferringRef.current = true;
            try {
                const poses = await detector.estimatePoses(video, { maxPoses: 1, flipHorizontal: false });
                if (poses.length > 0 && poses[0].keypoints) {
                    const keypoints = poses[0].keypoints;
                    const bodyInFrame = drawSkeleton(ctx, keypoints, canvas.width, canvas.height, activeEx);
                    if (bodyInFrame) {
                        processExercise(keypoints, canvas.width);
                    } else if (Date.now() - lastUiUpdateRef.current > 150) {
                        lastUiUpdateRef.current = Date.now();
                        setRepState((prev) => ({
                            ...prev,
                            bodyInFrame: false,
                            feedback: "Step back 2-3 feet to frame full body",
                            feedbackType: "warning",
                        }));
                    }
                } else if (Date.now() - lastUiUpdateRef.current > 200) {
                    lastUiUpdateRef.current = Date.now();
                    setRepState((prev) => ({
                        ...prev,
                        bodyInFrame: false,
                        feedback: "Step into camera view",
                        feedbackType: "info",
                    }));
                }
            } catch (err) {
                // Silently skip transient detection frame error
            } finally {
                isInferringRef.current = false;
            }
        }

        animFrameRef.current = requestAnimationFrame(detectPose);
    }, [facingMode]);

    // ─── Camera Stop ────────────────────────────────────
    const stopCamera = useCallback(() => {
        isCameraOnRef.current = false;
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

    // ─── Camera Start ───────────────────────────────────
    const startCamera = useCallback(async (desiredFacing?: "user" | "environment") => {
        setCameraError(null);
        const mode = desiredFacing || facingMode;

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            const msg = "Camera access is not supported by your browser environment.";
            setCameraError(msg);
            toast.error(msg);
            return;
        }

        try {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((t) => t.stop());
                streamRef.current = null;
            }

            let stream: MediaStream;
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: { ideal: mode },
                        width: { ideal: 1280, max: 1920 },
                        height: { ideal: 720, max: 1080 }
                    },
                    audio: false
                });
            } catch (constraintErr) {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: mode },
                    audio: false
                });
            }

            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;

                await new Promise<void>((resolve) => {
                    if (!videoRef.current) return resolve();
                    if (videoRef.current.readyState >= 2) {
                        resolve();
                    } else {
                        videoRef.current.onloadedmetadata = () => resolve();
                        setTimeout(resolve, 600);
                    }
                });

                try {
                    await videoRef.current.play();
                } catch (playErr) {
                    console.warn("Video play warning:", playErr);
                }
            }

            isCameraOnRef.current = true;
            setIsCameraOn(true);

            let detector = detectorRef.current;
            if (!detector) {
                detector = await loadModel();
            }

            setSessionActive(true);
            setSessionStartTime((prev) => prev || Date.now());
            setRepState({
                count: repStateRef.current.count,
                phase: "up",
                angle: 0,
                depthProgress: 0,
                feedback: "Camera active! Position yourself in frame.",
                feedbackType: "info",
                bodyInFrame: true,
            });

            detectPose();
        } catch (err: unknown) {
            console.error("Camera error:", err);
            const msg =
                err instanceof Error && (err.name === "NotAllowedError" || err.name === "PermissionDeniedError")
                    ? "Camera permission denied. Please allow camera access in your phone/browser settings."
                    : "Could not access camera. Please make sure camera permissions are enabled.";
            setCameraError(msg);
            toast.error(msg);
        }
    }, [facingMode, loadModel, detectPose]);

    const toggleCameraFacing = () => {
        const nextMode = facingMode === "user" ? "environment" : "user";
        setFacingMode(nextMode);
        if (isCameraOn) {
            startCamera(nextMode);
        }
    };

    // Preload AI Pose Model on mount so it is instantly ready
    useEffect(() => {
        loadModel();
    }, [loadModel]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopCamera();
            if (detectorRef.current) {
                try {
                    detectorRef.current.dispose();
                } catch (_) {}
            }
        };
    }, [stopCamera]);

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

    const getMuscleGroupsForExercise = (ex: Exercise): string[] => {
        switch (ex) {
            case "squat": return ["Legs", "Glutes", "Core"];
            case "pushup": return ["Chest", "Triceps", "Shoulders"];
            case "bicepCurl": return ["Biceps", "Forearms"];
            case "lunge": return ["Legs", "Glutes"];
            case "shoulderPress": return ["Shoulders", "Triceps"];
            case "tricepExtension": return ["Triceps"];
            case "lateralRaise": return ["Shoulders"];
            case "romanianDeadlift": return ["Legs", "Glutes", "Back"];
            case "jumpingJack": return ["Full Body", "Cardio"];
            default: return ["Full Body"];
        }
    };

    const handleFinishWorkout = () => {
        stopCamera();

        const activeEx = EXERCISES.find((e) => e.id === selectedExercise);
        const routine = activeEx ? `${activeEx.name.toUpperCase()} SESSION` : "AI WORKOUT";
        const min = Math.floor(sessionStats.duration / 60);
        const sec = sessionStats.duration % 60;
        const durStr = min > 0 ? `${min}M ${sec}S` : `${sec}S`;
        const estKcal = Math.round((sessionStats.duration / 60) * 8 + sessionStats.totalReps * 0.5);

        setPrefilledData({
            routineName: routine,
            duration: durStr || "1M",
            sets: Math.ceil(sessionStats.totalReps / 10) || 1,
            volume: `${sessionStats.totalReps * 15}KG`,
            kcal: estKcal || 20,
            muscleGroups: activeEx ? getMuscleGroupsForExercise(activeEx.id) : ["Full Body"],
            exercises: activeEx ? [{ name: activeEx.name, weight: `${sessionStats.totalReps} Reps` }] : [],
            personalRecordsCount: sessionStats.totalReps > 10 ? 1 : 0
        });

        setIsLogModalOpen(true);
    };

    const saveWorkoutLog = async (workout: WorkoutSummaryData) => {
        const id = (typeof crypto !== 'undefined' && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : Math.random().toString(36).substring(2));
        const newWorkout = { ...workout, id };

        const savedWorkouts = localStorage.getItem("smartfit_completed_workouts_v1");
        let workoutsList = savedWorkouts ? JSON.parse(savedWorkouts) : [];
        workoutsList = [newWorkout, ...workoutsList];
        localStorage.setItem("smartfit_completed_workouts_v1", JSON.stringify(workoutsList));

        toast.success("Workout logged! View it in the Progress page.");


        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase.from("completed_workouts").insert({
                    id,
                    user_id: user.id,
                    routine_name: workout.routineName,
                    date: workout.date,
                    duration: workout.duration,
                    sets: workout.sets,
                    volume: workout.volume,
                    kcal: workout.kcal,
                    muscle_groups: workout.muscleGroups,
                    exercises: workout.exercises,
                    personal_records_count: workout.personalRecordsCount,
                    photo_url: workout.photoUrl
                });
            }
        } catch (e) {
            // ignore table doesn't exist
        }

        navigate("/progress");
    };

    const exerciseConfig = EXERCISES.find((e) => e.id === selectedExercise);

    // ─── Render ─────────────────────────────────────────
    return (
        <div className="min-h-screen py-20">
            <Container className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            aria-label="Back"
                            className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 active:scale-95 transition-transform cursor-pointer shrink-0"
                        >
                            <ArrowLeft className="w-5 h-5 text-white/80" strokeWidth={2.2} />
                        </button>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                                <Eye className="w-5 h-5 text-[#00FF9C]" />
                                Real-Time Form Detection
                            </h1>
                            <p className="text-xs text-white/50">
                                AI-powered camera pose detection & rep counting
                            </p>
                        </div>
                    </div>
                </div>

                {/* Exercise Selector Dropdown */}
                {!sessionActive && (
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-card/80 border border-border p-5 rounded-2xl shadow-xl backdrop-blur-md"
                    >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-3.5">
                                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-inner">
                                    {exerciseConfig?.icon || <Dumbbell className="w-6 h-6" />}
                                </div>
                                <div>
                                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full">
                                        Selected Workout Target
                                    </span>
                                    <h3 className="text-base font-bold text-foreground mt-0.5">
                                        {exerciseConfig?.name}
                                    </h3>
                                    <p className="text-xs text-muted-foreground">
                                        {exerciseConfig?.description}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                <div className="relative min-w-[240px] sm:min-w-[280px]">
                                    <select
                                        value={selectedExercise || "squat"}
                                        onChange={(e) => {
                                            const exId = e.target.value as Exercise;
                                            const ex = EXERCISES.find((item) => item.id === exId);
                                            setSelectedExercise(exId);
                                            setRepState((prev) => ({
                                                ...prev,
                                                feedback: `${ex?.name || "Exercise"} selected. Start camera to track reps!`,
                                                feedbackType: "info",
                                            }));
                                        }}
                                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-semibold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm cursor-pointer pr-10"
                                    >
                                        {EXERCISES.map((ex) => (
                                            <option key={ex.id} value={ex.id} className="bg-background text-foreground py-2">
                                                {ex.name} — {ex.description}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronRight className="w-4 h-4 text-muted-foreground absolute right-3.5 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
                                </div>

                                <Button
                                    onClick={startCamera}
                                    disabled={isModelLoading}
                                    className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xs rounded-xl px-6 py-3 shadow-lg shadow-primary/20"
                                >
                                    <Camera className="w-4 h-4 mr-2" /> Start AI Form Check
                                </Button>

                                {isCameraOn && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setShow3dPiP((prev) => !prev)}
                                        className={`font-bold text-xs rounded-xl px-4 py-3 border transition-all cursor-pointer flex items-center gap-2 ${
                                            show3dPiP
                                                ? "bg-[#00FF9C]/20 border-[#00FF9C] text-[#00FF9C] shadow-[0_0_15px_rgba(0,255,156,0.3)]"
                                                : "border-border bg-card/60 hover:bg-card text-foreground"
                                        }`}
                                    >
                                        <Video className="w-4 h-4 text-[#00FF9C]" />
                                        <span>{show3dPiP ? "Hide Form Guide" : "Form Guide PiP"}</span>
                                    </Button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Main Content */}
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Camera Feed / 3D Trainer Viewport */}
                    <div ref={cameraRef} className="lg:col-span-2">
                        <div className="relative rounded-3xl overflow-hidden bg-neutral-950 border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] w-full min-h-[480px] sm:min-h-[560px] lg:h-[620px]">
                            {/* Live Video Feed (mirrored when selfie camera, normal when rear camera) */}
                            <video
                                ref={videoRef}
                                playsInline
                                muted
                                autoPlay
                                className={`w-full h-full object-cover ${facingMode === "user" ? "transform -scale-x-100" : ""} ${isCameraOn ? "block" : "hidden"}`}
                            />

                            {/* Transparent Canvas Overlay for Biomechanical AI Pose Skeleton & Tracking */}
                            <canvas
                                ref={canvasRef}
                                className={`absolute inset-0 w-full h-full object-cover pointer-events-none ${isCameraOn ? "block" : "hidden"}`}
                            />

                            {/* AI Vision Standby View when camera is off */}
                            {!isCameraOn && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#0e1310] via-[#090D0B] to-[#060807] overflow-hidden p-6 text-center select-none">
                                    {isModelLoading ? (
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-12 h-12 rounded-full border-3 border-[#00FF9C] border-t-transparent animate-spin" />
                                            <p className="text-xs text-muted-foreground font-semibold">Loading AI Pose Detection Engine...</p>
                                        </div>
                                    ) : cameraError ? (
                                        <div className="flex flex-col items-center gap-3 p-6 text-center">
                                            <AlertTriangle className="w-10 h-10 text-yellow-500" />
                                            <p className="text-xs text-muted-foreground max-w-sm">{cameraError}</p>
                                            <Button onClick={() => startCamera()} variant="outline" className="text-xs">
                                                Try Camera Again
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="relative z-10 max-w-md mx-auto flex flex-col items-center">
                                            {/* Glowing Viewfinder Target Icon */}
                                            <div className="relative mb-4 group cursor-pointer" onClick={() => startCamera()}>
                                                <div className="absolute -inset-2 bg-[#00FF9C]/20 rounded-full blur-xl group-hover:bg-[#00FF9C]/30 transition-all animate-pulse" />
                                                <div className="relative w-20 h-20 rounded-2xl bg-[#141A16] border border-[#00FF9C]/40 flex items-center justify-center shadow-[0_0_30px_rgba(0,255,156,0.2)] group-hover:scale-105 transition-transform">
                                                    <Camera className="w-9 h-9 text-[#00FF9C]" strokeWidth={1.8} />
                                                    {/* Corner brackets */}
                                                    <span className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-[#00FF9C]" />
                                                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-[#00FF9C]" />
                                                    <span className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-[#00FF9C]" />
                                                    <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-[#00FF9C]" />
                                                </div>
                                            </div>

                                            {/* Badge */}
                                            <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#00FF9C]/10 text-[#00FF9C] border border-[#00FF9C]/30 mb-2.5 flex items-center gap-1.5 shadow-xs">
                                                <span className="w-1.5 h-1.5 rounded-full bg-[#00FF9C] animate-ping" />
                                                AI Vision Pose Tracker
                                            </span>

                                            {/* Title & Info */}
                                            <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight mb-1.5">
                                                Ready to Track {EXERCISES.find((e) => e.id === selectedExercise)?.name || "Reps"}
                                            </h3>
                                            <p className="text-xs text-white/70 leading-relaxed mb-4 max-w-sm">
                                                Position your device 3–6 feet away so your full body is visible. The camera AI will detect joint angles and count every valid rep automatically.
                                            </p>

                                            {/* Feature Pills */}
                                            <div className="flex flex-wrap items-center justify-center gap-1.5 mb-5">
                                                <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-semibold text-white/80">
                                                    ⚡ Auto Rep Counting
                                                </span>
                                                <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-semibold text-white/80">
                                                    🎯 Real-time Posture AI
                                                </span>
                                                <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-semibold text-white/80">
                                                    🔊 Voice Tempo Cues
                                                </span>
                                            </div>

                                            {/* Launch Camera Button */}
                                            <Button
                                                type="button"
                                                onClick={() => startCamera()}
                                                className="w-full sm:w-auto px-7 py-3 h-auto rounded-xl bg-[#00FF9C] hover:bg-[#00e58a] text-black font-extrabold text-xs sm:text-sm shadow-[0_0_25px_rgba(0,255,156,0.35)] active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
                                            >
                                                <Camera className="w-4 h-4 text-black" />
                                                <span>Start Camera Reps</span>
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Floating Picture-in-Picture (PiP) Window when Camera is ON */}
                            {isCameraOn && show3dPiP && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                    className="absolute bottom-16 right-3 sm:right-4 z-30 w-44 sm:w-52 md:w-60 rounded-2xl overflow-hidden border border-[#00FF9C]/40 bg-black/95 shadow-2xl backdrop-blur-md"
                                >
                                    <div className="px-2.5 py-1.5 bg-[#121614] border-b border-white/10 flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-[#00FF9C] flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#00FF9C] animate-pulse" />
                                            3D Form Guide
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setShow3dPiP(false)}
                                            className="text-white/60 hover:text-white text-xs cursor-pointer p-0.5"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                    <div className="relative aspect-video bg-black">
                                        <video
                                            key={selectedExercise || "squat"}
                                            src={EXERCISE_3D_VIDEOS[selectedExercise || "squat"]?.videoFile || "/squat.mp4"}
                                            autoPlay
                                            loop
                                            muted
                                            playsInline
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="px-2 py-1 bg-black/80 text-[10px] text-white/70 text-center font-medium">
                                        {EXERCISE_3D_VIDEOS[selectedExercise || "squat"]?.name || "Squats"}
                                    </div>
                                </motion.div>
                            )}

                            {/* Ultra-Sleek Real-Time Form HUD Overlay */}
                            {isCameraOn && (
                                <>
                                    {/* Top Glass Navigation & Status Bar */}
                                    <div className="absolute top-3 inset-x-3 z-20 flex items-center justify-between gap-2 pointer-events-none">
                                        {/* Live Exercise Pill */}
                                        <div className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/65 backdrop-blur-md border border-white/10 text-white shadow-lg">
                                            <span className="w-2 h-2 rounded-full bg-[#00FF9C] animate-pulse" />
                                            <span className="text-xs font-black uppercase tracking-wide text-white">
                                                {exerciseConfig?.name || "Exercise"}
                                            </span>
                                            <span className="text-[10px] text-[#00FF9C] bg-[#00FF9C]/15 border border-[#00FF9C]/30 px-2 py-0.5 rounded-full font-mono font-extrabold">
                                                {liveFps} FPS
                                            </span>
                                            <span className="hidden sm:inline text-[10px] text-white/50 border-l border-white/15 pl-2 font-mono">
                                                Goal: {exerciseConfig?.targetAngles.down}°
                                            </span>
                                        </div>

                                        {/* Out of Frame Alert Pill */}
                                        {!repState.bodyInFrame && (
                                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 backdrop-blur-md border border-amber-500/40 text-amber-300 text-xs font-semibold animate-pulse shadow-lg">
                                                <AlertTriangle className="w-3.5 h-3.5" />
                                                <span className="hidden sm:inline">Step back to frame body</span>
                                                <span className="sm:hidden">Step back</span>
                                            </div>
                                        )}

                                        {/* Action Tools */}
                                        <div className="pointer-events-auto flex items-center gap-1.5">
                                            {/* Audio Toggle */}
                                            <button
                                                type="button"
                                                onClick={() => setIsSoundMuted(!isSoundMuted)}
                                                className="p-2 rounded-full bg-black/65 hover:bg-black/90 backdrop-blur-md border border-white/10 text-white/80 hover:text-white transition-all cursor-pointer shadow-md"
                                                title={isSoundMuted ? "Unmute audio chimes" : "Mute audio chimes"}
                                            >
                                                {isSoundMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-[#00FF9C]" />}
                                            </button>

                                            {/* Flip Camera */}
                                            <button
                                                type="button"
                                                onClick={toggleCameraFacing}
                                                className="p-2 rounded-full bg-black/65 hover:bg-black/90 backdrop-blur-md border border-white/10 text-white/80 hover:text-white transition-all cursor-pointer shadow-md"
                                                title="Switch front / rear camera"
                                            >
                                                <RotateCcw className="w-4 h-4 text-sky-400" />
                                            </button>

                                            {/* Form Guide PiP */}
                                            <button
                                                type="button"
                                                onClick={() => setShow3dPiP(!show3dPiP)}
                                                className={`px-2.5 py-1.5 rounded-full backdrop-blur-md border text-xs font-bold transition-all cursor-pointer shadow-md flex items-center gap-1.5 ${
                                                    show3dPiP
                                                        ? "bg-[#00FF9C]/20 border-[#00FF9C] text-[#00FF9C]"
                                                        : "bg-black/65 hover:bg-black/90 border-white/10 text-white/80"
                                                }`}
                                            >
                                                <Video className="w-3.5 h-3.5 text-[#00FF9C]" />
                                                <span className="hidden sm:inline">3D Guide</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Left: Athletic Rep Counter Card */}
                                    <div className="absolute top-16 left-3 sm:left-4 z-10 flex flex-col items-start gap-2">
                                        <div className="rounded-2xl bg-black/70 backdrop-blur-xl border border-white/15 p-3.5 sm:p-4 shadow-2xl text-left min-w-[100px] sm:min-w-[125px]">
                                            <div className="flex items-center justify-between gap-2 mb-0.5">
                                                <span className="text-[10px] font-extrabold uppercase tracking-widest text-white/60">
                                                    Reps
                                                </span>
                                                <Flame className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
                                            </div>
                                            <div className="text-4xl sm:text-5xl font-black text-[#00FF9C] tracking-tight tabular-nums drop-shadow-[0_0_15px_rgba(0,255,156,0.4)]">
                                                {repState.count}
                                            </div>
                                            <div className="mt-1 flex items-center gap-1">
                                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                                    repState.phase === "down"
                                                        ? "bg-orange-500/20 text-orange-400 border border-orange-500/40"
                                                        : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                                                }`}>
                                                    {repState.phase === "down" ? "LOWERING" : "DRIVE UP"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Range of Motion & Live Depth Meter */}
                                    <div className="absolute top-16 right-3 sm:right-4 z-10 flex flex-col items-center">
                                        <div className="rounded-2xl bg-black/70 backdrop-blur-xl border border-white/15 p-3 sm:p-4 shadow-2xl flex flex-col items-center min-w-[85px] sm:min-w-[100px]">
                                            <span className="text-[10px] font-extrabold uppercase tracking-widest text-white/60 mb-1">
                                                Angle
                                            </span>
                                            <span className="text-2xl sm:text-3xl font-black text-white tabular-nums tracking-tight font-mono">
                                                {repState.angle}°
                                            </span>

                                            {/* Live Vertical Depth Gauge */}
                                            <div className="w-3.5 h-24 sm:h-28 bg-white/10 rounded-full mt-2.5 relative overflow-hidden p-0.5 flex flex-col justify-end">
                                                {/* Target line indicator */}
                                                <div className="absolute top-[20%] inset-x-0 h-0.5 bg-yellow-400 z-10 opacity-75" title="Target Zone" />
                                                
                                                {/* Filling depth liquid bar */}
                                                <div
                                                    className={`w-full rounded-full transition-all duration-75 ${
                                                        repState.depthProgress >= 80
                                                            ? "bg-gradient-to-t from-emerald-500 to-[#00FF9C] shadow-[0_0_12px_#00FF9C]"
                                                            : "bg-gradient-to-t from-sky-500 to-sky-300"
                                                    }`}
                                                    style={{ height: `${repState.depthProgress}%` }}
                                                />
                                            </div>

                                            <span className={`text-[10px] font-extrabold uppercase mt-2 tracking-wider ${
                                                repState.depthProgress >= 80 ? "text-[#00FF9C]" : "text-white/60"
                                            }`}>
                                                {repState.depthProgress >= 80 ? "PERFECT" : `${repState.depthProgress}%`}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Bottom Floating Coaching Pill */}
                                    <div className="absolute bottom-4 inset-x-4 sm:inset-x-8 z-10 flex justify-center pointer-events-none">
                                        <div className={`px-4 sm:px-6 py-2.5 rounded-2xl backdrop-blur-xl border shadow-2xl text-center max-w-md w-full transition-all duration-200 flex items-center justify-center gap-2.5 ${
                                            repState.feedbackType === "good"
                                                ? "bg-emerald-950/85 border-emerald-500/50 text-emerald-300 shadow-[0_0_25px_rgba(0,255,156,0.25)]"
                                                : repState.feedbackType === "warning"
                                                    ? "bg-amber-950/85 border-amber-500/50 text-amber-300"
                                                    : "bg-black/80 border-white/15 text-white/90"
                                        }`}>
                                            {repState.feedbackType === "good" ? (
                                                <CheckCircle2 className="w-4 h-4 text-[#00FF9C] shrink-0" />
                                            ) : repState.feedbackType === "warning" ? (
                                                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                                            ) : (
                                                <Sparkles className="w-4 h-4 text-sky-400 shrink-0" />
                                            )}
                                            <p className="text-xs sm:text-sm font-bold tracking-wide truncate">
                                                {repState.feedback}
                                            </p>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Camera controls */}
                        <div className="flex gap-3 mt-4">
                            {!isCameraOn ? (
                                <div className="flex flex-col sm:flex-row gap-3 w-full">
                                    <Button
                                        variant="hero"
                                        size="lg"
                                        className="flex-1"
                                        onClick={startCamera}
                                    >
                                        <Camera className="mr-2 h-5 w-5" />
                                        {isModelLoading ? "Starting Camera (Initializing AI)..." : "Start Camera"}
                                    </Button>
                                    {(sessionStats.duration > 0 || sessionStats.totalReps > 0) && (
                                        <Button
                                            variant="outline"
                                            size="lg"
                                            className="flex-1 border-primary/30 text-primary hover:bg-primary/10"
                                            onClick={handleFinishWorkout}
                                        >
                                            <Sparkles className="mr-2 h-5 w-5 text-primary animate-pulse" />
                                            Complete & Share Workout
                                        </Button>
                                    )}
                                </div>
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
                                    <Button
                                        variant="hero"
                                        size="lg"
                                        className="flex-1"
                                        onClick={handleFinishWorkout}
                                    >
                                        <Sparkles className="mr-2 h-5 w-5" />
                                        Complete Workout
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

            <WorkoutSummaryLogModal
                isOpen={isLogModalOpen}
                onClose={() => setIsLogModalOpen(false)}
                onSave={saveWorkoutLog}
                initialData={prefilledData}
            />
        </div>
    );
};

export default WorkoutSession;
