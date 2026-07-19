import { Container } from "@/components/Container";
import { Link } from "react-router-dom";
import { ArrowLeft, Trash2, Mail, Clock, ShieldAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function DeleteAccount() {
    return (
        <div className="min-h-screen py-20 bg-background">
            <Container className="max-w-4xl">
                <Link
                    to="/"
                    className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Home
                </Link>

                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20">
                        <Trash2 className="w-8 h-8 text-destructive animate-pulse" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold">Delete Account</h1>
                </div>

                <p className="text-muted-foreground mb-8">
                    Last updated: May 28, 2026
                </p>

                {/* Main Instruction Card */}
                <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-6 mb-8 relative overflow-hidden group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-destructive/10 to-transparent blur-xl opacity-50 pointer-events-none"></div>
                    <div className="relative flex items-start gap-4">
                        <ShieldAlert className="w-6 h-6 text-destructive flex-shrink-0 mt-1" />
                        <div>
                            <h2 className="font-semibold text-lg text-white mb-2">Request Account & Data Deletion</h2>
                            <p className="text-gray-300 leading-relaxed">
                                Users may request the permanent deletion of their SmartFit AI account and all associated data by contacting us. Once processed, this action is permanent and cannot be undone.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Key Information Cards */}
                <div className="grid md:grid-cols-3 gap-4 mb-8">
                    <Card className="bg-card/50 border-destructive/20 relative overflow-hidden group hover:border-destructive/40 transition-all duration-300">
                        <CardContent className="p-5 text-center flex flex-col items-center justify-center min-h-[140px]">
                            <Mail className="w-8 h-8 text-destructive mb-3" />
                            <h3 className="font-semibold mb-1">Email Request</h3>
                            <a 
                                href="mailto:contact@smartfitai.in" 
                                className="text-xs text-primary hover:underline font-medium break-all"
                            >
                                contact@smartfitai.in
                            </a>
                        </CardContent>
                    </Card>
                    <Card className="bg-card/50 border-destructive/20 relative overflow-hidden group hover:border-destructive/40 transition-all duration-300">
                        <CardContent className="p-5 text-center flex flex-col items-center justify-center min-h-[140px]">
                            <Clock className="w-8 h-8 text-destructive mb-3" />
                            <h3 className="font-semibold mb-1">Timeline</h3>
                            <p className="text-xs text-muted-foreground">Within 7 business days</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-card/50 border-destructive/20 relative overflow-hidden group hover:border-destructive/40 transition-all duration-300">
                        <CardContent className="p-5 text-center flex flex-col items-center justify-center min-h-[140px]">
                            <ShieldAlert className="w-8 h-8 text-destructive mb-3" />
                            <h3 className="font-semibold mb-1">Permanence</h3>
                            <p className="text-xs text-muted-foreground">Irreversible data removal</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Detailed Steps & Policy */}
                <div className="prose prose-invert prose-green max-w-none space-y-8">
                    <section className="bg-card/30 border border-border/50 rounded-xl p-6">
                        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                            <span className="text-destructive">1.</span> Information Required
                        </h2>
                        <p className="text-gray-300 leading-relaxed mb-4">
                            To process your deletion request efficiently, please include the following details in your email to <a href="mailto:contact@smartfitai.in" className="text-primary hover:underline">contact@smartfitai.in</a>:
                        </p>
                        <ul className="list-disc list-inside text-gray-300 space-y-2 mt-2 ml-2">
                            <li>Your registered email address</li>
                            <li>Your account username (if applicable)</li>
                        </ul>
                    </section>

                    <section className="bg-card/30 border border-border/50 rounded-xl p-6">
                        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                            <span className="text-destructive">2.</span> Scope of Data Deletion
                        </h2>
                        <p className="text-gray-300 leading-relaxed mb-3">
                            When your account is deleted, the following associated data is permanently purged from our databases:
                        </p>
                        <ul className="list-disc list-inside text-gray-300 space-y-2 ml-2">
                            <li>Profile information (name, profile picture, credentials)</li>
                            <li>Personal health metrics and fitness goals</li>
                            <li>AI-generated workout logs and custom fitness schedules</li>
                            <li>Nutrition history, meal logging, and macro tracking data</li>
                            <li>Application settings and customization preferences</li>
                        </ul>
                    </section>

                    <section className="bg-card/30 border border-border/50 rounded-xl p-6">
                        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                            <span className="text-destructive">3.</span> Data Retention Exceptions
                        </h2>
                        <p className="text-gray-300 leading-relaxed">
                            Please note that some data may be retained temporarily or in archive formats if required for legal, security, or fraud-prevention purposes. For example:
                        </p>
                        <ul className="list-disc list-inside text-gray-300 space-y-2 mt-2 ml-2">
                            <li>Financial transaction records (payment history, subscription invoices) are retained for tax, accounting, and compliance purposes.</li>
                            <li>Anonymized or aggregated system usage logs that do not identify individual users.</li>
                        </ul>
                    </section>

                    <section className="bg-card/30 border border-border/50 rounded-xl p-6">
                        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                            <span className="text-destructive">4.</span> Third-Party Data
                        </h2>
                        <p className="text-gray-300 leading-relaxed">
                            For services integrated with third-party providers (such as Google Analytics or Razorpay), deletion requests on SmartFit AI will remove linking information, but any independent data held by those providers is subject to their respective privacy policies.
                        </p>
                    </section>

                    <section className="bg-card/30 border border-border/50 rounded-xl p-6">
                        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                            <span className="text-destructive">5.</span> Questions & Support
                        </h2>
                        <p className="text-gray-300 leading-relaxed">
                            If you have questions regarding our data retention practices or need assistance with the account deletion process, please do not hesitate to contact us at <a href="mailto:contact@smartfitai.in" className="text-primary hover:underline">contact@smartfitai.in</a>.
                        </p>
                    </section>
                </div>
            </Container>
        </div>
    );
}
