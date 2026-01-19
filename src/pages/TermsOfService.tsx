import { Container } from "@/components/Container";
import { Link } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";

export default function TermsOfService() {
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
                        <FileText className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold">Terms of Service</h1>
                </div>

                <p className="text-muted-foreground mb-8">
                    Last updated: January 19, 2026
                </p>

                <div className="prose prose-invert prose-green max-w-none space-y-8">
                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">1. Acceptance of Terms</h2>
                        <p className="text-gray-300 leading-relaxed">
                            By accessing or using SmartFit Hub ("Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our Service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">2. Description of Service</h2>
                        <p className="text-gray-300 leading-relaxed">
                            SmartFit Hub is an AI-powered fitness platform offering personalized workout generation, nutrition planning, progress tracking, and related fitness services. The platform is available on a subscription basis with both free and premium tiers.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">3. User Accounts</h2>
                        <ul className="list-disc list-inside text-gray-300 space-y-2">
                            <li>You must provide accurate and complete information when creating an account.</li>
                            <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
                            <li>You must be at least 13 years old to use this Service.</li>
                            <li>One person or entity may not maintain multiple free accounts.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">4. Subscription & Payment</h2>
                        <ul className="list-disc list-inside text-gray-300 space-y-2">
                            <li>Paid subscriptions unlock premium features as described on our pricing page.</li>
                            <li>Payments are processed securely through Razorpay.</li>
                            <li>Subscriptions renew automatically unless cancelled before the renewal date.</li>
                            <li>All prices are listed in Indian Rupees (INR) unless otherwise stated.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">5. Intellectual Property</h2>
                        <p className="text-gray-300 leading-relaxed">
                            All content, features, and functionality of the Service (including AI-generated workout plans, UI design, logos, and text) are the exclusive property of SmartFit Hub. You may not copy, modify, or distribute any part of the Service without our written consent.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">6. User-Generated Content</h2>
                        <p className="text-gray-300 leading-relaxed">
                            You retain ownership of any content you submit (such as workout logs or progress photos). By submitting content, you grant SmartFit Hub a non-exclusive, royalty-free license to use, store, and process your content for the purpose of providing the Service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">7. Health Disclaimer</h2>
                        <p className="text-gray-300 leading-relaxed font-medium bg-red-500/10 p-4 rounded-lg border border-red-500/20">
                            ⚠️ SmartFit Hub provides AI-generated fitness and nutrition suggestions for <strong>informational purposes only</strong>. This is <strong>not medical advice</strong>. Always consult a qualified healthcare professional before starting any new exercise or diet program, especially if you have pre-existing health conditions.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">8. Limitation of Liability</h2>
                        <p className="text-gray-300 leading-relaxed">
                            To the maximum extent permitted by law, SmartFit Hub shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or other intangible losses resulting from your use of the Service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">9. Termination</h2>
                        <p className="text-gray-300 leading-relaxed">
                            We may terminate or suspend your account at any time, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties, or for any other reason.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">10. Governing Law</h2>
                        <p className="text-gray-300 leading-relaxed">
                            These Terms shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law provisions. Any disputes shall be subject to the exclusive jurisdiction of the courts in Hyderabad, Telangana.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">11. Contact Us</h2>
                        <p className="text-gray-300 leading-relaxed">
                            If you have questions about these Terms, please contact us:
                        </p>
                        <ul className="list-none text-gray-300 space-y-1 mt-2">
                            <li><strong>Email:</strong> smartfitai77@gmail.com</li>
                            <li><strong>Phone:</strong> +91 7671862872</li>
                        </ul>
                    </section>
                </div>
            </Container>
        </div>
    );
}
