import { useState, useRef, useEffect } from "react";
import { 
  X, 
  Send, 
  Trash2,
  Dumbbell,
  Apple,
  MapPin,
  ArrowRight
} from "lucide-react";
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

// Simple, clean, professional recommendations
const simpleRecommendations = [
  {
    title: "Workout & Fitness Plan",
    subtitle: "Design a personalized workout routine",
    prompt: "Create a personalized weekly workout routine for me",
  },
  {
    title: "Diet & Nutrition Guide",
    subtitle: "Meal suggestions & nutrition advice",
    prompt: "Suggest a healthy nutrition and meal plan for my goals",
  },
  {
    title: "Explore Gyms & Features",
    subtitle: "Find partner gyms & book slots",
    prompt: "Help me find top rated gyms and explain SmartFit features",
  }
];

// Create notification sound using Web Audio API
const playNotificationSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const audioContext = new AudioContextClass();
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

    setTimeout(() => {
      audioContext.close().catch(() => {});
    }, 400);
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
        <strong key={`bold-${keyIdx++}`} className="font-extrabold text-[#22CC66]">
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

  const scrollToBottom = (behavior: ScrollBehavior = "smooth", force = false) => {
    requestAnimationFrame(() => {
      if (chatContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
        const isCloseToBottom = scrollHeight - scrollTop - clientHeight < 30;
        if (force || isCloseToBottom) {
          chatContainerRef.current.scrollTo({
            top: scrollHeight,
            behavior
          });
        }
      }
    });
  };

  useEffect(() => {
    if (messages.length === 0) return;
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role === "user") {
      scrollToBottom("smooth", true);
    } else {
      scrollToBottom("auto", false);
    }
  }, [messages]);

  useEffect(() => {
    const isTouchOrMobile = window.innerWidth < 640 || ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    if (isOpen && inputRef.current && !isTouchOrMobile) {
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
      assistantSoFar += chunk.replace(/\p{Emoji_Presentation}|\p{Extended_Pictographic}/gu, "");
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
          content: "I'm having a moment! Please try again.",
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

  return (
    <>
      {/* Floating Trigger Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-24 right-4 lg:bottom-6 lg:right-6 z-[60] w-12 h-12 lg:w-16 lg:h-16 rounded-xl lg:rounded-2xl flex items-center justify-center",
          "bg-[#0a0a0a]/90 border border-white/10 backdrop-blur-md shadow-2xl",
          isOpen && "scale-0 opacity-0 rotate-180"
        )}
        whileHover={{
          scale: 1.08,
          borderColor: "rgba(34, 204, 102, 0.4)",
        }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        aria-label="Open chat"
      >
        <div className="absolute -inset-[3px] rounded-xl lg:rounded-2xl bg-gradient-to-tr from-[#22CC66] via-[#38BDF8] to-[#818CF8] opacity-70 blur-[3px] animate-pulse" />
        <div className="absolute inset-[1px] rounded-[11px] lg:rounded-[13px] bg-[#0a0a0a] z-0" />
        
        <div className="relative z-10 w-8 h-8 lg:w-11 lg:h-11 rounded-lg lg:rounded-xl bg-white/5 border border-white/10 flex items-center justify-center p-1 lg:p-1.5 overflow-hidden shadow-inner group">
          <img 
            src="/favicon.png" 
            alt="SmartFitAI Chatbot Launcher" 
            className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(34,204,102,0.6)] transform group-hover:scale-110 transition-transform duration-300"
          />
        </div>

        <span className="absolute -top-1 -right-1 flex h-4 w-4 z-20">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500 border-2 border-[#0a0a0a]" />
        </span>
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 280 }}
            className={cn(
              "fixed bottom-0 right-0 left-0 sm:bottom-6 sm:right-6 sm:left-auto z-[60]",
              "w-full sm:w-[420px] sm:max-w-[calc(100vw-2rem)]",
              "h-[88dvh] sm:h-[540px] sm:max-h-[calc(100vh-8rem)]",
              "bg-[#0d0f17]/95 backdrop-blur-xl sm:backdrop-blur-2xl border-t border-x border-white/10 sm:border rounded-t-[2rem] sm:rounded-[2rem] shadow-[0_0_60px_rgba(0,0,0,0.85)]",
              "flex flex-col overflow-hidden ring-0 sm:ring-1 ring-white/20 transform-gpu"
            )}
          >
            {/* Header */}
            <div className="relative flex items-center justify-between p-4 sm:p-5 border-b border-white/10 bg-white/[0.03]">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center p-1.5 overflow-hidden shadow-inner">
                    <img src="/favicon.png" alt="SmartFitAI Logo" className="w-full h-full object-contain" />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#22CC66] rounded-full border-2 border-black animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-white tracking-tight text-base">SmartFit AI Assistant</h3>
                  <p className="text-xs text-gray-400">Personalized Fitness & Nutrition Advisor</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {messages.length > 0 && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="hover:bg-red-500/10 hover:text-red-400 text-white/40 h-9 w-9 transition-colors"
                        title="Clear history"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-[#121318] border-white/10 rounded-3xl">
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
                  className="hover:bg-white/10 text-white/40 hover:text-white h-9 w-9 transition-all"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Messages Body */}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 custom-scrollbar">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-4 space-y-5">
                  <div className="text-center space-y-1">
                    <h4 className="text-lg font-bold text-white tracking-tight">
                      How can I help you today?
                    </h4>
                    <p className="text-xs text-gray-400">
                      Select a recommendation below or type your message.
                    </p>
                  </div>

                  {/* Clean 3 Recommendation Cards */}
                  <div className="w-full space-y-2.5">
                    {simpleRecommendations.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => sendMessage(item.prompt)}
                        className="w-full px-4 py-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 hover:border-[#22CC66]/50 text-left transition-all duration-200 flex items-center justify-between group"
                      >
                        <div>
                          <p className="text-xs font-semibold text-white group-hover:text-[#22CC66] transition-colors">
                            {item.title}
                          </p>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            {item.subtitle}
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-[#22CC66] group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.25 }}
                      className={cn(
                        "flex items-start gap-2.5",
                        msg.role === "user" ? "flex-row-reverse" : "flex-row"
                      )}
                    >
                      {/* Avatar */}
                      <div className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border shadow-md mt-0.5",
                        msg.role === "user" 
                          ? "bg-[#22CC66] border-[#22CC66] text-black font-bold text-[10px]" 
                          : "bg-white/5 border-white/15 p-1"
                      )}>
                        {msg.role === "user" ? (
                          "YOU"
                        ) : (
                          <img src="/favicon.png" alt="SmartFitAI Avatar" className="w-full h-full object-contain" />
                        )}
                      </div>
                      
                      {/* Message Content */}
                      <div
                        className={cn(
                          "max-w-[82%] px-4 py-3 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-lg",
                          msg.role === "user"
                            ? "bg-[#22CC66] text-black font-medium rounded-tr-none"
                            : "bg-[#181a22] text-gray-100 border border-white/10 rounded-tl-none"
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
                  className="flex justify-start items-center gap-2.5 my-2"
                >
                  <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/15 flex items-center justify-center shrink-0 p-1 shadow-md animate-pulse">
                    <img src="/favicon.png" alt="SmartFitAI" className="w-full h-full object-contain opacity-50" />
                  </div>
                  <div className="bg-[#181a22] border border-white/10 px-4 py-2.5 rounded-2xl rounded-tl-none">
                    <div className="flex gap-1.5 items-center py-1">
                      <span className="w-1.5 h-1.5 bg-[#22CC66] rounded-full animate-bounce [animation-duration:0.8s]" />
                      <span className="w-1.5 h-1.5 bg-[#38BDF8] rounded-full animate-bounce [animation-delay:0.15s] [animation-duration:0.8s]" />
                      <span className="w-1.5 h-1.5 bg-[#818CF8] rounded-full animate-bounce [animation-delay:0.3s] [animation-duration:0.8s]" />
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <div className="p-3 sm:p-4 bg-[#0a0b0e] border-t border-white/10">
              <form
                onSubmit={handleSubmit}
                className="relative flex gap-2 items-center"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  disabled={isLoading}
                  className={cn(
                    "w-full px-4 py-3 rounded-xl text-xs sm:text-sm transition-all",
                    "bg-[#14161f] border border-white/10 outline-none text-white",
                    "placeholder:text-gray-500",
                    "focus:bg-[#181a24] focus:border-[#22CC66]/50 focus:ring-1 focus:ring-[#22CC66]/30",
                    "disabled:opacity-50"
                  )}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!input.trim() || isLoading}
                  className={cn(
                    "rounded-xl w-11 h-11 shrink-0 transition-all duration-200",
                    input.trim()
                      ? "bg-[#22CC66] text-black hover:bg-[#1fb85a] shadow-[0_0_15px_rgba(34,204,102,0.3)]"
                      : "bg-white/10 text-gray-500"
                  )}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
