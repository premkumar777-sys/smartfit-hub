import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, TrendingUp, AlertTriangle, Sparkles, X, Trophy, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BMIResultProps {
    bmi: number;
    gender: "male" | "female";
    onClose?: () => void;
}

// Gender-specific BMI ranges
const getBMICategory = (bmi: number, gender: "male" | "female") => {
    if (gender === "male") {
        if (bmi < 20) return { category: "Underweight", color: "text-blue-400", bg: "bg-blue-500/20", status: "low" };
        if (bmi < 25) return { category: "Healthy", color: "text-emerald-400", bg: "bg-emerald-500/20", status: "healthy" };
        if (bmi < 30) return { category: "Overweight", color: "text-amber-400", bg: "bg-amber-500/20", status: "high" };
        return { category: "Obese", color: "text-red-400", bg: "bg-red-500/20", status: "very-high" };
    } else {
        // Female ranges are slightly different
        if (bmi < 19) return { category: "Underweight", color: "text-blue-400", bg: "bg-blue-500/20", status: "low" };
        if (bmi < 24) return { category: "Healthy", color: "text-emerald-400", bg: "bg-emerald-500/20", status: "healthy" };
        if (bmi < 29) return { category: "Overweight", color: "text-amber-400", bg: "bg-amber-500/20", status: "high" };
        return { category: "Obese", color: "text-red-400", bg: "bg-red-500/20", status: "very-high" };
    }
};

// Get healthy range based on gender
const getHealthyRange = (gender: "male" | "female") => {
    return gender === "male" ? { min: 20, max: 25 } : { min: 19, max: 24 };
};

// Calculate BMI Prime (BMI / 25 for standard, adjusted for gender)
const calculateBMIPrime = (bmi: number, gender: "male" | "female") => {
    const upperLimit = gender === "male" ? 25 : 24;
    return (bmi / upperLimit).toFixed(2);
};

// Get encouraging message based on BMI status
const getEncouragingMessage = (status: string, bmi: number, gender: "male" | "female") => {
    const healthyRange = getHealthyRange(gender);

    switch (status) {
        case "healthy":
            return {
                title: "🎉 Fantastic! You're in the Healthy Range!",
                message: "Your BMI is within the ideal range. Keep up the great work with your fitness journey!",
                icon: Trophy,
                gradient: "from-emerald-500 to-teal-500",
            };
        case "low":
            const toGainMin = (healthyRange.min - bmi).toFixed(1);
            return {
                title: "💪 You're On Your Way!",
                message: `You're ${toGainMin} BMI points below the healthy range. Focus on strength training and nutrition to build healthy mass!`,
                icon: Target,
                gradient: "from-blue-500 to-cyan-500",
            };
        case "high":
            const toLoseMax = (bmi - healthyRange.max).toFixed(1);
            return {
                title: "🏃 Keep Going! You've Got This!",
                message: `You're ${toLoseMax} BMI points above the healthy range. With consistent exercise and balanced nutrition, you'll reach your goals!`,
                icon: TrendingUp,
                gradient: "from-amber-500 to-orange-500",
            };
        case "very-high":
            return {
                title: "🌟 Every Step Counts!",
                message: "Start with small, achievable goals. SFitNex Hub is here to support your transformation journey!",
                icon: Heart,
                gradient: "from-rose-500 to-pink-500",
            };
        default:
            return {
                title: "📊 BMI Calculated",
                message: "Track your progress and work towards your fitness goals!",
                icon: Sparkles,
                gradient: "from-purple-500 to-indigo-500",
            };
    }
};

