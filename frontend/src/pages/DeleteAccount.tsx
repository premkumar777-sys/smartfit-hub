import { useState, useEffect } from "react";
import { Container } from "@/components/Container";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Trash2, Mail, Clock, ShieldAlert, AlertTriangle, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function DeleteAccount() {
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [confirmPhrase, setConfirmPhrase] = useState("");
    const [password, setPassword] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const checkUser = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                setUser(user);
            } catch (err) {
                console.error("Auth check failed:", err);
            } finally {
                setLoading(false);
            }
        };
        checkUser();
    }, []);

    const handleDeleteAccount = async () => {
        const isPhraseValid = confirmPhrase.trim().toUpperCase() === "DELETE";
        if (!isPhraseValid && !password) {
            toast.error('Please type "DELETE" or enter your password to confirm.');
            return;
        }

        setIsDeleting(true);
        try {
            const { data, error } = await supabase.functions.invoke("delete-user-account", {
                body: {
                    confirmationPhrase: isPhraseValid ? "DELETE" : undefined,
                    password: password || undefined,
                },
            });

            if (error) throw error;
            if (data?.error) throw new Error(data.error);

            localStorage.removeItem("smartfit_biometric_active_user");
            sessionStorage.removeItem("smartfit_checkin_prompted");
            await supabase.auth.signOut();
            localStorage.clear();
            toast.success("Your SmartFit AI account and data have been permanently deleted.");
            navigate("/");
        } catch (err: any) {
            console.error("Deletion failed:", err);
            toast.error(err.message || "Deletion failed. Please contact support.");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="min-h-screen pb-20 bg-background" style={{ paddingTop: 'calc(var(--header-height) + 1.5rem)' }}>
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
                    <h1 className="text-3xl md:text-4xl font-bold">Delete Account & Data</h1>
                </div>

                <p className="text-muted-foreground mb-8">
                    Compliant with Google Play & Global Data Privacy Regulations • Last updated: May 2026
                </p>

                {/* Self-Serve In-App / Web Deletion Card */}
                <div className="bg-destructive/10 border border-destructive/30 rounded-3xl p-6 sm:p-8 mb-8 relative overflow-hidden">
                    <div className="flex items-start gap-4">
                        <ShieldAlert className="w-8 h-8 text-destructive flex-shrink-0 mt-1" />
                        <div className="flex-1">
                            <h2 className="font-bold text-xl text-white mb-2">Automated Self-Serve Account Deletion</h2>
                            <p className="text-gray-300 text-sm leading-relaxed mb-6">
                                In compliance with Google Play Developer Policy, you can permanently delete your SmartFit AI account, AI workout logs, nutrition history, and all stored biometrics directly without waiting for manual support.
                            </p>

                            {loading ? (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                    <span>Verifying account status...</span>
                                </div>
                            ) : user ? (
                                <div className="bg-black/40 border border-destructive/20 rounded-2xl p-5 space-y-4">
                                    <div className="flex items-center justify-between text-xs sm:text-sm text-gray-300">
                                        <span>Signed in as:</span>
                                        <strong className="text-white font-mono">{user.email}</strong>
                                    </div>

                                    <div className="p-3 rounded-xl bg-destructive/15 border border-destructive/30 text-xs text-red-200 flex items-start gap-2">
                                        <AlertTriangle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                                        <span>Type <strong className="text-white font-mono bg-red-950/80 px-1 py-0.5 rounded">DELETE</strong> below or enter your password to permanently erase your profile.</span>
                                    </div>

                                    <div className="grid sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs text-gray-400 block mb-1">Confirmation Phrase</label>
                                            <input
                                                type="text"
                                                placeholder='Type "DELETE"'
                                                value={confirmPhrase}
                                                onChange={(e) => setConfirmPhrase(e.target.value)}
                                                disabled={isDeleting}
                                                className="w-full h-11 px-3.5 rounded-xl bg-black/60 border border-white/10 text-white text-sm focus:border-red-500 focus:outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-400 block mb-1">Account Password (Optional)</label>
                                            <input
                                                type="password"
                                                placeholder="Enter password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                disabled={isDeleting}
                                                className="w-full h-11 px-3.5 rounded-xl bg-black/60 border border-white/10 text-white text-sm focus:border-red-500 focus:outline-none"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        disabled={isDeleting}
                                        onClick={handleDeleteAccount}
                                        className="w-full h-12 rounded-xl bg-destructive hover:bg-destructive/90 disabled:opacity-50 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(239,68,68,0.4)] cursor-pointer"
                                    >
                                        {isDeleting ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                <span>Purging Account & Data...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Trash2 className="w-4 h-4" />
                                                <span>Permanently Delete My Account Now</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            ) : (
                                <div className="bg-black/30 border border-white/10 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <div className="text-sm text-gray-300 text-center sm:text-left">
                                        Sign in to instantly purge your account and all associated data.
                                    </div>
                                    <Link
                                        to="/auth?returnUrl=/delete-account"
                                        className="h-10 px-5 rounded-xl bg-destructive text-white font-semibold text-xs flex items-center justify-center hover:bg-destructive/90 transition-colors shrink-0"
                                    >
                                        Sign In to Delete
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Key Information Cards */}
                <div className="grid md:grid-cols-3 gap-4 mb-8">
                    <Card className="bg-card/50 border-destructive/20 relative overflow-hidden group hover:border-destructive/40 transition-all duration-300">
                        <CardContent className="p-5 text-center flex flex-col items-center justify-center min-h-[140px]">
                            <Trash2 className="w-8 h-8 text-destructive mb-3" />
                            <h3 className="font-semibold mb-1">Instant In-App</h3>
                            <p className="text-xs text-muted-foreground">Immediate automated deletion</p>
                        </CardContent>
                    </Card>
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
                            <h3 className="font-semibold mb-1">Manual Timeline</h3>
                            <p className="text-xs text-muted-foreground">Within 7 business days</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Detailed Steps & Policy */}
                <div className="prose prose-invert prose-green max-w-none space-y-8">
                    <section className="bg-card/30 border border-border/50 rounded-xl p-6">
                        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                            <span className="text-destructive">1.</span> Scope of Data Deletion
                        </h2>
                        <p className="text-gray-300 leading-relaxed mb-3">
                            When your account is deleted, the following associated data is permanently purged from our servers:
                        </p>
                        <ul className="list-disc list-inside text-gray-300 space-y-2 ml-2">
                            <li>Profile information (email, username, avatar photo)</li>
                            <li>Personal health metrics, body weight, and fitness targets</li>
                            <li>AI-generated workout logs, rep counts, and exercise history</li>
                            <li>Nutrition meal photos, ingredient logs, and macro tracking data</li>
                            <li>Push notification subscriptions and device tokens</li>
                            <li>Cookie consent records and application preferences</li>
                        </ul>
                    </section>

                    <section className="bg-card/30 border border-border/50 rounded-xl p-6">
                        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                            <span className="text-destructive">2.</span> Data Retention Exceptions
                        </h2>
                        <p className="text-gray-300 leading-relaxed">
                            Under tax, fraud-prevention, and legal compliance regulations, financial transaction records (Stripe/Instamojo payment receipts and invoice timestamps) may be retained for the minimum statutory period required by law.
                        </p>
                    </section>
                </div>
            </Container>
        </div>
    );
}
