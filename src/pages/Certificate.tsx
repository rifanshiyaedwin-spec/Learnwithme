import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Download, Share2, Award } from 'lucide-react';

interface UserProgress {
  id: string;
  language: string;
  level: string;
  currentLesson: number;
  percentage: number;
  assessmentScore?: number;
  hasCertificate?: boolean;
}

export default function Certificate() {
  const { progressId } = useParams<{ progressId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    fetchProgress();
  }, [user, progressId, navigate]);

  const fetchProgress = async () => {
    if (!user || !progressId) return;
    try {
      const docRef = doc(db, 'users', user.uid, 'progress', progressId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setProgress({ id: docSnap.id, ...docSnap.data() } as UserProgress);
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, `users/${user.uid}/progress/${progressId}`);
    } finally {
      setLoading(false);
    }
  };

  const shareCertificate = () => {
    if (!progress) return;
    const text = `I just earned my ${progress.level} ${progress.language} certificate on LearningWithAI with a score of ${progress.assessmentScore}%! 🎉`;
    if (navigator.share) {
      navigator.share({
        title: 'My Language Certificate',
        text: text,
        url: window.location.origin
      });
    } else {
      navigator.clipboard.writeText(text);
      alert("Sharing text copied to clipboard! You can paste it on social media.");
    }
  };

  const downloadCertificate = () => {
    window.print();
  };

  if (loading) return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
      <Loader2 className="w-10 h-10 text-[#003057] animate-spin" />
    </div>
  );

  if (!progress || !progress.hasCertificate) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold mb-4">Certificate Not Found</h2>
        <Button onClick={() => navigate('/dashboard')} variant="outline">Back to Dashboard</Button>
      </div>
    );
  }

  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-6 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center no-print">
          <Button variant="ghost" onClick={() => navigate('/dashboard')} className="text-[#65676B]">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex gap-3">
            <Button variant="outline" onClick={shareCertificate} className="flex items-center">
              <Share2 className="w-4 h-4 mr-2" /> Share
            </Button>
            <Button onClick={downloadCertificate} className="bg-[#003057] text-white hover:bg-[#001f3f] flex items-center">
              <Download className="w-4 h-4 mr-2" /> Download Print PDF
            </Button>
          </div>
        </div>

        <div className="flex justify-center certificate-container">
          <div className="w-[800px] bg-white border-8 border-[#003057] p-12 relative shadow-2xl overflow-hidden print:shadow-none print:border-4">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-blue-50 rounded-full mix-blend-multiply filter blur-xl opacity-70 -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-green-50 rounded-full mix-blend-multiply filter blur-xl opacity-70 translate-x-1/2 translate-y-1/2"></div>
            
            <div className="text-center relative z-10 space-y-8">
              <div className="flex justify-center text-[#003057]">
                <Award className="w-20 h-20" />
              </div>
              
              <div>
                <h1 className="text-5xl font-serif font-bold text-[#1A1A1B] uppercase tracking-widest text-[#003057]">Certificate of Completion</h1>
              </div>

              <div className="py-8 space-y-4">
                <p className="text-xl text-gray-500 uppercase tracking-widest">This certifies that</p>
                <div className="text-4xl font-bold text-[#1A1A1B] border-b-2 border-gray-200 inline-block px-12 py-2">
                  {user?.displayName || "Learner"}
                </div>
              </div>

              <div className="space-y-4 max-w-2xl mx-auto">
                <p className="text-xl text-gray-600 leading-relaxed text-balance">
                  has successfully completed the <strong className="text-[#003057]">{progress.level} {progress.language}</strong> Language Course 
                  with a final assessment score of {progress.assessmentScore}%.
                </p>
                <p className="text-gray-500 italic">
                  Demonstrating proficiency and dedication in language learning.
                </p>
              </div>

              <div className="flex justify-between items-end pt-12">
                <div className="text-center">
                  <div className="w-48 border-b-2 border-gray-300 mb-2"></div>
                  <p className="text-gray-500 font-semibold tracking-wider text-sm uppercase">Date</p>
                  <p className="text-gray-800 font-medium">{date}</p>
                </div>
                
                <div className="text-center">
                  <div className="w-48 border-b-2 border-gray-300 mb-2">
                    <p className="font-script text-2xl text-[#003057] -mt-6">LearningWithAI</p>
                  </div>
                  <p className="text-gray-500 font-semibold tracking-wider text-sm uppercase">Organization</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
      
      <style>{`
        @media print {
          body * {
            visibility: hidden;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .certificate-container, .certificate-container * {
            visibility: visible;
          }
          .certificate-container {
            position: absolute;
            left: 0;
            top: 0;
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: landscape;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
}
