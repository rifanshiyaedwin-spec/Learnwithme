import React, { useState, useRef, useEffect } from "react";
import { generateChatResponse } from "@/lib/gemini";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Play, Send, Loader2, Volume2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

type Message = {
  id: string;
  role: "user" | "model";
  text: string;
};

export default function App() {
  const [language, setLanguage] = useState("");
  const [isStarted, setIsStarted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!language.trim()) return;
    setIsStarted(true);
    setIsLoading(true);

    try {
      const initialMessage = "Hello, I am ready to start my first lesson.";
      const response = await generateChatResponse(language, [], initialMessage);
      setMessages([
        { id: Date.now().toString() + "-user", role: "user", text: initialMessage },
        { id: Date.now().toString() + "-model", role: "model", text: response || "Let's begin." },
      ]);
      speak(response || "Let's begin.", language);
    } catch (error) {
      console.error("Failed to start lesson:", error);
      setMessages([
        { id: Date.now().toString(), role: "model", text: "Sorry, there was an error starting the lesson. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    
    const newMessages: Message[] = [
      ...messages,
      { id: Date.now().toString(), role: "user", text: userMessage },
    ];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const history = messages.map((m) => ({
        role: m.role,
        parts: [{ text: m.text }],
      }));

      const response = await generateChatResponse(language, history, userMessage);
      
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: "model", text: response || "..." },
      ]);
      speak(response || "...", language);
    } catch (error) {
      console.error("Failed to send message:", error);
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: "model", text: "Sorry, I encountered an error. Could you repeat that?" },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const speak = (text: string, lang: string) => {
    if ("speechSynthesis" in window) {
      // Basic language code mapping
      const langMap: Record<string, string> = {
        spanish: "es-ES",
        french: "fr-FR",
        german: "de-DE",
        italian: "it-IT",
        japanese: "ja-JP",
        korean: "ko-KR",
        chinese: "zh-CN",
        russian: "ru-RU",
        portuguese: "pt-BR",
        hindi: "hi-IN",
      };
      
      const langCode = langMap[lang.trim().toLowerCase()] || "en-US";
      
      // Stop any current speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = langCode;
      utterance.rate = 0.9; // Slightly slower for learning
      
      window.speechSynthesis.speak(utterance);
    }
  };

  if (!isStarted) {
    return (
      <div className="min-h-screen bg-[#003057] flex items-center justify-center p-4 font-sans">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card className="border-none shadow-[0_40px_100px_rgba(0,0,0,0.4)] rounded-[24px] overflow-hidden bg-[#F8F9FA]">
            <div className="bg-[#003057] p-8 text-center">
              <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">PIMSLEUR</h1>
              <p className="text-white/80 font-medium">Language Learning Simulation</p>
            </div>
            <CardContent className="p-8">
              <form onSubmit={handleStart} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="language" className="text-sm font-semibold text-[#65676B] uppercase tracking-wider">
                    I want to learn
                  </label>
                  <Input
                    id="language"
                    placeholder="e.g., Spanish, Hindi, French..."
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="h-14 text-lg px-4 bg-white border-[#E4E6EB] focus-visible:ring-[#0076D6] text-[#1A1A1B]"
                    autoFocus
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-14 text-lg font-semibold bg-[#0076D6] hover:bg-[#0060B0] text-white rounded-xl transition-all shadow-[0_12px_24px_rgba(0,118,214,0.3)]"
                  disabled={!language.trim() || isLoading}
                >
                  {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Start Lesson"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#003057] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-[900px] h-[80vh] min-h-[600px] bg-[#F8F9FA] rounded-[24px] flex flex-col overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.4)]">
        {/* Header */}
        <header className="bg-white border-b border-[#E4E6EB] px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#003057] rounded-full flex items-center justify-center">
              <Volume2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-[#1A1A1B] leading-tight">PIMSLEUR</h1>
              <p className="text-xs font-semibold text-[#65676B] uppercase tracking-wider">{language} Lesson 1</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setIsStarted(false)} className="text-[#65676B] hover:text-[#1A1A1B] hover:bg-[#E4E6EB]">
            End Lesson
          </Button>
        </header>

        {/* Chat Area */}
        <ScrollArea className="flex-1 p-4 md:p-6 bg-[#F8F9FA]">
          <div className="max-w-2xl mx-auto space-y-6 pb-20">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <Avatar className={`w-10 h-10 border-2 ${msg.role === "model" ? "border-[#0076D6]" : "border-[#E4E6EB]"}`}>
                    <AvatarFallback className={msg.role === "model" ? "bg-[#0076D6] text-white" : "bg-[#E4E6EB] text-[#65676B]"}>
                      {msg.role === "model" ? "AI" : "ME"}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={`relative max-w-[80%] rounded-2xl px-5 py-4 ${
                      msg.role === "user"
                        ? "bg-[#003057] text-white rounded-tr-sm"
                        : "bg-white text-[#1A1A1B] shadow-sm border border-[#E4E6EB] rounded-tl-sm"
                    }`}
                  >
                    <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    {msg.role === "model" && (
                      <button 
                        onClick={() => speak(msg.text, language)}
                        className="absolute -bottom-3 -right-3 w-8 h-8 bg-white border border-[#E4E6EB] rounded-full flex items-center justify-center shadow-sm text-[#65676B] hover:text-[#0076D6] transition-colors"
                        title="Play audio"
                      >
                        <Play className="w-3.5 h-3.5 ml-0.5" />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-4"
              >
                <Avatar className="w-10 h-10 border-2 border-[#0076D6]">
                  <AvatarFallback className="bg-[#0076D6] text-white">AI</AvatarFallback>
                </Avatar>
                <div className="bg-white shadow-sm border border-[#E4E6EB] rounded-2xl rounded-tl-sm px-5 py-4 flex items-center gap-2">
                  <div className="w-2 h-2 bg-[#E4E6EB] rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-[#E4E6EB] rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                  <div className="w-2 h-2 bg-[#E4E6EB] rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
                </div>
              </motion.div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="bg-white border-t border-[#E4E6EB] p-4 sticky bottom-0 z-10">
          <div className="max-w-2xl mx-auto">
            <form onSubmit={handleSendMessage} className="relative flex items-center">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your response..."
                className="w-full h-14 pl-5 pr-14 rounded-full bg-[#F8F9FA] border-[#E4E6EB] focus-visible:ring-[#0076D6] text-[15px] text-[#1A1A1B]"
                disabled={isLoading}
              />
              <Button 
                type="submit" 
                size="icon"
                className="absolute right-1.5 w-11 h-11 rounded-full bg-[#0076D6] hover:bg-[#0060B0] text-white transition-transform active:scale-95 shadow-[0_4px_12px_rgba(0,118,214,0.3)]"
                disabled={!input.trim() || isLoading}
              >
                <Send className="w-5 h-5 ml-0.5" />
              </Button>
            </form>
            <p className="text-center text-xs text-[#65676B] mt-3 font-medium">
              Listen to the audio and respond naturally.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
