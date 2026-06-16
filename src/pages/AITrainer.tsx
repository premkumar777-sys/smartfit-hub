import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/Container";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, Bot, User, Dumbbell, Heart, Flame, Apple, Target, Loader2, Zap } from "lucide-react";
import { streamChat } from "@/lib/streamChat";
import { toast } from "sonner";
import { useGamification, XP_REWARDS } from "@/hooks/useGamification";
import { supabase } from "@/integrations/supabase/client";

type Message = {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
};

const quickActions = [
    { icon: Dumbbell, label: "Workout Tips", prompt: "Give me 5 quick workout tips for beginners" },
    { icon: Heart, label: "Form Check", prompt: "How do I maintain proper form during squats?" },
    { icon: Flame, label: "Burn Fat", prompt: "What's the best workout routine to burn fat quickly?" },
    { icon: Apple, label: "Nutrition", prompt: "What should I eat before and after a workout?" },
    { icon: Target, label: "Build Muscle", prompt: "How can I build muscle at home without equipment?" },
];


const parseInlineMarkdown = (text: string) => {
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let keyIdx = 0;
    
    while (remaining.length > 0) {
        const boldMatch = remaining.match(/\*\*(.*?)\*\*/);
        if (boldMatch && boldMatch.index !== undefined) {
            if (boldMatch.index > 0) {
                parts.push(remaining.substring(0, boldMatch.index));
            }
            parts.push(
                <strong key={`bold-${keyIdx++}`} className="font-extrabold text-[#00FF9C]">
                    {boldMatch[1]}
                </strong>
            );
            remaining = remaining.substring(boldMatch.index + boldMatch[0].length);
        } else {
            parts.push(remaining);
            break;
        }
    }
    return parts.length > 0 ? parts : text;
};

const formatMessageContent = (text: string) => {
    if (!text) return null;
    const lines = text.split("\n");
    
    return lines.map((line, idx) => {
        // Headings
        if (line.startsWith("### ")) {
            return (
                <h4 key={idx} className="font-bold text-sm text-white mt-3 mb-1 first:mt-0">
                    {line.slice(4)}
                </h4>
            );
        }
        if (line.startsWith("## ")) {
            return (
                <h3 key={idx} className="font-extrabold text-base text-white mt-4 mb-2 first:mt-0">
                    {line.slice(3)}
                </h3>
            );
        }
        if (line.startsWith("# ")) {
            return (
                <h2 key={idx} className="font-black text-lg text-white mt-4 mb-2 first:mt-0">
                    {line.slice(2)}
                </h2>
            );
        }
        
        // Lists
        const listMatch = line.match(/^[\*\-\+]\s+(.*)/);
        if (listMatch) {
            return (
                <ul key={idx} className="list-disc list-inside ml-2 my-1 text-white/95">
                    <li className="leading-relaxed">{parseInlineMarkdown(listMatch[1])}</li>
                </ul>
            );
        }
        
        const numberedMatch = line.match(/^\d+\.\s+(.*)/);
        if (numberedMatch) {
            return (
                <ol key={idx} className="list-decimal list-inside ml-2 my-1 text-white/95">
                    <li className="leading-relaxed">{parseInlineMarkdown(numberedMatch[1])}</li>
                </ol>
            );
        }
        
        // Paragraph
        return (
            <p key={idx} className="my-1 leading-relaxed break-words min-h-[0.5rem]">
                {parseInlineMarkdown(line)}
            </p>
        );
    });
};

