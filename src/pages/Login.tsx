import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // If already logged in, redirect
  React.useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#003057] flex items-center justify-center p-4 font-sans">
      <Card className="w-full max-w-md border-none shadow-[0_40px_100px_rgba(0,0,0,0.4)] rounded-[24px] overflow-hidden bg-[#F8F9FA]">
        <div className="bg-[#003057] p-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">LearningWithAI</h1>
          <p className="text-white/80 font-medium">Language Learning Simulation</p>
        </div>
        <CardContent className="p-8 text-center space-y-6">
          <p className="text-[#65676B]">Sign in to track your learning progress and take assessments.</p>
          <Button 
            onClick={handleGoogleLogin} 
            disabled={isLoading}
            className="w-full h-14 text-lg font-semibold bg-[#0076D6] hover:bg-[#0060B0] text-white rounded-xl transition-all shadow-[0_12px_24px_rgba(0,118,214,0.3)]"
          >
            {isLoading ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : null}
            Sign in with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
