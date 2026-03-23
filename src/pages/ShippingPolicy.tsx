import { Container } from "@/components/Container";
import { Link } from "react-router-dom";
import { ArrowLeft, Package, Zap, Globe, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function ShippingPolicy() {
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
                        <Package className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold">Shipping & Delivery Policy</h1>
                </div>

                <p className="text-muted-foreground mb-8">
                    Last updated: January 19, 2026
                </p>

                {/* Digital Product Notice */}
                <div className="bg-primary/10 border border-primary/20 rounded-xl p-6 mb-8">
                    <div className="flex items-start gap-4">
                        <Zap className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                        <div>
                            <h2 className="font-semibold text-lg text-white mb-2">Digital Product - Instant Access</h2>
                            <p className="text-gray-300">
                                SmartFit AI Hub is a <strong>100% digital platform</strong>. All our products and services are delivered electronically. There is no physical shipping involved.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4 mb-8">
                    <Card className="bg-card/50 border-primary/20">
                        <CardContent className="p-5 text-center">
                            <Globe className="w-8 h-8 text-primary mx-auto mb-3" />
                            <h3 className="font-semibold mb-1">Worldwide Access</h3>
                            <p className="text-sm text-muted-foreground">Available anywhere with internet</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-card/50 border-primary/20">
                        <CardContent className="p-5 text-center">
                            <Zap className="w-8 h-8 text-primary mx-auto mb-3" />
                            <h3 className="font-semibold mb-1">Instant Delivery</h3>
                            <p className="text-sm text-muted-foreground">Access within seconds of payment</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-card/50 border-primary/20">
                        <CardContent className="p-5 text-center">
                            <Clock className="w-8 h-8 text-primary mx-auto mb-3" />
                            <h3 className="font-semibold mb-1">24/7 Availability</h3>
                            <p className="text-sm text-muted-foreground">Access your account anytime</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="prose prose-invert prose-green max-w-none space-y-8">
                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">1. Nature of Service</h2>
                        <p className="text-gray-300 leading-relaxed">
                            SmartFit AI Hub provides AI-powered fitness and nutrition services through a web-based platform. Our offerings include:
                        </p>
                        <ul className="list-disc list-inside text-gray-300 space-y-2 mt-2">
                            <li>AI-generated personalized workout plans</li>
                            <li>Nutrition and macro tracking tools</li>
                            <li>Progress tracking dashboards</li>
                            <li>Real-time form detection features</li>
                            <li>3D exercise demonstrations</li>
                            <li>Trainer and gym management tools</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">2. Delivery Method</h2>
                        <p className="text-gray-300 leading-relaxed">
                            All services are delivered <strong>digitally</strong> through our website and web application:
                        </p>
                        <ul className="list-disc list-inside text-gray-300 space-y-2 mt-2">
                            <li><strong>Instant Access:</strong> Upon successful payment, your account is upgraded immediately.</li>
                            <li><strong>No Physical Shipment:</strong> There are no physical products to ship.</li>
                            <li><strong>Account-Based:</strong> Access is tied to your registered email address.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">3. Access Requirements</h2>
                        <p className="text-gray-300 leading-relaxed">
                            To use SmartFit AI Hub, you need:
                        </p>
                        <ul className="list-disc list-inside text-gray-300 space-y-2 mt-2">
                            <li>A device with a modern web browser (Chrome, Firefox, Safari, Edge)</li>
                            <li>A stable internet connection</li>
                            <li>A registered and verified email address</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">4. Delivery Confirmation</h2>
                        <p className="text-gray-300 leading-relaxed">
                            After a successful purchase, you will receive:
                        </p>
                        <ul className="list-disc list-inside text-gray-300 space-y-2 mt-2">
                            <li>An email confirmation with your subscription details</li>
                            <li>Immediate access to premium features upon logging in</li>
                            <li>A payment receipt from our payment partner (Razorpay)</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">5. Issues with Access</h2>
                        <p className="text-gray-300 leading-relaxed">
                            If you experience any issues accessing your subscription after payment, please contact us immediately:
                        </p>
                        <ul className="list-none text-gray-300 space-y-1 mt-2">
                            <li><strong>Email:</strong> smartfitai77@gmail.com</li>
                            <li><strong>Phone:</strong> +91 7671862872</li>
                        </ul>
                        <p className="text-gray-300 leading-relaxed mt-4">
                            We aim to resolve all access issues within <strong>24 hours</strong>.
                        </p>
                    </section>
                </div>
            </Container>
        </div>
    );
}