export default function AITrainer() {
    const navigate = useNavigate();
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "welcome",
            role: "assistant",
            content: "Hey there! I'm your AI Personal Trainer. I'm here to help you with workout tips, form guidance, nutrition advice, and anything fitness-related. What would you like to know today?",
            timestamp: new Date(),
        },
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const gamification = useGamification();

    const scrollToBottom = (behavior: ScrollBehavior = "smooth", force = false) => {
        if (chatContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
            const isCloseToBottom = scrollHeight - scrollTop - clientHeight < 120;
            if (force || isCloseToBottom) {
                chatContainerRef.current.scrollTo({
                    top: scrollHeight,
                    behavior
                });
            }
        }
    };

    useEffect(() => {
        if (messages.length <= 1) return;
        const lastMessage = messages[messages.length - 1];
        if (lastMessage.role === "user") {
            scrollToBottom("smooth", true);
        } else {
            scrollToBottom("auto", false);
        }
    }, [messages]);

    const sendMessage = async (content: string) => {
        if (!content.trim() || isLoading) return;

        // Check authentication first
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            toast.error("Please sign in or create an account to chat with the AI Trainer.");
            navigate("/auth", { state: { returnUrl: "/ai-trainer" } });
            return;
        }

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: content.trim(),
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        const conversationHistory = messages
            .slice(-6)
            .map((m) => ({ role: m.role, content: m.content }));

        let assistantSoFar = "";
        const assistantId = (Date.now() + 1).toString();

        const upsertAssistant = (chunk: string) => {
            assistantSoFar += chunk.replace(/\p{Emoji_Presentation}|\p{Extended_Pictographic}/gu, "");
            const msg: Message = {
                id: assistantId,
                role: "assistant",
                content: assistantSoFar,
                timestamp: new Date(),
            };
            setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.id === assistantId) {
                    return prev.map((m, i) => (i === prev.length - 1 ? msg : m));
                }
                return [...prev, msg];
            });
        };

        await streamChat({
            functionName: "ai-chat",
            message: content,
            conversationHistory,
            onDelta: (chunk) => upsertAssistant(chunk),
            onDone: () => {
                setIsLoading(false);
                gamification.recordChatSession();
                inputRef.current?.focus();
            },
            onError: (err) => {
                console.error("Chat error:", err);
                setIsLoading(false);
                const errorMessage = err.message || "";
                if (errorMessage.includes("token") || errorMessage.includes("401") || errorMessage.includes("non-2xx") || errorMessage.includes("Unauthorized")) {
                    toast.error("Please sign in or create an account to chat with the AI Trainer.");
                    navigate("/auth", { state: { returnUrl: "/ai-trainer" } });
                } else {
                    toast.error(errorMessage || "Something went wrong. Please try again.");
                }
                inputRef.current?.focus();
            },
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        sendMessage(input);
    };

    const handleQuickAction = (prompt: string) => {
        sendMessage(prompt);
    };

    return (
        <div className="min-h-screen pt-4 pb-28 lg:py-16 relative overflow-hidden">
            <div className="absolute inset-0 gradient-hero opacity-15" />
            <Container className="relative z-10 h-[calc(100vh-11rem)] h-[calc(100dvh-11rem)] lg:h-[calc(100vh-8rem)] flex flex-col">
                <Link
                    to="/"
                    className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                </Link>

                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center p-2 shadow-lg">
                            <img src="/favicon.png" alt="SmartFitAI Logo" className="w-full h-full object-contain" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-gray-900 animate-pulse" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">SmartFit AI Trainer</h1>
                        <p className="text-sm text-muted-foreground">Your personal fitness coach, available 24/7</p>
                    </div>
                </div>

                {/* Chat Area */}
                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2 mb-4">
                    {quickActions.map((action) => (
                        <Button
                            key={action.label}
                            variant="outline"
                            size="sm"
                            className="gap-2 bg-white/5 border-white/10 hover:border-[#00FF9C]/30 hover:bg-[#00FF9C]/5 hover:text-white transition-all duration-300 rounded-xl"
                            onClick={() => handleQuickAction(action.prompt)}
                            disabled={isLoading}
                        >
                            <action.icon className="w-4 h-4 text-[#00FF9C]" />
                            {action.label}
                        </Button>
                    ))}
                </div>

                <Card className="flex-1 glass border-primary/20 flex flex-col overflow-hidden w-full min-w-0 h-full">
                    <CardContent ref={chatContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 w-full">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex gap-3 my-2 items-start ${message.role === "user" ? "flex-row-reverse" : ""}`}
                            >
                                <div
                                    className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 border shadow-md ${message.role === "user"
                                        ? "bg-gradient-to-br from-[#4CC9F0] to-primary border-white/20 text-white font-black text-xs"
                                        : "bg-white/5 border-white/15 p-1"
                                        }`}
                                >
                                    {message.role === "user" ? (
                                        "ME"
                                    ) : (
                                        <img src="/favicon.png" alt="SmartFitAI Avatar" className="w-full h-full object-contain" />
                                    )}
                                </div>
                                <div
                                    className={`max-w-[78%] rounded-2xl px-5 py-3.5 shadow-lg ${message.role === "user"
                                        ? "bg-gradient-to-br from-[#4CC9F0] via-primary to-[#7B2CBF] text-white rounded-tr-none"
                                        : "bg-white/5 text-white/90 border border-white/10 backdrop-blur-md rounded-tl-none"
                                        }`}
                                >
                                    {message.role === "user" ? (
                                        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                                    ) : (
                                        <div className="text-sm space-y-1">
                                            {formatMessageContent(message.content)}
                                        </div>
                                    )}
                                    <p className="text-[10px] opacity-40 mt-2 text-right">
                                        {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                    </p>
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex gap-3 my-2 items-start">
                                <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/15 flex items-center justify-center shrink-0 p-1 shadow-md animate-pulse">
                                    <img src="/favicon.png" alt="SmartFitAI" className="w-full h-full object-contain opacity-50" />
                                </div>
                                <div className="bg-white/5 border border-[#00FF9C]/20 rounded-2xl rounded-tl-none px-4 py-3 backdrop-blur-md">
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin text-[#00FF9C]" />
                                        <span className="text-sm text-muted-foreground">Formulating response...</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </CardContent>

                    {/* Input Area */}
                    <div className="p-4 border-t border-gray-800">
                        <form onSubmit={handleSubmit} className="flex gap-2">
                            <Input
                                ref={inputRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask me anything about fitness..."
                                className="flex-1 text-base"
                                disabled={isLoading}
                            />
                            <Button type="submit" variant="hero" disabled={isLoading || !input.trim()}>
                                <Send className="w-4 h-4" />
                            </Button>
                        </form>
                    </div>
                </Card>
            </Container>
        </div>
    );
}
