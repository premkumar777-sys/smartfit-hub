import { Container } from "@/components/Container";
import { Link } from "react-router-dom";
import { ArrowLeft, Shield } from "lucide-react";

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen py-20 bg-background">
            <Container className="max-w-4xl">
                <Link
                    to="/"
                    className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Home
                </Link>

                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 rounded-xl bg-primary/10">
                        <Shield className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold">Privacy Policy</h1>
                </div>

                <p className="text-muted-foreground mb-8">
                    Last updated: January 19, 2026
                </p>

                <div className="prose prose-invert prose-green max-w-none space-y-8">
                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">1. Introduction</h2>
                        <p className="text-gray-300 leading-relaxed">
                            Welcome to SmartFit AI Hub ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">2. Information We Collect</h2>
                        <p className="text-gray-300 leading-relaxed mb-4">We may collect the following types of information:</p>
                        <ul className="list-disc list-inside text-gray-300 space-y-2">
                            <li><strong>Personal Information:</strong> Name, email address, phone number when you register.</li>
                            <li><strong>Health & Fitness Data:</strong> Workout logs, progress photos, body measurements you voluntarily provide.</li>
                            <li><strong>Usage Data:</strong> Pages visited, features used, time spent on the platform.</li>
                            <li><strong>Device Information:</strong> Browser type, IP address, device identifiers.</li>
                            <li><strong>Payment Information:</strong> Processed securely through our payment partner (Razorpay). We do not store your card details.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">3. How We Use Your Information</h2>
                        <ul className="list-disc list-inside text-gray-300 space-y-2">
                            <li>To provide and maintain our AI-powered fitness services.</li>
                            <li>To personalize your workout and nutrition recommendations.</li>
                            <li>To process payments and manage your subscription.</li>
                            <li>To communicate with you about updates, promotions, and support.</li>
                            <li>To improve our platform and develop new features.</li>
                            <li>To comply with legal obligations.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">4. Data Storage & Security</h2>
                        <p className="text-gray-300 leading-relaxed">
                            Your data is stored securely using Supabase, a trusted database provider with industry-standard encryption. We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, or destruction.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">5. Third-Party Services</h2>
                        <p className="text-gray-300 leading-relaxed">
                            We may use third-party services that collect information used to identify you. These include:
                        </p>
                        <ul className="list-disc list-inside text-gray-300 space-y-2 mt-2">
                            <li>Supabase (Authentication & Database)</li>
                            <li>Razorpay (Payment Processing)</li>
                            <li>Google AI / Gemini (AI-powered features)</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">6. Your Rights</h2>
                        <p className="text-gray-300 leading-relaxed">You have the right to:</p>
                        <ul className="list-disc list-inside text-gray-300 space-y-2 mt-2">
                            <li>Access, update, or delete your personal information.</li>
                            <li>Opt-out of marketing communications.</li>
                            <li>Request a copy of your data.</li>
                            <li>Withdraw consent for data processing.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">7. Health Disclaimer</h2>
                        <p className="text-gray-300 leading-relaxed">
                            SmartFit AI Hub provides AI-generated workout and nutrition suggestions for informational purposes only. This is not medical advice. Always consult a qualified healthcare professional before starting any new fitness or diet program.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">8. Contact Us</h2>
                        <p className="text-gray-300 leading-relaxed">
                            If you have any questions about this Privacy Policy, please contact us:
                        </p>
                        <ul className="list-none text-gray-300 space-y-1 mt-2">
                            <li><strong>Email:</strong> contact@smartfitai.in</li>
                            <li><strong>Phone:</strong> +91 7671862872</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">9. Changes to This Policy</h2>
                        <p className="text-gray-300 leading-relaxed">
                            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
                        </p>
                    </section>
                </div>
            </Container>
        </div>
    );
}
