import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { streamChat } from "@/lib/streamChat";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const suggestedQuestions = [
  "What is SmartFit AI?",
  "How does AI training work?",
  "Is this good for beginners?",
  "What features do you offer?",
];

// Create notification sound using Web Audio API
const playNotificationSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (error) {
    console.log("Audio notification not supported");
  }
};

export const FloatingChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    const conversationHistory = messages
      .slice(-10)
      .map((m) => ({ role: m.role, content: m.content }));

    let assistantSoFar = "";

    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && prev.length > 0 && prev[prev.length - 2]?.content === text) {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    await streamChat({
      functionName: "smartfit-chatbot",
      message: text,
      conversationHistory,
      onDelta: (chunk) => upsertAssistant(chunk),
      onDone: () => {
        setIsLoading(false);
        playNotificationSound();
      },
      onError: (error) => {
        console.error("Chat error:", error);
        setIsLoading(false);
        const fallback: Message = {
          role: "assistant",
          content: "I'm having a moment! Please try again. 💪",
        };
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant" && !last.content) {
            return prev.map((m, i) => (i === prev.length - 1 ? fallback : m));
          }
          return [...prev, fallback];
        });
      },
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleClearHistory = () => {
    setMessages([]);
  };

  const handleSuggestion = (question: string) => {
    sendMessage(question);
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full shadow-[0_0_20px_rgba(0,255,156,0.4)]",
          "bg-gradient-to-br from-[#00FF9C] via-[#4CC9F0] to-[#7B2CBF]",
          "flex items-center justify-center transition-all duration-500",
          "border border-white/20 backdrop-blur-sm",
          isOpen && "scale-0 opacity-0 rotate-180"
        )}
        whileHover={{
          scale: 1.1,
          rotate: 5,
          boxShadow: "0 0 30px rgba(0,255,156,0.6)"
        }}
        whileTap={{ scale: 0.9 }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        aria-label="Open chat"
      >
        <div className="absolute inset-0 rounded-full bg-white/10 animate-pulse" />
        <Bot className="w-8 h-8 text-black drop-shadow-sm relative z-10" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#0a0a0a] z-20" />
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 100, scale: 0.8, filter: "blur(10px)" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={cn(
              "fixed bottom-6 right-6 z-50 w-[400px] max-w-[calc(100vw-2rem)]",
              "h-[650px] max-h-[calc(100vh-6rem)]",
              "bg-black/80 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.5)]",
              "flex flex-col overflow-hidden ring-1 ring-white/20"
            )}
          >
            {/* Dynamic Neon Border Glow */}
            <div className="absolute inset-0 rounded-[2rem] pointer-events-none opacity-20 bg-gradient-to-tr from-[#00FF9C]/20 via-transparent to-[#7B2CBF]/20" />

            {/* Header */}
            <div className="relative flex items-center justify-between p-6 border-b border-white/10 bg-white/5">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#00FF9C] to-[#4CC9F0] flex items-center justify-center rotate-3">
                    <Bot className="w-7 h-7 text-black -rotate-3" />
                  </div>
                  <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-black animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-white tracking-tight text-lg">SmartFit AI</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 font-bold uppercase tracking-widest border border-green-500/20">
                      Active
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {messages.length > 0 && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="hover:bg-red-500/10 hover:text-red-400 text-white/40 h-10 w-10 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-black/95 backdrop-blur-xl border-white/10 rounded-3xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-white text-xl">Reset Conversation?</AlertDialogTitle>
                        <AlertDialogDescription className="text-white/60">
                          This will clear all messages and reset the AI's context for this session.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="mt-2">
                        <AlertDialogCancel className="bg-white/5 border-white/10 text-white rounded-2xl hover:bg-white/10">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleClearHistory}
                          className="bg-red-500 hover:bg-red-600 text-white rounded-2xl border-none shadow-lg shadow-red-500/20"
                        >
                          Clear Now
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="hover:bg-white/10 text-white/40 hover:text-white h-10 w-10 transition-all"
                >
                  <X className="w-6 h-6" />
                </Button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-none">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#00FF9C]/20 to-[#4CC9F0]/20 flex items-center justify-center ring-1 ring-white/10"
                  >
                    <Sparkles className="w-10 h-10 text-[#00FF9C]" />
                  </motion.div>
                  <div className="space-y-2">
                    <h4 className="text-2xl font-bold text-white tracking-tight">
                      Elevate Your Journey
                    </h4>
                    <p className="text-sm text-white/40 max-w-[200px] mx-auto">
                      I'm your personal AI fitness strategist. How can we improve today?
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-2 w-full max-w-[260px]">
                    {suggestedQuestions.map((question, i) => (
                      <motion.button
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        onClick={() => handleSuggestion(question)}
                        className="text-xs text-left px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/5 hover:border-white/20 transition-all duration-300"
                      >
                        {question}
                      </motion.button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className={cn(
                        "flex items-end gap-2",
                        msg.role === "user" ? "flex-row-reverse" : "flex-row"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[85%] px-5 py-3.5 rounded-[1.5rem] text-[15px] leading-relaxed shadow-lg",
                          msg.role === "user"
                            ? "bg-gradient-to-br from-[#4CC9F0] to-[#7B2CBF] text-white rounded-br-none"
                            : "bg-white/10 text-white/90 border border-white/10 backdrop-blur-md rounded-bl-none"
                        )}
                      >
                        {msg.content}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start items-center gap-3"
                >
                  <div className="bg-white/5 border border-white/10 px-4 py-4 rounded-3xl rounded-bl-none">
                    <div className="flex gap-2">
                      <div className="w-2 h-2 bg-[#00FF9C] rounded-full animate-bounce [animation-duration:0.8s]" />
                      <div className="w-2 h-2 bg-[#4CC9F0] rounded-full animate-bounce [animation-delay:0.2s] [animation-duration:0.8s]" />
                      <div className="w-2 h-2 bg-[#7B2CBF] rounded-full animate-bounce [animation-delay:0.4s] [animation-duration:0.8s]" />
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <div className="p-6 bg-white/5 border-t border-white/10">
              <form
                onSubmit={handleSubmit}
                className="relative flex gap-3 items-center"
              >
                <div className="relative flex-1 group">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Message SmartFit AI..."
                    disabled={isLoading}
                    className={cn(
                      "w-full px-6 py-4 rounded-2xl text-sm transition-all",
                      "bg-white/5 border border-white/10 outline-none text-white",
                      "placeholder:text-white/30",
                      "focus:bg-white/10 focus:border-[#4CC9F0]/50 focus:ring-4 focus:ring-[#4CC9F0]/10",
                      "disabled:opacity-50"
                    )}
                  />
                  {!input && (
                    <Sparkles className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none group-focus-within:text-[#00FF9C]/50 transition-colors" />
                  )}
                </div>
                <Button
                  type="submit"
                  size="icon"
                  disabled={!input.trim() || isLoading}
                  className={cn(
                    "rounded-2xl w-14 h-14 shrink-0 transition-all duration-300",
                    input.trim()
                      ? "bg-[#00FF9C] text-black shadow-[0_0_20px_rgba(0,255,156,0.3)] hover:scale-105"
                      : "bg-white/10 text-white/30"
                  )}
                >
                  <Send className="w-6 h-6" />
                </Button>
              </form>
              <p className="text-[10px] text-center mt-4 text-white uppercase tracking-widest font-medium">
                Powered by SmartFit AI Advanced Neural Engine
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </>
  );
};
