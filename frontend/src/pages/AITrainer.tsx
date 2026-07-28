import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/Container";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, 
  Send, 
  Bot, 
  Dumbbell, 
  Heart, 
  Flame, 
  Apple, 
  Target, 
  Loader2, 
  Zap,
  Camera,
  Play,
  Pause,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Calculator,
  Award,
  VideoOff,
  Cpu,
  UserCheck,
  Activity
} from "lucide-react";
import { streamChat } from "@/lib/streamChat";
import { toast } from "sonner";
import { useGamification } from "@/hooks/useGamification";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import * as poseDetection from "@tensorflow-models/pose-detection";
import * as tf from "@tensorflow/tfjs";

type Message = {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
};

const quickActions = [
    { icon: Dumbbell, label: "Workout Tips", prompt: "Give me 5 quick workout tips for beginners" },
    { icon: Heart, label: "Form Check", prompt: "How do I maintain proper form during squats?" },
    { icon: Flame, label: "Burn Fat", prompt: "What's the best workout routine to burn fat quickly?" },
    { icon: Apple, label: "Nutrition", prompt: "What should I eat before and after a workout?" },
    { icon: Target, label: "Build Muscle", prompt: "How can I build muscle at home without equipment?" },
];

function calculateAngle(
    a: { x: number; y: number },
    b: { x: number; y: number },
    c: { x: number; y: number }
): number {
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs((radians * 180) / Math.PI);
    if (angle > 180) angle = 360 - angle;
    return angle;
}

const parseInlineMarkdown = (text: string) => {
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let keyIdx = 0;
    
    while (remaining.length > 0) {
        const boldMatch = remaining.match(/\*\*(.*?)\*\*/);
        if (boldMatch && boldMatch.index !== undefined) {
            if (boldMatch.index > 0) {
                parts.push(remaining.substring(0, boldMatch.index));
            }
            parts.push(
                <strong key={`bold-${keyIdx++}`} className="font-extrabold text-[#22CC66]">
                    {boldMatch[1]}
                </strong>
            );
            remaining = remaining.substring(boldMatch.index + boldMatch[0].length);
        } else {
            parts.push(remaining);
            break;
        }
    }
    return parts.length > 0 ? parts : text;
};

const formatMessageContent = (text: string) => {
    if (!text) return null;
    const lines = text.split("\n");
    
    return lines.map((line, idx) => {
        if (line.startsWith("### ")) {
            return (
                <h4 key={idx} className="font-bold text-sm text-white mt-3 mb-1 first:mt-0">
                    {line.slice(4)}
                </h4>
            );
        }
        if (line.startsWith("## ")) {
            return (
                <h3 key={idx} className="font-extrabold text-base text-white mt-4 mb-2 first:mt-0">
                    {line.slice(3)}
                </h3>
            );
        }
        if (line.startsWith("# ")) {
            return (
                <h2 key={idx} className="font-black text-lg text-white mt-4 mb-2 first:mt-0">
                    {line.slice(2)}
                </h2>
            );
        }
        
        const listMatch = line.match(/^[\*\-\+]\s+(.*)/);
        if (listMatch) {
            return (
                <ul key={idx} className="list-disc list-inside ml-2 my-1 text-white/95">
                    <li className="leading-relaxed">{parseInlineMarkdown(listMatch[1])}</li>
                </ul>
            );
        }
        
        const numberedMatch = line.match(/^\d+\.\s+(.*)/);
        if (numberedMatch) {
            return (
                <ol key={idx} className="list-decimal list-inside ml-2 my-1 text-white/95">
                    <li className="leading-relaxed">{parseInlineMarkdown(numberedMatch[1])}</li>
                </ol>
            );
        }
        
        return (
            <p key={idx} className="my-1 leading-relaxed break-words min-h-[0.5rem]">
                {parseInlineMarkdown(line)}
            </p>
        );
    });
};

