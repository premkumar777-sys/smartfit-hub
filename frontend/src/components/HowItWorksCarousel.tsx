import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { UserPlus, Target, Bot, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    type CarouselApi,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const steps = [
    {
        step: 1,
        icon: UserPlus,
        title: "Create Account",
        description: "Sign up for free in seconds. No credit card required to get started with your fitness journey.",
        color: "from-blue-500 to-cyan-500",
    },
    {
        step: 2,
        icon: Target,
        title: "Set Your Goals",
        description: "Tell us about your fitness objectives – whether it's weight loss, muscle gain, or staying active.",
        color: "from-purple-500 to-pink-500",
    },
    {
        step: 3,
        icon: Bot,
        title: "Get Your AI Plan",
        description: "Our AI analyzes your goals and creates a personalized workout and nutrition plan just for you.",
        color: "from-amber-500 to-orange-500",
    },
    {
        step: 4,
        icon: TrendingUp,
        title: "Track & Achieve",
        description: "Follow your plan, track your progress, and watch yourself transform with real-time analytics.",
        color: "from-emerald-500 to-teal-500",
    },
];

export const HowItWorksCarousel = () => {
    const [api, setApi] = useState<CarouselApi>();
    const [current, setCurrent] = useState(0);

    const scrollPrev = useCallback(() => {
        api?.scrollPrev();
    }, [api]);

    const scrollNext = useCallback(() => {
        api?.scrollNext();
    }, [api]);

    useEffect(() => {
        if (!api) return;

        api.on("select", () => {
            setCurrent(api.selectedScrollSnap());
        });
    }, [api]);

    return (
        <section className="py-16 relative overflow-hidden">
            {/* Decorative background */}
            <div className="absolute inset-0 opacity-30">
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />
            </div>

            <div className="max-w-6xl mx-auto px-6 relative z-10">
                <motion.div
                    className="text-center mb-12"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        How It <span className="text-gradient">Works</span>
                    </h2>
                    <p className="text-gray-400 max-w-xl mx-auto">
                        Get started in 4 simple steps and transform your fitness journey
                    </p>
                </motion.div>

                {/* Progress bar */}
                <div className="max-w-md mx-auto mb-8">
                    <div className="flex justify-between items-center mb-2">
                        {steps.map((step, index) => (
                            <div
                                key={step.step}
                                className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300",
                                    index <= current
                                        ? "bg-primary text-white scale-110"
                                        : "bg-white/10 text-gray-400"
                                )}
                            >
                                {step.step}
                            </div>
                        ))}
                    </div>
                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-primary to-emerald-400 rounded-full"
                            initial={{ width: "0%" }}
                            animate={{ width: `${((current + 1) / steps.length) * 100}%` }}
                            transition={{ duration: 0.3 }}
                        />
                    </div>
                </div>

                <div className="relative">
                    <Carousel
                        setApi={setApi}
                        opts={{
                            align: "center",
                        }}
                        className="w-full"
                    >
                        <CarouselContent>
                            {steps.map((step, index) => {
                                const Icon = step.icon;
                                return (
                                    <CarouselItem key={step.step} className="basis-full md:basis-2/3 lg:basis-1/2">
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ duration: 0.5, delay: index * 0.1 }}
                                            className="p-2"
                                        >
                                            <div className={cn(
                                                "relative rounded-3xl overflow-hidden transition-all duration-300",
                                                current === index
                                                    ? "scale-100 opacity-100"
                                                    : "scale-95 opacity-60"
                                            )}>
                                                {/* Card background */}
                                                <div className="absolute inset-0 glass" />
                                                <div className={cn(
                                                    "absolute inset-0 opacity-10 bg-gradient-to-br",
                                                    step.color
                                                )} />

                                                {/* Content */}
                                                <div className="relative p-8 md:p-10 text-center">
                                                    {/* Step badge */}
                                                    <div className={cn(
                                                        "inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-6 bg-gradient-to-r",
                                                        step.color
                                                    )}>
                                                        <span>Step {step.step}</span>
                                                    </div>

                                                    {/* Icon */}
                                                    <div className={cn(
                                                        "w-20 h-20 rounded-2xl mx-auto flex items-center justify-center mb-6 bg-gradient-to-br",
                                                        step.color
                                                    )}>
                                                        <Icon className="w-10 h-10 text-white" />
                                                    </div>

                                                    {/* Text */}
                                                    <h3 className="text-2xl font-bold mb-4 text-white">
                                                        {step.title}
                                                    </h3>
                                                    <p className="text-gray-300 leading-relaxed max-w-sm mx-auto">
                                                        {step.description}
                                                    </p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    </CarouselItem>
                                );
                            })}
                        </CarouselContent>
                    </Carousel>

                    {/* Navigation Arrows */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 md:-translate-x-6 w-12 h-12 rounded-full bg-background/80 backdrop-blur-sm border border-white/10 hover:bg-background hover:border-white/20 z-10"
                        onClick={scrollPrev}
                        disabled={current === 0}
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 md:translate-x-6 w-12 h-12 rounded-full bg-background/80 backdrop-blur-sm border border-white/10 hover:bg-background hover:border-white/20 z-10"
                        onClick={scrollNext}
                        disabled={current === steps.length - 1}
                    >
                        <ChevronRight className="w-6 h-6" />
                    </Button>
                </div>

                {/* Mobile dot indicators */}
                <div className="flex justify-center gap-2 mt-6 md:hidden">
                    {steps.map((_, index) => (
                        <div
                            key={index}
                            className={cn(
                                "w-2 h-2 rounded-full transition-all duration-300",
                                current === index ? "w-6 bg-primary" : "bg-white/30"
                            )}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default HowItWorksCarousel;
