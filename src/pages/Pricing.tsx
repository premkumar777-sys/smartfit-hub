import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Sparkles, Building2, Zap, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Link } from "react-router-dom";

interface PricingPlan {
  name: string;
  icon: React.ReactNode;
  monthlyPrice: string;
  yearlyPrice: string;
  description: string;
  features: string[];
  cta: string;
  ctaLink: string;
  popular?: boolean;
  comingSoon?: boolean;
}

const plans: PricingPlan[] = [
  {
    name: "Free",
    icon: <Zap className="h-6 w-6" />,
    monthlyPrice: "₹0",
    yearlyPrice: "₹0",
    description: "Get started with essential fitness tools",
    features: [
      "AI chatbot (limited)",
      "Training guides access",
      "Basic workouts",
      "Email OTP login",
      "Community access",
    ],
    cta: "Start Free",
    ctaLink: "/auth",
  },
  {
    name: "Premium",
    icon: <Crown className="h-6 w-6" />,
    monthlyPrice: "₹199",
    yearlyPrice: "₹1,999",
    description: "Unlock your full fitness potential",
    features: [
      "AI Personal Trainer",
      "Personalized workouts",
      "Nutrition calculator",
      "Progress dashboard",
      "Unlimited AI chatbot",
      "Gamification & streaks",
      "Priority support",
    ],
    cta: "Upgrade to Premium",
    ctaLink: "/auth",
    popular: true,
  },
  {
    name: "Gym Partner",
    icon: <Building2 className="h-6 w-6" />,
    monthlyPrice: "Custom",
    yearlyPrice: "Custom",
    description: "Complete solution for fitness businesses",
    features: [
      "Member management",
      "Trainer dashboard",
      "QR smart attendance",
      "Class booking system",
      "Business analytics",
    ],
    cta: "Contact Sales",
    ctaLink: "/auth",
    comingSoon: true,
  },
];

export default function Pricing() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <main className="min-h-screen bg-background pt-24 pb-16">
      {/* Header Section */}
      <section className="container mx-auto px-4 text-center mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Badge className="mb-4 bg-primary/20 text-primary border-primary/30 hover:bg-primary/30">
            <Sparkles className="h-3 w-3 mr-1" />
            Simple Pricing
          </Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            Choose Your{" "}
            <span className="text-gradient">Fitness Plan</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
            Start free and upgrade as you grow. No hidden fees, cancel anytime.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4">
            <span className={`text-sm font-medium ${!isYearly ? "text-foreground" : "text-muted-foreground"}`}>
              Monthly
            </span>
            <Switch
              checked={isYearly}
              onCheckedChange={setIsYearly}
              className="data-[state=checked]:bg-primary"
            />
            <span className={`text-sm font-medium ${isYearly ? "text-foreground" : "text-muted-foreground"}`}>
              Yearly
              <Badge variant="secondary" className="ml-2 bg-accent/20 text-accent border-accent/30">
                Save 17%
              </Badge>
            </span>
          </div>
        </motion.div>
      </section>

      {/* Pricing Cards */}
      <section className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative"
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                  <Badge className="bg-primary text-primary-foreground shadow-lg px-4 py-1">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}
              {plan.comingSoon && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                  <Badge variant="secondary" className="bg-secondary text-secondary-foreground shadow-lg px-4 py-1">
                    Coming Soon
                  </Badge>
                </div>
              )}
              <Card
                className={`h-full flex flex-col p-8 transition-all duration-300 hover:scale-[1.02] ${
                  plan.popular
                    ? "border-primary/50 bg-gradient-to-b from-primary/10 to-transparent shadow-[0_0_40px_hsl(var(--primary)/0.2)]"
                    : "border-border"
                } ${plan.comingSoon ? "opacity-80" : ""}`}
              >
                {/* Plan Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-lg ${plan.popular ? "bg-primary/20 text-primary" : "bg-secondary text-foreground"}`}>
                    {plan.icon}
                  </div>
                  <h3 className="text-2xl font-bold">{plan.name}</h3>
                </div>

                {/* Price */}
                <div className="mb-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">
                      {isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                    </span>
                    {plan.monthlyPrice !== "Custom" && (
                      <span className="text-muted-foreground">
                        /{isYearly ? "year" : "month"}
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm mt-1">
                    {plan.description}
                  </p>
                </div>

                {/* Features */}
                <ul className="flex-1 space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground/90">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <Button
                  asChild
                  className={`w-full ${
                    plan.popular
                      ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                      : "bg-secondary hover:bg-secondary/80 text-secondary-foreground"
                  }`}
                  size="lg"
                  disabled={plan.comingSoon}
                >
                  <Link to={plan.ctaLink}>
                    {plan.cta}
                  </Link>
                </Button>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Bottom Note */}
      <section className="container mx-auto px-4 mt-16 text-center">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-muted-foreground text-sm"
        >
          ✨ Cancel anytime. No questions asked. All plans include 14-day money-back guarantee.
        </motion.p>
      </section>
    </main>
  );
}