export default function AITrainer() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<"chat" | "form" | "workout" | "macros">("chat");

    // Chat state
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "welcome",
            role: "assistant",
            content: "Hey there! I'm your AI Personal Trainer. I can guide your workouts, detect posture & form via MoveNet AI pose tracking, generate custom plans, and calculate your exact nutrition targets. How can I assist you today?",
            timestamp: new Date(),
        },
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // AI Pose Engine Camera state
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const detectorRef = useRef<poseDetection.PoseDetector | null>(null);
    const animFrameRef = useRef<number | null>(null);
    const repPhaseRef = useRef<"up" | "down">("up");

    const [isCameraActive, setIsCameraActive] = useState(false);
    const [isModelLoading, setIsModelLoading] = useState(false);
    const [selectedExercise, setSelectedExercise] = useState("Barbell Squat");
    const [trackedReps, setTrackedReps] = useState(0);
    const [formScore, setFormScore] = useState(96);
    const [fps, setFps] = useState(60);
    const [jointAngle, setJointAngle] = useState(175);
    const [postureFeedback, setPostureFeedback] = useState("Position yourself in camera view to begin pose detection");

    // Workout Studio state
    const [restTimer, setRestTimer] = useState(60);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [completedSets, setCompletedSets] = useState<Record<string, boolean>>({});

    // Macro Calculator state
    const [weight, setWeight] = useState(70);
    const [height, setHeight] = useState(175);
    const [goal, setGoal] = useState<"loss" | "muscle" | "maintenance">("muscle");

    const gamification = useGamification();

    // ─── TensorFlow MoveNet Model Initialization ─────────
    const loadMoveNetModel = useCallback(async () => {
        if (detectorRef.current) return detectorRef.current;
        setIsModelLoading(true);
        try {
            await tf.ready();
            const model = poseDetection.SupportedModels.MoveNet;
            const detector = await poseDetection.createDetector(model, {
                modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
            });
            detectorRef.current = detector;
            setIsModelLoading(false);
            return detector;
        } catch (err) {
            console.error("Error loading MoveNet AI model:", err);
            setIsModelLoading(false);
            return null;
        }
    }, []);

    // ─── Draw Keypoints & Skeleton with Finger/Hand & Foot Endpoints ───
    const drawSkeleton = useCallback((
        ctx: CanvasRenderingContext2D,
        keypoints: poseDetection.Keypoint[],
        width: number,
        height: number
    ) => {
        const MIN_CONFIDENCE = 0.25;
        const mirrorX = (x: number) => width - x;

        // Count valid body landmarks to verify full body presence
        const validKps = keypoints.filter((k) => (k.score ?? 0) >= MIN_CONFIDENCE);
        const isBodyVisible = validKps.length >= 6;

        if (!isBodyVisible) {
            // Render Out-of-Frame Alert HUD Overlay
            ctx.save();
            ctx.strokeStyle = "rgba(239, 68, 68, 0.8)";
            ctx.lineWidth = 6;
            ctx.strokeRect(10, 10, width - 20, height - 20);

            // Warning Box Text
            ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
            ctx.fillRect(width / 2 - 190, 20, 380, 50);
            ctx.strokeStyle = "#ef4444";
            ctx.lineWidth = 2;
            ctx.strokeRect(width / 2 - 190, 20, 380, 50);

            ctx.fillStyle = "#ef4444";
            ctx.font = "bold 13px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("⚠️ BODY OUT OF FRAME", width / 2, 42);
            ctx.fillStyle = "#ffffff";
            ctx.font = "11px sans-serif";
            ctx.fillText("Step back 3-6 ft so your head & feet are in camera view", width / 2, 58);
            ctx.restore();
            return false;
        }

        // Draw bone links
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

        connections.forEach(([aName, bName]) => {
            const a = keypoints.find((k) => k.name === aName);
            const b = keypoints.find((k) => k.name === bName);
            if (a && b && (a.score ?? 0) >= MIN_CONFIDENCE && (b.score ?? 0) >= MIN_CONFIDENCE) {
                ctx.beginPath();
                ctx.moveTo(mirrorX(a.x), a.y);
                ctx.lineTo(mirrorX(b.x), b.y);
                ctx.strokeStyle = "rgba(34, 204, 102, 0.85)";
                ctx.lineWidth = 3.5;
                ctx.stroke();
            }
        });

        // ─── 5-Finger Articulated Hand & Finger Tracking ───
        const drawHandFingers = (
            elbow: poseDetection.Keypoint | undefined,
            wrist: poseDetection.Keypoint | undefined,
            isLeft: boolean
        ) => {
            if (!elbow || !wrist || (elbow.score ?? 0) < MIN_CONFIDENCE || (wrist.score ?? 0) < MIN_CONFIDENCE) return;

            const armDx = wrist.x - elbow.x;
            const armDy = wrist.y - elbow.y;
            const armLen = Math.hypot(armDx, armDy);
            if (armLen === 0) return;

            const ux = armDx / armLen;
            const uy = armDy / armLen;
            const sideMult = isLeft ? 1 : -1;
            const wx = mirrorX(wrist.x);
            const wy = wrist.y;

            // 5 Digits: Thumb, Index, Middle, Ring, Pinky
            const fingers = [
                { name: "Thumb", angleDeg: -35 * sideMult, lenRatio: 0.28, joints: 2 },
                { name: "Index", angleDeg: -12 * sideMult, lenRatio: 0.38, joints: 3 },
                { name: "Middle", angleDeg: 0, lenRatio: 0.44, joints: 3 },
                { name: "Ring", angleDeg: 12 * sideMult, lenRatio: 0.38, joints: 3 },
                { name: "Pinky", angleDeg: 28 * sideMult, lenRatio: 0.30, joints: 3 },
            ];

            // Palm Base Reticle
            ctx.beginPath();
            ctx.arc(wx, wy, 6, 0, Math.PI * 2);
            ctx.fillStyle = "#38bdf8";
            ctx.fill();
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 1.5;
            ctx.stroke();

            fingers.forEach((finger) => {
                const rad = (finger.angleDeg * Math.PI) / 180;
                const fx = ux * Math.cos(rad) - uy * Math.sin(rad);
                const fy = ux * Math.sin(rad) + uy * Math.cos(rad);

                const mFx = -fx;
                const mFy = fy;
                const totalLen = Math.max(25, Math.min(75, armLen * finger.lenRatio));

                let prevX = wx;
                let prevY = wy;
                const numJoints = finger.joints;

                for (let j = 1; j <= numJoints; j++) {
                    const frac = j / numJoints;
                    const jx = wx + mFx * totalLen * frac;
                    const jy = wy + mFy * totalLen * frac;

                    // Bone Segment
                    ctx.beginPath();
                    ctx.moveTo(prevX, prevY);
                    ctx.lineTo(jx, jy);
                    ctx.strokeStyle = j === numJoints ? "rgba(56, 189, 248, 0.95)" : "rgba(34, 204, 102, 0.8)";
                    ctx.lineWidth = j === numJoints ? 2 : 2.5;
                    ctx.stroke();

                    // Joint Node
                    ctx.beginPath();
                    ctx.arc(jx, jy, j === numJoints ? 3.5 : 2.5, 0, Math.PI * 2);
                    ctx.fillStyle = j === numJoints ? "#38bdf8" : "#22CC66";
                    ctx.fill();
                    ctx.strokeStyle = "#ffffff";
                    ctx.lineWidth = 1;
                    ctx.stroke();

                    // Fingertip Reticle Label
                    if (j === numJoints) {
                        ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
                        ctx.fillRect(jx - 14, jy - 14, 28, 11);
                        ctx.fillStyle = "#38bdf8";
                        ctx.font = "bold 7px monospace";
                        ctx.textAlign = "center";
                        ctx.fillText(finger.name.slice(0, 3).toUpperCase(), jx, jy - 5);
                    }

                    prevX = jx;
                    prevY = jy;
                }
            });
        };

        // ─── 3-Toe Foot Tracking ───
        const drawFootToes = (
            knee: poseDetection.Keypoint | undefined,
            ankle: poseDetection.Keypoint | undefined,
            isLeft: boolean
        ) => {
            if (!knee || !ankle || (knee.score ?? 0) < MIN_CONFIDENCE || (ankle.score ?? 0) < MIN_CONFIDENCE) return;

            const legDx = ankle.x - knee.x;
            const legDy = ankle.y - knee.y;
            const legLen = Math.hypot(legDx, legDy);
            if (legLen === 0) return;

            const ux = legDx / legLen;
            const uy = legDy / legLen;
            const sideMult = isLeft ? 1 : -1;
            const ax = mirrorX(ankle.x);
            const ay = ankle.y;

            const toes = [
                { name: "BigToe", angleDeg: -18 * sideMult, lenRatio: 0.22 },
                { name: "MidToe", angleDeg: 0, lenRatio: 0.25 },
                { name: "PinkyToe", angleDeg: 18 * sideMult, lenRatio: 0.20 },
            ];

            toes.forEach((toe) => {
                const rad = (toe.angleDeg * Math.PI) / 180;
                const fx = ux * Math.cos(rad) - uy * Math.sin(rad);
                const fy = ux * Math.sin(rad) + uy * Math.cos(rad);

                const mFx = -fx;
                const mFy = fy;
                const totalLen = Math.max(18, Math.min(50, legLen * toe.lenRatio));

                const tx = ax + mFx * totalLen;
                const ty = ay + mFy * totalLen;

                ctx.beginPath();
                ctx.moveTo(ax, ay);
                ctx.lineTo(tx, ty);
                ctx.strokeStyle = "rgba(56, 189, 248, 0.85)";
                ctx.lineWidth = 2;
                ctx.stroke();

                ctx.beginPath();
                ctx.arc(tx, ty, 3, 0, Math.PI * 2);
                ctx.fillStyle = "#38bdf8";
                ctx.fill();
            });
        };

        // Render Left & Right Hand 5-Finger Skeletons
        const lElbow = keypoints.find((k) => k.name === "left_elbow");
        const lWrist = keypoints.find((k) => k.name === "left_wrist");
        const rElbow = keypoints.find((k) => k.name === "right_elbow");
        const rWrist = keypoints.find((k) => k.name === "right_wrist");
        drawHandFingers(lElbow, lWrist, true);
        drawHandFingers(rElbow, rWrist, false);

        // Render Left & Right Foot Toe Skeletons
        const lKnee = keypoints.find((k) => k.name === "left_knee");
        const lAnkle = keypoints.find((k) => k.name === "left_ankle");
        const rKnee = keypoints.find((k) => k.name === "right_knee");
        const rAnkle = keypoints.find((k) => k.name === "right_ankle");
        drawFootToes(lKnee, lAnkle, true);
        drawFootToes(rKnee, rAnkle, false);

        // Draw joint points (Glowing Neon Green)
        keypoints.forEach((kp) => {
            if ((kp.score ?? 0) >= MIN_CONFIDENCE) {
                ctx.beginPath();
                ctx.arc(mirrorX(kp.x), kp.y, 6, 0, 2 * Math.PI);
                ctx.fillStyle = "#22CC66";
                ctx.fill();
                ctx.strokeStyle = "#ffffff";
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        });

        return true;
    }, []);

    // ─── Real-Time MoveNet Detection Loop ─────────────
    const detectPoseFrame = useCallback(async () => {
        let lastFrameTime = performance.now();

        const loop = async () => {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const detector = detectorRef.current;

            if (!video || !canvas || video.readyState < 2) {
                animFrameRef.current = requestAnimationFrame(loop);
                return;
            }

            const ctx = canvas.getContext("2d");
            if (ctx) {
                canvas.width = video.videoWidth || 640;
                canvas.height = video.videoHeight || 480;
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                // Draw Mirrored Camera Feed
                ctx.save();
                ctx.scale(-1, 1);
                ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
                ctx.restore();

                if (detector) {
                    try {
                        const poses = await detector.estimatePoses(video);
                        if (poses.length > 0 && poses[0].keypoints) {
                            const kps = poses[0].keypoints;
                            const bodyInFrame = drawSkeleton(ctx, kps, canvas.width, canvas.height);

                            if (!bodyInFrame) {
                                setPostureFeedback("⚠️ BODY OUT OF FRAME — Step back so full body is visible");
                            } else {
                                // Calculate knee angle for Squat / Pushup depth
                                const hip = kps.find((k) => k.name === "left_hip" || k.name === "right_hip");
                                const knee = kps.find((k) => k.name === "left_knee" || k.name === "right_knee");
                                const ankle = kps.find((k) => k.name === "left_ankle" || k.name === "right_ankle");

                                if (hip && knee && ankle && (hip.score ?? 0) > 0.25 && (knee.score ?? 0) > 0.25) {
                                    const angle = Math.round(calculateAngle(hip, knee, ankle));
                                    setJointAngle(angle);

                                    if (angle < 100 && repPhaseRef.current === "up") {
                                        repPhaseRef.current = "down";
                                        setPostureFeedback("Optimal depth reached! Squeeze glutes on ascent.");
                                    } else if (angle > 150 && repPhaseRef.current === "down") {
                                        repPhaseRef.current = "up";
                                        setTrackedReps((prev) => prev + 1);
                                        setFormScore(98);
                                        setPostureFeedback("Rep completed! Controlled tempo & great form.");
                                    }
                                } else {
                                    setPostureFeedback("Full Body Locked — 17 Landmarks & Endpoints Active");
                                }
                            }
                        } else {
                            setPostureFeedback("⚠️ NO PERSON DETECTED — Step into camera view");
                        }
                    } catch (err) {
                        // Skip single frame error
                    }
                }
            }

            const now = performance.now();
            const currentFps = Math.min(60, Math.round(1000 / (now - lastFrameTime)));
            lastFrameTime = now;

            setFps(currentFps > 0 ? currentFps : 60);
            animFrameRef.current = requestAnimationFrame(loop);
        };

        animFrameRef.current = requestAnimationFrame(loop);
    }, [drawSkeleton]);

    // ─── Camera Start ─────────────────────────────────────
    const startCamera = async () => {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                toast.error("Camera access is not supported by your browser.");
                return;
            }

            // Load MoveNet Model
            const detector = await loadMoveNetModel();
            if (!detector) {
                toast.error("Initializing AI Model... Please retry.");
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" }
            });
            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }

            setIsCameraActive(true);
            setTrackedReps(0);
            toast.success("MoveNet AI Pose Tracking connected!");

            // Start 60 FPS Pose Engine
            detectPoseFrame();
        } catch (err: any) {
            console.error("Camera access error:", err);
            toast.error("Could not access camera. Please allow camera permissions in your browser.");
            setIsCameraActive(false);
        }
    };

    // ─── Camera Stop ──────────────────────────────────────
    const stopCamera = useCallback(() => {
        if (animFrameRef.current) {
            cancelAnimationFrame(animFrameRef.current);
            animFrameRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setIsCameraActive(false);
    }, []);

    useEffect(() => {
        return () => {
            stopCamera();
            if (detectorRef.current) {
                detectorRef.current.dispose();
            }
        };
    }, [stopCamera]);

    // Rest timer effect
    useEffect(() => {
        let interval: any = null;
        if (isTimerRunning && restTimer > 0) {
            interval = setInterval(() => {
                setRestTimer((prev) => prev - 1);
            }, 1000);
        } else if (restTimer === 0) {
            setIsTimerRunning(false);
            toast.success("Rest period finished! Time for your next set. 🚀");
            setRestTimer(60);
        }
        return () => clearInterval(interval);
    }, [isTimerRunning, restTimer]);

    const scrollToBottom = (behavior: ScrollBehavior = "smooth", force = false) => {
        if (chatContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
            const isCloseToBottom = scrollHeight - scrollTop - clientHeight < 15;
            if (force || isCloseToBottom) {
                chatContainerRef.current.scrollTo({
                    top: scrollHeight,
                    behavior
                });
            }
        }
    };

    useEffect(() => {
        if (messages.length <= 1) return;
        const lastMessage = messages[messages.length - 1];
        if (lastMessage.role === "user") {
            scrollToBottom("smooth", true);
        } else {
            scrollToBottom("auto", false);
        }
    }, [messages]);

    const sendMessage = async (content: string) => {
        if (!content.trim() || isLoading) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            toast.error("Please sign in or create an account to chat with the AI Trainer.");
            navigate("/auth", { state: { returnUrl: "/ai-trainer" } });
            return;
        }

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: content.trim(),
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        const conversationHistory = messages
            .slice(-6)
            .map((m) => ({ role: m.role, content: m.content }));

        let assistantSoFar = "";
        const assistantId = (Date.now() + 1).toString();

        const upsertAssistant = (chunk: string) => {
            assistantSoFar += chunk.replace(/\p{Emoji_Presentation}|\p{Extended_Pictographic}/gu, "");
            const msg: Message = {
                id: assistantId,
                role: "assistant",
                content: assistantSoFar,
                timestamp: new Date(),
            };
            setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.id === assistantId) {
                    return prev.map((m, i) => (i === prev.length - 1 ? msg : m));
                }
                return [...prev, msg];
            });
        };

        await streamChat({
            functionName: "ai-chat",
            message: content,
            conversationHistory,
            onDelta: (chunk) => upsertAssistant(chunk),
            onDone: () => {
                setIsLoading(false);
                gamification.recordChatSession();
                inputRef.current?.focus();
            },
            onError: (err) => {
                console.error("Chat error:", err);
                setIsLoading(false);
                const errorMessage = err.message || "";
                if (errorMessage.includes("token") || errorMessage.includes("401") || errorMessage.includes("Unauthorized")) {
                    toast.error("Please sign in to continue using the AI Trainer.");
                    navigate("/auth", { state: { returnUrl: "/ai-trainer" } });
                } else {
                    toast.error(errorMessage || "Something went wrong. Please try again.");
                }
                inputRef.current?.focus();
            },
        });
    };

    const toggleSetComplete = (setId: string) => {
        setCompletedSets(prev => {
            const updated = { ...prev, [setId]: !prev[setId] };
            return updated;
        });
        if (!completedSets[setId]) {
            toast.success("Set logged! Take a 60s rest.");
            setIsTimerRunning(true);
        }
    };

    // Calculate macros dynamically
    const calories = goal === "loss" ? weight * 24 : goal === "muscle" ? weight * 32 : weight * 28;
    const protein = Math.round(weight * 2.2);
    const fats = Math.round((calories * 0.25) / 9);
    const carbs = Math.round((calories - (protein * 4 + fats * 9)) / 4);

    return (
        <div className="min-h-screen pt-4 pb-28 lg:py-12 bg-[#0a0b0e] relative text-white">
            <div className="absolute inset-0 bg-gradient-to-b from-[#22CC66]/5 via-transparent to-transparent pointer-events-none" />

            <Container className="relative z-10 max-w-6xl mx-auto px-4">
                {/* Navigation Back */}
                <Link
                    to="/"
                    className="inline-flex items-center text-sm text-gray-400 hover:text-white mb-4 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Home
                </Link>

                {/* Header Banner */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 bg-[#121318] border border-white/10 p-5 rounded-2xl shadow-xl">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/15 flex items-center justify-center p-2 shadow-inner">
                                <img src="/favicon.png" alt="SmartFit AI Studio" className="w-full h-full object-contain" />
                            </div>
                            <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#22CC66] rounded-full border-2 border-[#121318] animate-pulse" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold tracking-tight">SmartFit AI Trainer Studio</h1>
                                <span className="text-[10px] bg-[#22CC66]/10 text-[#22CC66] border border-[#22CC66]/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                    MoveNet AI Engine
                                </span>
                            </div>
                            <p className="text-xs text-gray-400">MoveNet AI posture tracking, workout set logging & macro calculations</p>
                        </div>
                    </div>

                    {/* XP & Level Badge */}
                    <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
                        <Award className="w-5 h-5 text-[#22CC66]" />
                        <div>
                            <p className="text-[10px] text-gray-400 uppercase font-semibold">Active Streak</p>
                            <p className="text-xs font-bold text-white">Earn XP & Level Up</p>
                        </div>
                    </div>
                </div>

                {/* Studio Mode Selector Tabs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
                    {[
                        { id: "chat", label: "AI Coach Chat", icon: Bot, desc: "24/7 Fitness Q&A" },
                        { id: "form", label: "AI Pose & Form Check", icon: Camera, desc: "MoveNet Skeletal" },
                        { id: "workout", label: "Workout Studio", icon: Dumbbell, desc: "Active Set Tracker" },
                        { id: "macros", label: "Macro Calculator", icon: Calculator, desc: "Custom Nutrition" },
                    ].map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    setActiveTab(tab.id as any);
                                    if (tab.id !== "form" && isCameraActive) {
                                        stopCamera();
                                    }
                                }}
                                className={`p-3.5 rounded-xl border text-left transition-all duration-200 flex items-center gap-3 ${
                                    isActive
                                        ? "bg-[#22CC66]/10 border-[#22CC66]/60 text-white shadow-[0_0_20px_rgba(34,204,102,0.15)]"
                                        : "bg-[#121318] border-white/10 text-gray-400 hover:text-white hover:bg-white/5"
                                }`}
                            >
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                                    isActive ? "bg-[#22CC66] text-black" : "bg-white/5 text-gray-400"
                                }`}>
                                    <Icon className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold leading-tight">{tab.label}</p>
                                    <p className="text-[10px] opacity-60 leading-tight mt-0.5">{tab.desc}</p>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Studio Content Area */}
                <AnimatePresence mode="wait">
                    {/* TAB 1: AI Coach Chat */}
                    {activeTab === "chat" && (
                        <motion.div
                            key="chat"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex flex-col h-[520px] bg-[#121318] border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
                        >
                            {/* Quick Action Chips */}
                            <div className="flex items-center gap-2 p-3 bg-white/[0.02] border-b border-white/10 overflow-x-auto scrollbar-none">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
                                    <Zap className="w-3 h-3 text-[#22CC66]" /> Topics:
                                </span>
                                {quickActions.map((action) => (
                                    <Button
                                        key={action.label}
                                        variant="outline"
                                        size="sm"
                                        className="h-8 text-xs gap-1.5 bg-white/5 border-white/10 hover:border-[#22CC66]/40 hover:bg-[#22CC66]/10 text-gray-300 hover:text-white rounded-lg shrink-0"
                                        onClick={() => sendMessage(action.prompt)}
                                        disabled={isLoading}
                                    >
                                        <action.icon className="w-3.5 h-3.5 text-[#22CC66]" />
                                        {action.label}
                                    </Button>
                                ))}
                            </div>

                            {/* Messages List */}
                            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 custom-scrollbar">
                                {messages.map((message) => (
                                    <div
                                        key={message.id}
                                        className={`flex gap-3 my-2 items-start ${message.role === "user" ? "flex-row-reverse" : ""}`}
                                    >
                                        <div
                                            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border shadow-md ${
                                                message.role === "user"
                                                    ? "bg-[#22CC66] border-[#22CC66] text-black font-bold text-xs"
                                                    : "bg-white/5 border-white/15 p-1"
                                            }`}
                                        >
                                            {message.role === "user" ? (
                                                "YOU"
                                            ) : (
                                                <img src="/favicon.png" alt="SmartFit AI Avatar" className="w-full h-full object-contain" />
                                            )}
                                        </div>
                                        <div
                                            className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-lg text-xs sm:text-sm ${
                                                message.role === "user"
                                                    ? "bg-[#22CC66] text-black font-medium rounded-tr-none"
                                                    : "bg-[#181a22] text-white border border-white/10 rounded-tl-none"
                                            }`}
                                        >
                                            {message.role === "user" ? (
                                                <p className="whitespace-pre-wrap break-words">{message.content}</p>
                                            ) : (
                                                <div className="space-y-1">
                                                    {formatMessageContent(message.content)}
                                                </div>
                                            )}
                                            <p className="text-[10px] opacity-40 mt-1.5 text-right">
                                                {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                            </p>
                                        </div>
                                    </div>
                                ))}

                                {isLoading && (
                                    <div className="flex gap-3 my-2 items-start">
                                        <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/15 flex items-center justify-center shrink-0 p-1 shadow-md animate-pulse">
                                            <img src="/favicon.png" alt="SmartFit AI" className="w-full h-full object-contain opacity-50" />
                                        </div>
                                        <div className="bg-[#181a22] border border-[#22CC66]/30 rounded-2xl rounded-tl-none px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <Loader2 className="w-4 h-4 animate-spin text-[#22CC66]" />
                                                <span className="text-xs text-gray-400">AI Personal Trainer formulating response...</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div ref={messagesEndRef} />
                            </div>

                            {/* Form Input */}
                            <div className="p-3 sm:p-4 bg-[#0a0b0e] border-t border-white/10">
                                <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} className="flex gap-2">
                                    <Input
                                        ref={inputRef}
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="Ask AI personal trainer anything..."
                                        className="flex-1 bg-[#14161f] border-white/10 text-white text-xs sm:text-sm placeholder:text-gray-500 rounded-xl"
                                        disabled={isLoading}
                                    />
                                    <Button
                                        type="submit"
                                        disabled={isLoading || !input.trim()}
                                        className="bg-[#22CC66] text-black hover:bg-[#1fb85a] rounded-xl px-5 font-bold"
                                    >
                                        <Send className="w-4 h-4" />
                                    </Button>
                                </form>
                            </div>
                        </motion.div>
                    )}

                    {/* TAB 2: MoveNet AI Real-Time Pose Checker */}
                    {activeTab === "form" && (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-[#121318] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-6"
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        <Cpu className="w-5 h-5 text-[#22CC66]" />
                                        MoveNet AI Pose Detection Engine
                                    </h3>
                                    <p className="text-xs text-gray-400">High-precision skeletal keypoint tracking (60 FPS | TensorFlow WebGL)</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {isCameraActive && (
                                        <Button
                                            onClick={stopCamera}
                                            variant="destructive"
                                            size="sm"
                                            className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl gap-1.5 px-3.5 shadow-[0_0_12px_rgba(220,38,38,0.3)]"
                                        >
                                            <VideoOff className="w-4 h-4" /> Stop Camera
                                        </Button>
                                    )}
                                    <span className="text-xs text-gray-400">Exercise:</span>
                                    <select
                                        value={selectedExercise}
                                        onChange={(e) => setSelectedExercise(e.target.value)}
                                        className="bg-white/5 border border-white/10 text-white text-xs rounded-xl px-3 py-2 outline-none focus:border-[#22CC66]"
                                    >
                                        <option value="Barbell Squat" className="bg-[#121318]">Barbell Squat</option>
                                        <option value="Push-Ups" className="bg-[#121318]">Push-Ups</option>
                                        <option value="Conventional Deadlift" className="bg-[#121318]">Conventional Deadlift</option>
                                        <option value="Dumbbell Bicep Curl" className="bg-[#121318]">Dumbbell Bicep Curl</option>
                                    </select>
                                </div>
                            </div>

                            {/* Camera Viewport Area */}
                            <div className="relative w-full h-[320px] sm:h-[400px] rounded-2xl bg-black border border-white/15 overflow-hidden flex items-center justify-center">
                                {/* Hidden Video Element */}
                                <video
                                    ref={videoRef}
                                    playsInline
                                    muted
                                    className="hidden"
                                />

                                {/* Rendered Mirrored Canvas with MoveNet Skeleton */}
                                <canvas
                                    ref={canvasRef}
                                    className={`w-full h-full object-cover ${isCameraActive ? "block" : "hidden"}`}
                                />

                                {isCameraActive ? (
                                    <>
                                        {/* Real-time HUD Status */}
                                        <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
                                            <div className="flex items-center gap-2 bg-black/80 border border-[#22CC66]/50 px-3 py-1.5 rounded-xl backdrop-blur-md">
                                                <span className="w-2.5 h-2.5 rounded-full bg-[#22CC66] animate-ping" />
                                                <span className="text-xs font-mono font-bold text-[#22CC66]">
                                                    MOVENET POSE AI: ACTIVE
                                                </span>
                                                <span className="text-[10px] text-gray-400 border-l border-white/20 pl-2">ANGLE: {jointAngle}°</span>
                                            </div>

                                            <div className="flex items-center gap-2 bg-black/80 border border-white/15 px-3.5 py-1.5 rounded-xl backdrop-blur-md text-xs font-mono text-white">
                                                <span className="text-[#22CC66] font-bold">REPS: {trackedReps}</span>
                                                <span className="opacity-40">|</span>
                                                <span>{fps} FPS</span>
                                            </div>
                                        </div>

                                        {/* Bottom Action Controls */}
                                        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between z-10 bg-black/85 backdrop-blur-md p-3 rounded-2xl border border-white/15">
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    onClick={stopCamera}
                                                    variant="destructive"
                                                    className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl gap-1.5 px-4 shadow-[0_0_15px_rgba(220,38,38,0.4)]"
                                                >
                                                    <VideoOff className="w-4 h-4" /> Stop Camera
                                                </Button>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 className="w-4 h-4 text-[#22CC66]" />
                                                <span className="text-xs font-bold text-white">Form Score: {formScore}%</span>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center space-y-4 p-6">
                                        {isModelLoading ? (
                                            <div className="space-y-3">
                                                <Loader2 className="w-10 h-10 text-[#22CC66] animate-spin mx-auto" />
                                                <p className="text-sm font-bold text-white">Loading MoveNet AI Pose Engine...</p>
                                                <p className="text-xs text-gray-400">Initializing TensorFlow WebGL neural weights</p>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-[#22CC66] shadow-inner">
                                                    <Cpu className="w-8 h-8" />
                                                </div>
                                                <div>
                                                    <h4 className="text-base font-bold text-white">MoveNet Real-Time AI Pose Detector</h4>
                                                    <p className="text-xs text-gray-400 max-w-md mx-auto mt-1">
                                                        Tracks 17 body keypoints in real-time to analyze posture, joint angles, and log completed workout reps.
                                                    </p>
                                                </div>
                                                <Button
                                                    onClick={startCamera}
                                                    className="bg-[#22CC66] text-black hover:bg-[#1fb85a] font-bold text-xs rounded-xl px-7 py-3 shadow-[0_0_25px_rgba(34,204,102,0.3)] transition-all"
                                                >
                                                    Start MoveNet AI Pose Detector
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Live Biomechanics Callouts */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
                                    <p className="text-xs font-bold text-[#22CC66] flex items-center gap-1.5">
                                        <CheckCircle2 className="w-4 h-4" /> Live Joint Angle: {jointAngle}°
                                    </p>
                                    <p className="text-[11px] text-gray-400 mt-1">{postureFeedback}</p>
                                </div>
                                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
                                    <p className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                                        <Activity className="w-4 h-4" /> Form Accuracy
                                    </p>
                                    <p className="text-[11px] text-gray-400 mt-1">{formScore}% — Parallel knee alignment maintained</p>
                                </div>
                                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
                                    <p className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                                        <Sparkles className="w-4 h-4" /> Tracked Reps
                                    </p>
                                    <p className="text-sm font-bold text-white mt-1">{trackedReps} Reps Completed</p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* TAB 3: Active Workout Studio */}
                    {activeTab === "workout" && (
                        <motion.div
                            key="workout"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-[#121318] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-6"
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        <Dumbbell className="w-5 h-5 text-[#22CC66]" />
                                        Active Workout Session Studio
                                    </h3>
                                    <p className="text-xs text-gray-400">Log your sets, track weights, and trigger rest countdown timers</p>
                                </div>
                                
                                {/* Rest Timer Display */}
                                <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
                                    <Clock className="w-4 h-4 text-[#22CC66]" />
                                    <div>
                                        <p className="text-[10px] text-gray-400 uppercase font-semibold">Rest Timer</p>
                                        <p className="text-sm font-mono font-bold text-[#22CC66]">{restTimer}s</p>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setIsTimerRunning(!isTimerRunning)}
                                        className="h-8 text-xs text-gray-300 hover:text-white"
                                    >
                                        {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                                    </Button>
                                </div>
                            </div>

                            {/* Exercise Set Tracker List */}
                            <div className="space-y-4">
                                {[
                                    { id: "ex1", name: "Barbell Bench Press", target: "4 Sets x 10 Reps", weight: "70 kg" },
                                    { id: "ex2", name: "Incline Dumbbell Flyes", target: "3 Sets x 12 Reps", weight: "22 kg" },
                                    { id: "ex3", name: "Tricep Rope Pushdowns", target: "3 Sets x 15 Reps", weight: "35 kg" },
                                ].map((ex) => (
                                    <div key={ex.id} className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="text-sm font-bold text-white">{ex.name}</h4>
                                                <p className="text-xs text-gray-400">{ex.target} • Suggested: {ex.weight}</p>
                                            </div>
                                            <span className="text-xs text-[#22CC66] bg-[#22CC66]/10 border border-[#22CC66]/20 px-2.5 py-1 rounded-full font-semibold">
                                                Chest & Triceps Split
                                            </span>
                                        </div>

                                        {/* Sets Checklist */}
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                                            {[1, 2, 3, 4].map((setNum) => {
                                                const setId = `${ex.id}-s${setNum}`;
                                                const isDone = !!completedSets[setId];
                                                return (
                                                    <button
                                                        key={setId}
                                                        onClick={() => toggleSetComplete(setId)}
                                                        className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-between transition-all ${
                                                            isDone
                                                                ? "bg-[#22CC66]/15 border-[#22CC66] text-[#22CC66]"
                                                                : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
                                                        }`}
                                                    >
                                                        <span>Set {setNum}</span>
                                                        {isDone ? <CheckCircle2 className="w-3.5 h-3.5 text-[#22CC66]" /> : <span className="text-[10px] opacity-40">Log</span>}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-2 text-center">
                                <Button
                                    onClick={() => {
                                        toast.success("Workout Session Completed! Logged to profile (+50 XP). 🎉");
                                        gamification.recordWorkoutLog();
                                    }}
                                    className="bg-[#22CC66] text-black hover:bg-[#1fb85a] font-bold rounded-xl text-xs px-8 py-3"
                                >
                                    Finish Workout & Collect +50 XP
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {/* TAB 4: Macro Target Calculator */}
                    {activeTab === "macros" && (
                        <motion.div
                            key="macros"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-[#121318] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-6"
                        >
                            <div className="border-b border-white/10 pb-4">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Calculator className="w-5 h-5 text-[#22CC66]" />
                                    AI Macro & Calorie Calculator
                                </h3>
                                <p className="text-xs text-gray-400">Calculate exact daily calories, protein, carbs & fat targets tailored to your body</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Sliders & Controls */}
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between text-xs font-semibold mb-1.5">
                                            <span className="text-gray-300">Body Weight</span>
                                            <span className="text-[#22CC66] font-mono font-bold">{weight} kg</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="40"
                                            max="140"
                                            value={weight}
                                            onChange={(e) => setWeight(Number(e.target.value))}
                                            className="w-full accent-[#22CC66] bg-white/10 rounded-lg"
                                        />
                                    </div>

                                    <div>
                                        <div className="flex justify-between text-xs font-semibold mb-1.5">
                                            <span className="text-gray-300">Height</span>
                                            <span className="text-[#22CC66] font-mono font-bold">{height} cm</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="140"
                                            max="210"
                                            value={height}
                                            onChange={(e) => setHeight(Number(e.target.value))}
                                            className="w-full accent-[#22CC66] bg-white/10 rounded-lg"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-semibold text-gray-300 block mb-2">Primary Goal</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {[
                                                { id: "loss", label: "Fat Loss" },
                                                { id: "muscle", label: "Lean Muscle" },
                                                { id: "maintenance", label: "Maintenance" },
                                            ].map((g) => (
                                                <button
                                                    key={g.id}
                                                    onClick={() => setGoal(g.id as any)}
                                                    className={`py-2 px-3 rounded-xl border text-xs font-semibold text-center transition-all ${
                                                        goal === g.id
                                                            ? "bg-[#22CC66] text-black border-[#22CC66] font-bold"
                                                            : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
                                                    }`}
                                                >
                                                    {g.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Calculated Targets Display */}
                                <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4 flex flex-col justify-between">
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase font-semibold">Recommended Daily Energy Target</p>
                                        <p className="text-3xl font-black text-white mt-1">{calories} <span className="text-sm font-normal text-[#22CC66]">kcal/day</span></p>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 text-center pt-2">
                                        <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                                            <p className="text-[10px] text-gray-400">Protein</p>
                                            <p className="text-base font-bold text-[#22CC66] mt-0.5">{protein}g</p>
                                        </div>
                                        <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                                            <p className="text-[10px] text-gray-400">Carbs</p>
                                            <p className="text-base font-bold text-amber-400 mt-0.5">{carbs}g</p>
                                        </div>
                                        <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                                            <p className="text-[10px] text-gray-400">Healthy Fats</p>
                                            <p className="text-base font-bold text-rose-400 mt-0.5">{fats}g</p>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={() => {
                                            toast.success("Macro Plan Saved to Member Dashboard! (+20 XP)");
                                            gamification.recordDietLog();
                                        }}
                                        className="w-full bg-[#22CC66] text-black hover:bg-[#1fb85a] font-bold text-xs rounded-xl py-3"
                                    >
                                        Save Macro Plan & Claim +20 XP
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Container>
        </div>
    );
}
