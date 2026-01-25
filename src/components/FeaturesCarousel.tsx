import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Brain, Eye, Sparkles, BarChart3, Utensils, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    type CarouselApi,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const features = [
    {
        icon: Brain,
        title: "AI Personal Trainer",
        description: "Get intelligent workout recommendations powered by advanced AI algorithms that adapt to your progress and goals.",
        gradient: "from-purple-500 to-indigo-600",
        bgGlow: "rgba(139, 92, 246, 0.15)",
        link: "/ai-trainer",
    },
    {
        icon: Eye,
        title: "Real-Time Form Detection",
        description: "Computer vision technology analyzes your form in real-time and provides instant feedback to prevent injuries.",
        gradient: "from-cyan-500 to-blue-600",
        bgGlow: "rgba(6, 182, 212, 0.15)",
        link: "/workout-session",
    },
    {
        icon: Sparkles,
        title: "3D Trainer Mode",
        description: "Follow animated 3D demonstrations with voice coaching – perfect for when you don't want to use a camera.",
        gradient: "from-amber-500 to-orange-600",
        bgGlow: "rgba(245, 158, 11, 0.15)",
        link: "/3d-trainer",
    },
    {
        icon: BarChart3,
        title: "Smart Progress Dashboard",
        description: "Comprehensive analytics tracking your fitness journey with beautiful charts and achievement milestones.",
        gradient: "from-emerald-500 to-teal-600",
        bgGlow: "rgba(16, 185, 129, 0.15)",
        link: "/progress",
    },
    {
        icon: Utensils,
        title: "Nutrition & Macro AI",
        description: "AI-powered meal planning with precise macro calculations tailored to your body and fitness goals.",
        gradient: "from-rose-500 to-pink-600",
        bgGlow: "rgba(244, 63, 94, 0.15)",
        link: "/nutrition",
    },
];

export const FeaturesCarousel = () => {
    const [api, setApi] = useState<CarouselApi>();
    const [current, setCurrent] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    const scrollPrev = useCallback(() => {
        api?.scrollPrev();
    }, [api]);

    const scrollNext = useCallback(() => {
        api?.scrollNext();
    }, [api]);

    const scrollTo = useCallback((index: number) => {
        api?.scrollTo(index);
    }, [api]);

    useEffect(() => {
        if (!api) return;

        api.on("select", () => {
            setCurrent(api.selectedScrollSnap());
        });
    }, [api]);

    // Auto-slide effect
    useEffect(() => {
        if (!api || isPaused) return;

        const interval = setInterval(() => {
            if (api.canScrollNext()) {
                api.scrollNext();
            } else {
                api.scrollTo(0);
            }
        }, 4000);

        return () => clearInterval(interval);
    }, [api, isPaused]);

    return (
        <section className="py-16 relative overflow-hidden">
            {/* Background glow effect */}
            <div
                className="absolute inset-0 transition-all duration-700"
                style={{ background: `radial-gradient(ellipse at center, ${features[current].bgGlow} 0%, transparent 70%)` }}
            />

            <div className="max-w-6xl mx-auto px-6 relative z-10">
                <motion.div
                    className="text-center mb-12"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        Powerful <span className="text-gradient">Features</span>
                    </h2>
                    <p className="text-gray-400 max-w-xl mx-auto">
                        Discover what makes SmartFit Hub the ultimate fitness companion
                    </p>
                </motion.div>

                <div
                    className="relative"
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                >
                    <Carousel
                        setApi={setApi}
                        opts={{
                            align: "center",
                            loop: true,
                        }}
                        className="w-full"
                    >
                        <CarouselContent className="-ml-2 md:-ml-4">
                            {features.map((feature, index) => {
                                const Icon = feature.icon;
                                return (
                                    <CarouselItem
                                        key={feature.title}
                                        className="pl-2 md:pl-4 basis-full md:basis-1/2 lg:basis-1/3"
                                    >
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            whileInView={{ opacity: 1, scale: 1 }}
                                            viewport={{ once: true }}
                                            transition={{ duration: 0.5, delay: index * 0.1 }}
                                        >
                                            <Link to={feature.link} className="block group">
                                                <div className="relative h-[320px] rounded-2xl overflow-hidden glass border border-white/10 p-6 flex flex-col transition-all duration-300 hover:border-white/20 hover:shadow-xl hover:shadow-primary/10">
                                                    {/* Gradient background on hover */}
                                                    <div className={cn(
                                                        "absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 bg-gradient-to-br",
                                                        feature.gradient
                                                    )} />

                                                    {/* Icon */}
                                                    <div className={cn(
                                                        "w-14 h-14 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-br",
                                                        feature.gradient
                                                    )}>
                                                        <Icon className="w-7 h-7 text-white" />
                                                    </div>

                                                    {/* Content */}
                                                    <h3 className="text-xl font-bold mb-3 text-white group-hover:text-primary transition-colors">
                                                        {feature.title}
                                                    </h3>
                                                    <p className="text-gray-400 leading-relaxed flex-grow">
                                                        {feature.description}
                                                    </p>

                                                    {/* Learn more arrow */}
                                                    <div className="mt-4 flex items-center text-primary opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-0 group-hover:translate-x-2">
                                                        <span className="text-sm font-medium">Explore</span>
                                                        <ChevronRight className="w-4 h-4 ml-1" />
                                                    </div>
                                                </div>
                                            </Link>
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
                        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 md:-translate-x-4 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm border border-white/10 hover:bg-background hover:border-white/20 z-10"
                        onClick={scrollPrev}
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 md:translate-x-4 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm border border-white/10 hover:bg-background hover:border-white/20 z-10"
                        onClick={scrollNext}
                    >
                        <ChevronRight className="w-5 h-5" />
                    </Button>
                </div>

                {/* Dot indicators */}
                <div className="flex justify-center gap-2 mt-8">
                    {features.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => scrollTo(index)}
                            className={cn(
                                "w-2 h-2 rounded-full transition-all duration-300",
                                current === index
                                    ? "w-8 bg-primary"
                                    : "bg-white/30 hover:bg-white/50"
                            )}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FeaturesCarousel;
