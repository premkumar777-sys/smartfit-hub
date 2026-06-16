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

export const FloatingChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
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
          "fixed bottom-24 right-4 lg:bottom-6 lg:right-6 z-[60] w-16 h-16 rounded-2xl flex items-center justify-center",
          "bg-[#0a0a0a]/90 border border-white/10 backdrop-blur-md shadow-2xl",
          isOpen && "scale-0 opacity-0 rotate-180"
        )}
        whileHover={{
          scale: 1.08,
          borderColor: "rgba(0, 255, 156, 0.4)",
        }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        aria-label="Open chat"
      >
        {/* Animated breathing glow rings */}
        <div className="absolute -inset-[3px] rounded-2xl bg-gradient-to-tr from-[#00FF9C] via-[#4CC9F0] to-[#7B2CBF] opacity-70 blur-[3px] animate-pulse" />
        
        {/* Inner containment card */}
        <div className="absolute inset-[1px] rounded-[13px] bg-[#0a0a0a] z-0" />
        
        {/* Logo containing orb */}
        <div className="relative z-10 w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center p-1.5 overflow-hidden shadow-inner group">
          <img 
            src="/favicon.png" 
            alt="SmartFitAI Chatbot Launcher" 
            className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(0,255,156,0.6)] transform group-hover:scale-110 transition-transform duration-300"
          />
          {/* Subtle reflection overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
        </div>

        {/* Online Status Dot */}
        <span className="absolute -top-1 -right-1 flex h-4 w-4 z-20">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500 border-2 border-[#0a0a0a]" />
        </span>
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
              "fixed bottom-24 right-4 lg:bottom-6 lg:right-6 z-[60] w-[400px] max-w-[calc(100vw-2rem)]",
              "h-[550px] max-h-[calc(100vh-10rem)]",
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
                  <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center p-1.5 rotate-3 overflow-hidden shadow-inner">
                    <img src="/favicon.png" alt="SmartFitAI Logo" className="w-full h-full object-contain -rotate-3" />
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
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-none">
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
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        onClick={() => handleSuggestion(question)}
                        className="text-xs text-left px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/5 hover:border-[#00FF9C]/30 hover:shadow-[0_0_15px_rgba(0,255,156,0.15)] transition-all duration-300 relative group overflow-hidden"
                      >
                        <span className="absolute left-0 top-0 h-full w-[3px] bg-[#00FF9C] scale-y-0 group-hover:scale-y-100 transition-transform origin-top duration-300" />
                        <span className="pl-1.5">{question}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 12, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.3 }}
                      className={cn(
                        "flex items-start gap-3 my-2",
                        msg.role === "user" ? "flex-row-reverse" : "flex-row"
                      )}
                    >
                      {/* Avatar */}
                      <div className={cn(
                        "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border shadow-md",
                        msg.role === "user" 
                          ? "bg-gradient-to-br from-[#4CC9F0] to-primary border-white/20 text-white font-black text-xs" 
                          : "bg-white/5 border-white/15 p-1"
                      )}>
                        {msg.role === "user" ? (
                          "ME"
                        ) : (
                          <img src="/favicon.png" alt="SmartFitAI Avatar" className="w-full h-full object-contain" />
                        )}
                      </div>
                      
                      {/* Message Bubble */}
                      <div
                        className={cn(
                          "max-w-[78%] px-5 py-3.5 rounded-2xl text-[14px] leading-relaxed shadow-lg",
                          msg.role === "user"
                            ? "bg-gradient-to-br from-[#4CC9F0] via-primary to-[#7B2CBF] text-white rounded-tr-none"
                            : "bg-white/5 text-white/90 border border-white/10 backdrop-blur-md rounded-tl-none"
                        )}
                      >
                        {msg.role === "user" ? (
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        ) : (
                          <div className="space-y-1">
                            {formatMessageContent(msg.content)}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start items-center gap-3 my-2"
                >
                  {/* Avatar placeholder */}
                  <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/15 flex items-center justify-center shrink-0 p-1 shadow-md animate-pulse">
                    <img src="/favicon.png" alt="SmartFitAI" className="w-full h-full object-contain opacity-50" />
                  </div>
                  <div className="bg-white/5 border border-white/10 px-4 py-3 rounded-2xl rounded-tl-none backdrop-blur-md">
                    <div className="flex gap-1.5 items-center py-1">
                      <span className="w-1.5 h-1.5 bg-[#00FF9C] rounded-full animate-bounce [animation-duration:0.8s]" />
                      <span className="w-1.5 h-1.5 bg-[#4CC9F0] rounded-full animate-bounce [animation-delay:0.15s] [animation-duration:0.8s]" />
                      <span className="w-1.5 h-1.5 bg-[#7B2CBF] rounded-full animate-bounce [animation-delay:0.3s] [animation-duration:0.8s]" />
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