export const BMIResult = ({ bmi, gender, onClose }: BMIResultProps) => {
    const [showCelebration, setShowCelebration] = useState(false);
    const categoryInfo = getBMICategory(bmi, gender);
    const bmiPrime = calculateBMIPrime(bmi, gender);
    const healthyRange = getHealthyRange(gender);
    const encouragement = getEncouragingMessage(categoryInfo.status, bmi, gender);
    const Icon = encouragement.icon;

    // Show celebration for healthy BMI
    useEffect(() => {
        if (categoryInfo.status === "healthy") {
            setShowCelebration(true);
            const timer = setTimeout(() => setShowCelebration(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [categoryInfo.status]);

    // Calculate position on the BMI scale (10-40 range)
    const scaleMin = 10;
    const scaleMax = 40;
    const position = Math.min(Math.max((bmi - scaleMin) / (scaleMax - scaleMin) * 100, 0), 100);

    return (
        <div className="space-y-4">
            {/* Main BMI Display Card */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn("glass rounded-xl p-5 border-2", categoryInfo.bg, "border-white/10")}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Your BMI Results</h3>
                    <span className={cn("px-3 py-1 rounded-full text-sm font-medium", categoryInfo.bg, categoryInfo.color)}>
                        {gender === "male" ? "♂ Male" : "♀ Female"}
                    </span>
                </div>

                {/* BMI Values */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center p-3 rounded-lg bg-white/5">
                        <p className="text-sm text-muted-foreground mb-1">Your BMI</p>
                        <p className={cn("text-3xl font-bold", categoryInfo.color)}>{bmi.toFixed(1)}</p>
                        <p className={cn("text-sm font-medium mt-1", categoryInfo.color)}>{categoryInfo.category}</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-white/5">
                        <p className="text-sm text-muted-foreground mb-1">BMI Prime</p>
                        <p className={cn("text-3xl font-bold", parseFloat(bmiPrime) <= 1 ? "text-emerald-400" : "text-amber-400")}>
                            {bmiPrime}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                            {parseFloat(bmiPrime) <= 1 ? "✓ Optimal" : "Above optimal"}
                        </p>
                    </div>
                </div>

                {/* BMI Scale */}
                <div className="mb-4">
                    <div className="flex justify-between text-xs text-muted-foreground mb-2">
                        <span>Underweight</span>
                        <span>Healthy</span>
                        <span>Overweight</span>
                        <span>Obese</span>
                    </div>
                    <div className="relative h-3 rounded-full overflow-hidden bg-gradient-to-r from-blue-500 via-emerald-500 via-amber-500 to-red-500">
                        {/* Marker */}
                        <motion.div
                            initial={{ left: "0%" }}
                            animate={{ left: `${position}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg border-2 border-primary"
                            style={{ marginLeft: "-8px" }}
                        />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>10</span>
                        <span>{gender === "male" ? "20" : "19"}</span>
                        <span>{gender === "male" ? "25" : "24"}</span>
                        <span>{gender === "male" ? "30" : "29"}</span>
                        <span>40</span>
                    </div>
                </div>

                {/* Healthy Range Info */}
                <div className="text-center p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <p className="text-sm text-emerald-400">
                        Healthy range for {gender === "male" ? "males" : "females"}: <strong>{healthyRange.min} - {healthyRange.max}</strong>
                    </p>
                </div>
            </motion.div>

            {/* Encouraging Message Card */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className={cn(
                    "relative overflow-hidden rounded-xl p-5 border border-white/10",
                    `bg-gradient-to-br ${encouragement.gradient} bg-opacity-10`
                )}
                style={{
                    background: `linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)`
                }}
            >
                {/* Gradient overlay */}
                <div className={cn("absolute inset-0 opacity-10 bg-gradient-to-br", encouragement.gradient)} />

                <div className="relative flex items-start gap-4">
                    <div className={cn("flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br", encouragement.gradient)}>
                        <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                        <h4 className="text-lg font-bold text-white mb-2">{encouragement.title}</h4>
                        <p className="text-gray-300 leading-relaxed">{encouragement.message}</p>
                    </div>
                </div>
            </motion.div>

            {/* Celebration Popup for Healthy BMI */}
            <AnimatePresence>
                {showCelebration && categoryInfo.status === "healthy" && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowCelebration(false)}
                    >
                        <motion.div
                            initial={{ y: 50 }}
                            animate={{ y: 0 }}
                            exit={{ y: 50 }}
                            className="relative max-w-md w-full glass rounded-2xl p-8 text-center border border-emerald-500/30"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Close button */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-4 right-4"
                                onClick={() => setShowCelebration(false)}
                            >
                                <X className="w-5 h-5" />
                            </Button>

                            {/* Confetti effect */}
                            <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
                                {[...Array(20)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{
                                            x: "50%",
                                            y: "50%",
                                            opacity: 1,
                                            scale: 0
                                        }}
                                        animate={{
                                            x: `${Math.random() * 100}%`,
                                            y: `${Math.random() * 100}%`,
                                            opacity: 0,
                                            scale: 1,
                                            rotate: Math.random() * 360
                                        }}
                                        transition={{
                                            duration: 1.5 + Math.random(),
                                            delay: Math.random() * 0.5
                                        }}
                                        className={cn(
                                            "absolute w-3 h-3 rounded-full",
                                            ["bg-emerald-500", "bg-teal-500", "bg-green-500", "bg-yellow-500", "bg-primary"][i % 5]
                                        )}
                                    />
                                ))}
                            </div>

                            {/* Trophy icon */}
                            <motion.div
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: "spring", delay: 0.2 }}
                                className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 mb-6"
                            >
                                <Trophy className="w-10 h-10 text-white" />
                            </motion.div>

                            <motion.h2
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="text-2xl font-bold text-white mb-3"
                            >
                                🎉 Congratulations!
                            </motion.h2>

                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="text-lg text-emerald-400 font-medium mb-2"
                            >
                                Your BMI is in the Healthy Range!
                            </motion.p>

                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="text-gray-300 mb-6"
                            >
                                BMI: <span className="font-bold text-white">{bmi.toFixed(1)}</span> |
                                BMI Prime: <span className="font-bold text-emerald-400">{bmiPrime}</span>
                            </motion.p>

                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.6 }}
                                className="text-gray-400 text-sm"
                            >
                                Keep maintaining your healthy lifestyle! 💪
                            </motion.p>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.7 }}
                            >
                                <Button
                                    variant="hero"
                                    className="mt-6"
                                    onClick={() => setShowCelebration(false)}
                                >
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    Keep It Up!
                                </Button>
                            </motion.div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default BMIResult;
