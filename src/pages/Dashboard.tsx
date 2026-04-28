import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { collection, query, getDocs, doc, setDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, LogOut, Award } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';

interface UserProgress {
  id: string;
  language: string;
  level: string;
  currentLesson: number;
  percentage: number;
  assessmentScore?: number;
  hasCertificate?: boolean;
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [progresses, setProgresses] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showNew, setShowNew] = useState(false);
  const [newLanguage, setNewLanguage] = useState("");
  const [newLevel, setNewLevel] = useState("Basic");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    fetchProgress();
  }, [user, navigate]);

  const fetchProgress = async () => {
    if (!user) return;
    try {
      const q = query(collection(db, 'users', user.uid, 'progress'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProgress));
      setProgresses(data);
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, `users/${user.uid}/progress`);
    } finally {
      setLoading(false);
    }
  };

  const startNewLanguage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!newLanguage.trim()) {
      setErrorMsg("Please select a language first.");
      return;
    }
    setErrorMsg("");
    setLoading(true);
    try {
      const progressId = `${newLanguage.toLowerCase()}-${newLevel.toLowerCase()}`;
      const newProg = {
        userId: user.uid,
        language: newLanguage,
        level: newLevel,
        currentLesson: 1,
        percentage: 0,
        assessmentScore: 0,
        hasCertificate: false,
        updatedAt: serverTimestamp()
      };
      await setDoc(doc(db, 'users', user.uid, 'progress', progressId), newProg);
      await fetchProgress();
      setShowNew(false);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `users/${user.uid}/progress`);
    } finally {
      setLoading(false);
    }
  };

  const cancelEnrollment = async (progressId: string) => {
    if (!user) return;
    if (!window.confirm("Are you sure you want to cancel this enrollment? This will delete your progress.")) return;
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'progress', progressId));
      await fetchProgress();
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `users/${user.uid}/progress/${progressId}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSignout = () => {
    signOut(auth);
    navigate('/');
  };

  if (loading) return (
    <div className="min-h-screen bg-[#003057] flex items-center justify-center">
      <Loader2 className="w-10 h-10 text-white animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-6 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex justify-between items-center bg-white p-6 rounded-[24px] shadow-sm">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#1A1A1B]">Welcome back, {user?.displayName}</h1>
            <p className="text-[#65676B]">Your language learning journey</p>
          </div>
          <Button variant="ghost" onClick={handleSignout} className="text-[#65676B]">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </header>

        {showNew ? (
          <div className="fixed inset-0 flex items-center justify-center bg-[#003057]/80 z-50 p-4 backdrop-blur-sm">
            <Card className="w-full max-w-md rounded-[24px] shadow-2xl border-none">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-6 text-center text-[#1A1A1B]">Enroll in a new language</h2>
                <form onSubmit={startNewLanguage} className="space-y-6">
                  <div className="space-y-4">
                    <Select value={newLanguage} onValueChange={setNewLanguage}>
                      <SelectTrigger className="w-full h-14 bg-white border-[#E4E6EB] text-lg">
                        <SelectValue placeholder="Select Language" />
                      </SelectTrigger>
                      <SelectContent>
                        {["Spanish", "French", "German", "Italian", "Japanese", "Korean", "Chinese", "Russian", "Portuguese", "Hindi", "English", "Arabic", "Turkish"].map(l => (
                          <SelectItem key={l} value={l}>{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={newLevel} onValueChange={setNewLevel}>
                      <SelectTrigger className="w-full h-14 bg-white border-[#E4E6EB] text-lg">
                        <SelectValue placeholder="Select Level" />
                      </SelectTrigger>
                      <SelectContent>
                        {["Basic", "Intermediate", "Advanced"].map(l => (
                           <SelectItem key={l} value={l}>{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-4 pt-2">
                    <Button type="button" variant="outline" onClick={() => { setShowNew(false); setErrorMsg(""); }} className="h-14 w-full text-lg rounded-xl">Cancel</Button>
                    <Button type="submit" className="h-14 w-full bg-[#0076D6] hover:bg-[#0060B0] text-lg rounded-xl shadow-[0_12px_24px_rgba(0,118,214,0.3)]">Enroll Now</Button>
                  </div>
                  {errorMsg && <p className="text-red-500 text-sm font-medium text-center">{errorMsg}</p>}
                </form>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Button onClick={() => setShowNew(true)} className="w-full h-14 bg-white hover:bg-gray-50 text-[#0076D6] border-2 border-dashed border-[#0076D6]/30 shadow-none hover:border-[#0076D6] text-lg rounded-[24px]">
            <Plus className="w-5 h-5 mr-2" />
            Enroll in New Language
          </Button>
        )}

        <div className="grid grid-cols-1 gap-4">
          {progresses.map(prog => (
            <Card key={prog.id} className="rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.05)] border-none hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all">
              <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex-1 space-y-2 w-full">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold text-[#1A1A1B]">{prog.language}</h3>
                    <span className="px-3 py-1 bg-[#E4E6EB] text-[#1A1A1B] text-xs font-semibold rounded-full uppercase tracking-wider">{prog.level}</span>
                    {prog.hasCertificate && (
                       <span className="px-3 py-1 bg-yellow-100 text-yellow-800 flex items-center text-xs font-semibold rounded-full uppercase tracking-wider">
                         <Award className="w-3 h-3 mr-1" /> Certified
                       </span>
                    )}
                  </div>
                  <div className="w-full bg-[#E4E6EB] h-2.5 rounded-full overflow-hidden">
                    <div className="bg-[#0076D6] h-full transition-all duration-500" style={{ width: `${prog.percentage}%` }} />
                  </div>
                  <p className="text-sm text-[#65676B]">
                    {prog.percentage === 100 ? "Course Completed" : `${prog.percentage}% Complete • Upcoming: Lesson ${prog.currentLesson}`}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full md:w-auto mt-4 md:mt-0">
                  {prog.percentage === 100 && !prog.hasCertificate ? (
                    <Button 
                      onClick={() => navigate(`/assessment/${prog.id}`)}
                      className="w-full sm:w-auto bg-[#003057] text-white hover:bg-[#001f3f]"
                    >
                      Take Assessment
                    </Button>
                  ) : prog.percentage < 100 ? (
                    <Button 
                      onClick={() => navigate(`/lesson/${prog.id}`)}
                      className="w-full sm:w-auto bg-[#0076D6] text-white hover:bg-[#0060B0]"
                    >
                      Continue Lesson
                    </Button>
                  ) : (
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button 
                        onClick={() => {
                          const text = `I just earned my ${prog.level} ${prog.language} certificate on LearningWithAI!`;
                          if (navigator.share) {
                            navigator.share({ title: 'Language Certificate', text, url: window.location.origin });
                          } else {
                            navigator.clipboard.writeText(text);
                            alert("Share text copied to clipboard!");
                          }
                        }}
                        className="w-full sm:w-auto bg-[#10b981] text-white hover:bg-[#059669]"
                      >
                        Share
                      </Button>
                      <Button 
                        onClick={() => navigate(`/certificate/${prog.id}`)}
                        className="w-full sm:w-auto bg-[#003057] text-white hover:bg-[#001f3f]"
                      >
                        View Certificate
                      </Button>
                    </div>
                  )}
                  <Button 
                    variant="outline"
                    onClick={() => cancelEnrollment(prog.id)}
                    className="w-full sm:w-auto text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                  >
                    Cancel Enrollment
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
