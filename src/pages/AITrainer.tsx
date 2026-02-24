import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/Container";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, Bot, User, Dumbbell, Heart, Flame, Apple, Target, Loader2, Zap } from "lucide-react";
import { streamChat } from "@/lib/streamChat";
import { toast } from "sonner";
import { useGamification, XP_REWARDS } from "@/hooks/useGamification";

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


export default function AITrainer() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "welcome",
            role: "assistant",
            content: "Hey there! 💪 I'm your AI Personal Trainer. I'm here to help you with workout tips, form guidance, nutrition advice, and anything fitness-related. What would you like to know today?",
            timestamp: new Date(),
        },
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const gamification = useGamification();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const sendMessage = async (content: string) => {
        if (!content.trim() || isLoading) return;

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
            assistantSoFar += chunk;
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
                toast.error("Something went wrong. Please try again.");
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
        <div className="min-h-screen py-16 relative overflow-hidden">
            <div className="absolute inset-0 gradient-hero opacity-15" />
            <Container className="relative z-10 h-[calc(100vh-8rem)] flex flex-col">
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
                        <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center">
                            <Bot className="w-8 h-8 text-white" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-gray-900" />
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
                            className="gap-2"
                            onClick={() => handleQuickAction(action.prompt)}
                            disabled={isLoading}
                        >
                            <action.icon className="w-4 h-4" />
                            {action.label}
                        </Button>
                    ))}
                </div>

                <Card className="flex-1 glass border-primary/20 flex flex-col overflow-hidden h-full">
                    <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                            >
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${message.role === "user"
                                        ? "bg-primary/20 text-primary"
                                        : "gradient-primary text-white"
                                        }`}
                                >
                                    {message.role === "user" ? (
                                        <User className="w-4 h-4" />
                                    ) : (
                                        <Bot className="w-4 h-4" />
                                    )}
                                </div>
                                <div
                                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${message.role === "user"
                                        ? "bg-primary text-primary-foreground rounded-br-sm"
                                        : "bg-gray-800/80 text-foreground rounded-bl-sm"
                                        }`}
                                >
                                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                    <p className="text-xs opacity-50 mt-1">
                                        {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                    </p>
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center">
                                    <Bot className="w-4 h-4 text-white" />
                                </div>
                                <div className="bg-gray-800/80 rounded-2xl rounded-bl-sm px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span className="text-sm text-muted-foreground">Thinking...</span>
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
                                className="flex-1"
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
