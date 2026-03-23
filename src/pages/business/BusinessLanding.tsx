import { Button } from "@/components/ui/button";
import { ArrowRight, Building2, Users, BarChart3, Shield, CreditCard, Cpu } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import NeonButton from "@/components/NeonButton";

export default function BusinessLanding() {
    const solutions = [
        {
            icon: BarChart3,
            title: "AI Business Analytics",
            description: "Data-driven insights to optimize your gym operations and revenue.",
            link: "/gym-analytics/ai"
        },
        {
            icon: Users,
            title: "Trainer Platforms",
            description: "Empower your coaching staff with world-class management tools.",
            link: "/trainer-tools"
        },
        {
            icon: CreditCard,
            title: "Smart Billing",
            description: "Automated payment processing and membership management.",
            link: "/business/payments"
        },
        {
            icon: Shield,
            title: "Facility Security",
            description: "QR-based access control and live attendance monitoring.",
            link: "/business/security"
        }
    ];

    return (
        <div className="min-h-screen bg-black">
            {/* Hero Section */}
            <section className="relative py-24 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent opacity-30" />
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="text-center max-w-4xl mx-auto space-y-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-4"
                        >
                            <Building2 className="w-4 h-4 mr-2" />
                            For Gym Owners & Fitness Professionals
                        </motion.div>
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-5xl md:text-7xl font-bold text-white tracking-tight"
                        >
                            The Future of <span className="text-gradient">Fitness Business</span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-xl text-gray-400 leading-relaxed"
                        >
                            Enterprise-grade tools to manage, scale, and innovate your gym. From AI analytics to contactless entry, SmartFit AI Hub is your business partner.
                        </motion.p>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 }}
                            className="flex flex-col sm:flex-row gap-4 justify-center"
                        >
                            <NeonButton href="/auth">Start Free Trial</NeonButton>
                            <Button asChild variant="glass" size="xl">
                                <a href="#solutions">Explore Solutions</a>
                            </Button>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Solutions Grid */}
            <section id="solutions" className="py-24 bg-white/5">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16 space-y-4">
                        <h2 className="text-4xl font-bold text-white">Enterprise Solutions</h2>
                        <p className="text-gray-400">Everything you need to run a modern, digital-first facility.</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {solutions.map((item, i) => (
                            <Link key={i} to={item.link}>
                                <motion.div
                                    whileHover={{ y: -10 }}
                                    className="bg-black/50 border border-white/10 p-8 rounded-3xl h-full hover:border-primary/50 transition-colors group"
                                >
                                    <div className="p-3 rounded-2xl bg-primary/10 w-fit mb-6 group-hover:bg-primary/20 transition-colors">
                                        <item.icon className="w-8 h-8 text-primary" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed mb-6">{item.description}</p>
                                    <div className="flex items-center text-primary text-sm font-bold group-hover:gap-2 transition-all">
                                        Learn More <ArrowRight className="w-4 h-4 ml-1" />
                                    </div>
                                </motion.div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
