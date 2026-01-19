import { Container } from "@/components/Container";
import { Link } from "react-router-dom";
import { ArrowLeft, RefreshCcw } from "lucide-react";

export default function RefundPolicy() {
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
                        <RefreshCcw className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold">Refund & Cancellation Policy</h1>
                </div>

                <p className="text-muted-foreground mb-8">
                    Last updated: January 19, 2026
                </p>

                <div className="prose prose-invert prose-green max-w-none space-y-8">
                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">1. Overview</h2>
                        <p className="text-gray-300 leading-relaxed">
                            SmartFit Hub offers digital subscription services. Due to the nature of digital products, our refund policy is designed to be fair while preventing abuse. Please read this policy carefully before making a purchase.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">2. Refund Eligibility</h2>
                        <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/20 mb-4">
                            <p className="text-gray-300 leading-relaxed">
                                ✅ <strong>7-Day Money-Back Guarantee:</strong> If you are not satisfied with your subscription, you may request a full refund within <strong>7 days</strong> of your initial purchase.
                            </p>
                        </div>
                        <p className="text-gray-300 leading-relaxed">
                            To be eligible for a refund:
                        </p>
                        <ul className="list-disc list-inside text-gray-300 space-y-2 mt-2">
                            <li>Your request must be within 7 days of the original purchase date.</li>
                            <li>This is your first refund request for SmartFit Hub.</li>
                            <li>You have not violated our Terms of Service.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">3. Non-Refundable Items</h2>
                        <p className="text-gray-300 leading-relaxed">
                            The following are <strong>not eligible</strong> for refunds:
                        </p>
                        <ul className="list-disc list-inside text-gray-300 space-y-2 mt-2">
                            <li>Subscription renewals (auto-renewal payments).</li>
                            <li>Requests made after 7 days from the purchase date.</li>
                            <li>Accounts that have been banned for policy violations.</li>
                            <li>Partial month subscriptions after cancellation.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">4. How to Request a Refund</h2>
                        <p className="text-gray-300 leading-relaxed">
                            To request a refund, please email us at <strong>smartfitai77@gmail.com</strong> with:
                        </p>
                        <ul className="list-disc list-inside text-gray-300 space-y-2 mt-2">
                            <li>Your registered email address.</li>
                            <li>Transaction ID or payment receipt (if available).</li>
                            <li>Reason for the refund request.</li>
                        </ul>
                        <p className="text-gray-300 leading-relaxed mt-4">
                            We will process your request within <strong>5-7 business days</strong>. Upon approval, the refund will be credited to your original payment method within 7-10 business days.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">5. Subscription Cancellation</h2>
                        <p className="text-gray-300 leading-relaxed">
                            You may cancel your subscription at any time. Here's what happens when you cancel:
                        </p>
                        <ul className="list-disc list-inside text-gray-300 space-y-2 mt-2">
                            <li>You will retain access to premium features until the end of your current billing period.</li>
                            <li>No further charges will be made after cancellation.</li>
                            <li>Your account will revert to the free tier after the subscription expires.</li>
                            <li>Your data (workouts, progress) will be retained for 90 days after cancellation.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">6. How to Cancel</h2>
                        <p className="text-gray-300 leading-relaxed">
                            To cancel your subscription:
                        </p>
                        <ol className="list-decimal list-inside text-gray-300 space-y-2 mt-2">
                            <li>Email us at <strong>smartfitai77@gmail.com</strong> with your account email.</li>
                            <li>We will confirm cancellation within 24-48 hours.</li>
                        </ol>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">7. Contact Us</h2>
                        <p className="text-gray-300 leading-relaxed">
                            For questions about refunds or cancellations, contact us:
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
