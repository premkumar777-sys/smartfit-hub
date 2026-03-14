import { Container } from "@/components/Container";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail, Phone, MessageCircle, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ContactUs() {
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

                <div className="text-center mb-12">
                    <h1 className="text-3xl md:text-4xl font-bold mb-4">Contact Us</h1>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        Have questions, feedback, or need support? We're here to help! Reach out to us through any of the channels below.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-12">
                    {/* Email Card */}
                    <Card className="bg-card/50 border-primary/20 hover:border-primary/40 transition-colors">
                        <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                                <div className="p-3 rounded-xl bg-primary/10">
                                    <Mail className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg mb-1">Email Support</h3>
                                    <p className="text-muted-foreground text-sm mb-3">
                                        For general inquiries, feature requests, or technical support.
                                    </p>
                                    <a
                                        href="mailto:smartfitai77@gmail.com"
                                        className="text-primary font-medium hover:underline"
                                    >
                                        smartfitai77@gmail.com
                                    </a>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Phone Card */}
                    <Card className="bg-card/50 border-primary/20 hover:border-primary/40 transition-colors">
                        <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                                <div className="p-3 rounded-xl bg-blue-500/10">
                                    <Phone className="w-6 h-6 text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg mb-1">Phone Support</h3>
                                    <p className="text-muted-foreground text-sm mb-3">
                                        Available Mon-Sat, 10 AM - 7 PM IST.
                                    </p>
                                    <a
                                        href="tel:+917671862872"
                                        className="text-blue-400 font-medium hover:underline"
                                    >
                                        +91 7671862872
                                    </a>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* WhatsApp Card */}
                    <Card className="bg-card/50 border-primary/20 hover:border-primary/40 transition-colors">
                        <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                                <div className="p-3 rounded-xl bg-green-500/10">
                                    <MessageCircle className="w-6 h-6 text-green-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg mb-1">WhatsApp</h3>
                                    <p className="text-muted-foreground text-sm mb-3">
                                        Quick responses for urgent queries.
                                    </p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="border-green-500/50 text-green-400 hover:bg-green-500/10"
                                        onClick={() => window.open("https://wa.me/917671862872?text=Hi, I have a query about SFitNex Hub", "_blank")}
                                    >
                                        Chat on WhatsApp
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Business Address Card */}
                    <Card className="bg-card/50 border-primary/20 hover:border-primary/40 transition-colors">
                        <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                                <div className="p-3 rounded-xl bg-purple-500/10">
                                    <MapPin className="w-6 h-6 text-purple-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg mb-1">Business Type</h3>
                                    <p className="text-muted-foreground text-sm mb-3">
                                        SFitNex Hub is an online-only digital fitness platform.
                                    </p>
                                    <p className="text-purple-400 text-sm">
                                        Operated Remotely | India
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Response Time Info */}
                <div className="text-center bg-muted/30 rounded-xl p-6 border border-border">
                    <h3 className="font-semibold mb-2">Expected Response Time</h3>
                    <p className="text-muted-foreground text-sm">
                        We typically respond to emails within <strong>24-48 hours</strong>. For urgent matters, please use WhatsApp or call us directly.
                    </p>
                </div>
            </Container>
        </div>
    );
}
