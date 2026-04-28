import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Award, ChevronLeft } from 'lucide-react';
import { generateChatResponse } from "@/lib/gemini";

export default function Assessment() {
  const { progressId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [score, setScore] = useState(0);
  const [questionsAttempted, setQuestionsAttempted] = useState(0);
  const TOTAL_QUESTIONS = 5;

  useEffect(() => {
    if (user && progressId) {
      fetchProgress();
    }
  }, [user, progressId]);

  const fetchProgress = async () => {
    try {
      const docRef = doc(db, 'users', user!.uid, 'progress', progressId!);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        setProgress(snapshot.data());
        generateQuestion(snapshot.data().language, snapshot.data().level);
      } else {
        navigate('/dashboard');
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, `users/.../progress/${progressId}`);
    } finally {
      setLoading(false);
    }
  };

  const generateQuestion = async (lang: string, level: string) => {
    setLoading(true);
    try {
      const prompt = `Generate a single short assessing question/task for a ${level} level student in ${lang}. Only provide the question in ${lang}.`;
      const q = await generateChatResponse(lang, level, [], prompt);
      setQuestion(q || "Translate this: Hello, how are you?");
    } catch(e) {
      console.error(e);
      setQuestion("Translate this: Hello, how are you?");
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim() || loading) return;
    setLoading(true);
    
    try {
      const prompt = `The student was asked: "${question}". They answered: "${answer}". 
      Assess if this is correct. If correct, start your response with "CORRECT". If wrong, start with "INCORRECT". 
      Then briefly explain why or give a hint to assist the student.`;
      const res = await generateChatResponse(progress.language, progress.level, [], prompt);
      
      let isCorrect = false;
      if (res && res.toUpperCase().startsWith("CORRECT")) {
        isCorrect = true;
        setScore(src => src + 1);
      }
      setFeedback(res || "I couldn't verify that.");
      setQuestionsAttempted(prev => prev + 1);
      setAnswer("");
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const finishAssessment = async () => {
    setLoading(true);
    try {
      const finalPercentage = (score / TOTAL_QUESTIONS) * 100;
      const pass = finalPercentage >= 50;
      const ref = doc(db, 'users', user!.uid, 'progress', progressId!);
      await updateDoc(ref, {
        assessmentScore: finalPercentage,
        hasCertificate: pass,
        updatedAt: serverTimestamp()
      });
      navigate('/dashboard');
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/.../progress/${progressId}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !progress) return (
    <div className="min-h-screen bg-[#003057] flex items-center justify-center">
      <Loader2 className="w-10 h-10 text-white animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-6 font-sans flex flex-col items-center">
      <div className="w-full max-w-2xl mb-6">
        <Button variant="ghost" onClick={() => navigate('/dashboard')} className="text-[#65676B]">
          <ChevronLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </Button>
      </div>

      <Card className="w-full max-w-2xl rounded-[24px] shadow-[0_40px_100px_rgba(0,0,0,0.1)] border-none">
        <div className="bg-[#003057] p-8 text-center rounded-t-[24px]">
          <Award className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">{progress?.language} Certification</h1>
          <p className="text-white/80">{progress?.level} Level Assessment</p>
        </div>
        <CardContent className="p-8">
          {questionsAttempted < TOTAL_QUESTIONS ? (
            <div className="space-y-6">
              <div className="flex justify-between text-sm font-semibold text-[#65676B] uppercase tracking-wider">
                <span>Question {questionsAttempted + 1} of {TOTAL_QUESTIONS}</span>
                <span>Score: {score}</span>
              </div>
              
              <div className="bg-[#E4E6EB]/50 p-6 rounded-xl border border-[#E4E6EB]">
                <p className="text-lg text-[#1A1A1B] font-medium">{loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : question}</p>
              </div>

              {feedback && (
                <div className={`p-4 rounded-xl text-sm ${feedback.startsWith('CORRECT') ? 'bg-green-50 text-green-800' : 'bg-orange-50 text-orange-800'}`}>
                  {feedback.replace(/^(CORRECT|INCORRECT)[\s:,-]*/i, '')}
                </div>
              )}

              <form onSubmit={submitAnswer} className="space-y-4">
                <input
                  type="text"
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                  placeholder="Type your answer..."
                  className="w-full h-14 px-4 rounded-xl border border-[#E4E6EB] focus:ring-2 focus:ring-[#0076D6] outline-none"
                  disabled={loading}
                />
                <div className="flex gap-4">
                  <Button type="submit" disabled={loading || !answer.trim()} className="w-full h-12 bg-[#0076D6] hover:bg-[#0060B0]">
                    Submit Answer
                  </Button>
                  {feedback && (
                    <Button type="button" variant="outline" onClick={() => { setFeedback(""); generateQuestion(progress.language, progress.level); }} className="w-full h-12">
                      Next Question
                    </Button>
                  )}
                </div>
              </form>
            </div>
          ) : (
            <div className="text-center space-y-6">
              <h2 className="text-2xl font-bold">Assessment Complete!</h2>
              <p className="text-[#65676B]">You scored {score} out of {TOTAL_QUESTIONS} ({((score / TOTAL_QUESTIONS) * 100).toFixed(0)}%)</p>
              {score >= (TOTAL_QUESTIONS / 2) ? (
                <div className="bg-green-50 p-6 rounded-xl border border-green-200">
                  <Award className="w-12 h-12 text-green-500 mx-auto mb-2" />
                  <p className="text-green-800 font-bold">Congratulations! You passed!</p>
                  <p className="text-sm text-green-600 mt-2">You will receive your E-Certificate on your dashboard.</p>
                </div>
              ) : (
                <div className="bg-red-50 p-6 rounded-xl border border-red-200">
                  <p className="text-red-800 font-bold">You did not pass this time.</p>
                  <p className="text-sm text-red-600 mt-2">Keep practicing and try again later!</p>
                </div>
              )}
              <Button onClick={finishAssessment} className="w-full h-12 bg-[#0076D6] hover:bg-[#0060B0]">
                Return to Dashboard
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
