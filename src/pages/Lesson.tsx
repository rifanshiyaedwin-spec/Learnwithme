import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from 'react-router-dom';
import { generateChatResponse } from "@/lib/gemini";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Play, Send, Loader2, Volume2, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from '@/contexts/AuthContext';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

type Message = {
  id: string;
  role: "user" | "model";
  text: string;
};

export default function Lesson() {
  const { progressId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [progress, setProgress] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionTurns, setSessionTurns] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user && progressId) fetchProgress();
  }, [user, progressId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const fetchProgress = async () => {
    try {
      const docRef = doc(db, 'users', user!.uid, 'progress', progressId!);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        const data = snapshot.data();
        setProgress(data);
        startLessonChat(data.language, data.level, data.currentLesson);
      } else {
        navigate('/dashboard');
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, `users/.../progress/${progressId}`);
    }
  };

  const startLessonChat = async (lang: string, level: string, num: number) => {
    setIsLoading(true);
    try {
      const initialMessage = `Hello, I am ready to start lesson ${num}.`;
      const response = await generateChatResponse(lang, level, [], initialMessage);
      setMessages([
        { id: Date.now().toString() + "-model", role: "model", text: response || "Let's begin." }
      ]);
      speak(response || "Let's begin.", lang);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const speak = (text: string, lang: string) => {
    if ("speechSynthesis" in window) {
      const cleanText = text.replace(/\([^)]*\)/g, " ").replace(/[*_~`"]/g, "").trim();
      const langMap: Record<string, string> = {
        spanish: "es-ES", french: "fr-FR", german: "de-DE", italian: "it-IT",
        japanese: "ja-JP", korean: "ko-KR", chinese: "zh-CN", russian: "ru-RU",
        portuguese: "pt-BR", hindi: "hi-IN", english: "en-US", arabic: "ar-SA", turkish: "tr-TR"
      };
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = langMap[lang.trim().toLowerCase()] || "en-US";
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !progress) return;

    const userMessage = input.trim();
    setInput("");
    
    setMessages(prev => [...prev, { id: Date.now().toString(), role: "user", text: userMessage }]);
    setIsLoading(true);

    try {
      const history = messages.map((m) => ({ role: m.role, parts: [{ text: m.text }] }));
      const response = await generateChatResponse(progress.language, progress.level, history, userMessage);
      
      setMessages(prev => [...prev, { id: Date.now().toString(), role: "model", text: response || "..." }]);
      speak(response || "...", progress.language);

      // Simple progression logic: every 3 messages is a "lesson"
      const newTurns = sessionTurns + 1;
      setSessionTurns(newTurns);
      if (newTurns % 3 === 0) {
        const nextLesson = progress.currentLesson + 1;
        const newPct = Math.min(progress.percentage + 20, 100);
        await updateDoc(doc(db, 'users', user!.uid, 'progress', progressId!), {
          currentLesson: nextLesson,
          percentage: newPct,
          updatedAt: serverTimestamp()
        });
        setProgress({ ...progress, currentLesson: nextLesson, percentage: newPct });
        if (newPct === 100) {
           setMessages(prev => [...prev, { id: Date.now().toString(), role: "model", text: "Congratulations! You have completed all lessons. You can now take the assessment from your dashboard." }]);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!progress) return (
    <div className="min-h-screen bg-[#003057] flex items-center justify-center">
      <Loader2 className="w-10 h-10 text-white animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#003057] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-[900px] h-[80vh] min-h-[600px] bg-[#F8F9FA] rounded-[24px] flex flex-col overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.4)]">
        <header className="bg-white border-b border-[#E4E6EB] px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="mr-2">
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="w-10 h-10 bg-[#003057] rounded-full flex items-center justify-center">
              <Volume2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-[#1A1A1B] leading-tight">LearningWithAI</h1>
              <p className="text-xs font-semibold text-[#65676B] uppercase tracking-wider">{progress.language} • {progress.level} • Lesson {progress.currentLesson}</p>
            </div>
          </div>
          <div className="text-right flex flex-col items-end gap-1">
            <p className="text-sm font-semibold text-[#65676B]">{progress.percentage}% Complete</p>
            <div className="w-24 bg-[#E4E6EB] h-1.5 rounded-full overflow-hidden">
              <div className="bg-[#0076D6] h-full transition-all duration-500" style={{ width: `${progress.percentage}%` }} />
            </div>
          </div>
        </header>

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
                        onClick={() => speak(msg.text, progress.language)}
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
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-4">
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

        <div className="bg-white border-t border-[#E4E6EB] p-4 sticky bottom-0 z-10">
          <div className="max-w-2xl mx-auto">
            <form onSubmit={handleSendMessage} className="relative flex items-center">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your response..."
                className="w-full h-14 pl-5 pr-14 rounded-full bg-[#F8F9FA] border-[#E4E6EB] focus-visible:ring-[#0076D6] text-[15px] text-[#1A1A1B]"
                disabled={isLoading || progress.percentage === 100}
              />
              <Button 
                type="submit" 
                size="icon"
                className="absolute right-1.5 w-11 h-11 rounded-full bg-[#0076D6] hover:bg-[#0060B0] text-white transition-transform active:scale-95 shadow-[0_4px_12px_rgba(0,118,214,0.3)] disabled:opacity-50"
                disabled={!input.trim() || isLoading || progress.percentage === 100}
              >
                <Send className="w-5 h-5 ml-0.5" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
