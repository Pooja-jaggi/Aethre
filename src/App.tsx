import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, MessageCircle, Sparkles } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { Login } from './components/Login';
import { Classroom } from './components/Classroom';
import { YouTubePlayer } from './components/YouTubePlayer';
import { NotesTeacher } from './components/NotesTeacher';
import { StudyTimer } from './components/StudyTimer';
import { CameraMonitor } from './components/CameraMonitor';
import { NotesFolder } from './components/NotesFolder';
import { QuestionPapers } from './components/QuestionPapers';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { GoogleGenAI } from "@google/genai";

const FloatingBuddy = ({ message, onQuickAction }: { message: string; onQuickAction: (action: string) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <motion.div
      drag
      dragConstraints={{ left: -20, right: 20, top: -20, bottom: 20 }}
      className="fixed bottom-8 right-8 z-[100] cursor-grab active:cursor-grabbing"
    >
      <div className="relative group">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              className="absolute bottom-20 right-0 w-64 glass-card p-4 flex flex-col gap-3 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Aethre Buddy Online</span>
              </div>
              <p className="text-xs text-white/80 leading-relaxed italic mb-2">"{message}"</p>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => { onQuickAction('tip'); setIsOpen(false); }}
                  className="interactive-pill text-center py-2"
                >
                  Study Tip
                </button>
                <button 
                  onClick={() => { onQuickAction('joke'); setIsOpen(false); }}
                  className="interactive-pill text-center py-2"
                >
                  Quick Joke
                </button>
                <button 
                  onClick={() => { onQuickAction('quote'); setIsOpen(false); }}
                  className="interactive-pill text-center py-2"
                >
                  Motivation
                </button>
                <button 
                  onClick={() => { onQuickAction('status'); setIsOpen(false); }}
                  className="interactive-pill text-center py-2"
                >
                  My Status
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!isOpen && (
          <div className="absolute -top-16 right-0 w-48 bg-white/10 backdrop-blur-md border border-white/10 p-3 rounded-2xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none">
            <p className="text-[10px] text-white/80 leading-relaxed italic">"{message}"</p>
            <div className="absolute -bottom-2 right-6 w-3 h-3 bg-white/10 border-r border-b border-white/10 rotate-45" />
          </div>
        )}

        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="w-16 h-16 bg-[#FFB74D] rounded-2xl flex items-center justify-center shadow-[0_0_40px_rgba(255,183,77,0.4)] animate-float group-hover:scale-110 transition-transform"
        >
          <MessageCircle size={32} className="text-black" />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-[#0A0A0A] animate-pulse" />
        </button>
      </div>
    </motion.div>
  );
};

const BackgroundParticles = () => (
  <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
    {[...Array(30)].map((_, i) => (
      <motion.div
        key={i}
        initial={{ 
          x: Math.random() * 100 + "%", 
          y: Math.random() * 100 + "%",
          opacity: Math.random() * 0.3,
          scale: Math.random() * 0.5 + 0.5
        }}
        animate={{ 
          y: [null, "-10%"],
          opacity: [null, 0]
        }}
        transition={{ 
          duration: Math.random() * 20 + 20, 
          repeat: Infinity, 
          ease: "linear" 
        }}
        className="absolute w-1 h-1 bg-white rounded-full shadow-[0_0_10px_white]"
      />
    ))}
  </div>
);

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [activeTab, setActiveTab] = useState('classroom');
  const [isStudyActive, setIsStudyActive] = useState(false);
  const [buddyMessage, setBuddyMessage] = useState("Welcome to your Aethre Classroom. Ready to excel? 🚀");
  const [showQuestion, setShowQuestion] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<{ q: string; a: string } | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [isCheckingAnswer, setIsCheckingAnswer] = useState(false);

  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
      
      if (currentUser) {
        // Sync to Firestore if new
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userRef);
          if (!userSnap.exists()) {
            await setDoc(userRef, {
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName,
              photoURL: currentUser.photoURL,
              focusPoints: 0,
              createdAt: serverTimestamp()
            });
          }
        } catch (err) {
          console.error("Error syncing user profile:", err);
        }
      } else {
        setUserProfile(null);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Separate listener for Firestore profile data
  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    
    const unsubscribeProfile = onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        setUserProfile(snapshot.data());
      }
    }, (error: any) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
    });

    return () => unsubscribeProfile();
  }, [user]);

  const handleDistraction = useCallback(async (reason: string) => {
    if (reason.includes('prolonged')) {
      setBuddyMessage("FOCUS BUDDY YOU NEED TO DO IT! 🧐");
    } else {
      setBuddyMessage(`Focus alert: I detected ${reason}. Let's get back to it! 🧐`);
    }
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: "Generate a very simple general knowledge question and its one-word answer. Format: Question | Answer. Example: What is the capital of France? | Paris"
      });
      const [q, a] = (response.text || "").split('|').map(s => s.trim());
      if (q && a) {
        setCurrentQuestion({ q, a });
        setShowQuestion(true);
      }
    } catch (err) {
      console.error("Question Generation Error:", err);
    }
  }, []);

  const checkAnswer = async () => {
    if (!currentQuestion) return;
    setIsCheckingAnswer(true);
    
    const isCorrect = userAnswer.toLowerCase().includes(currentQuestion.a.toLowerCase());
    
    if (isCorrect) {
      setBuddyMessage("Excellent. Your focus is restored. 🌟");
      setShowQuestion(false);
      setCurrentQuestion(null);
      setUserAnswer('');
    } else {
      setBuddyMessage("Incorrect. Focus penalty applied: -1 minute. 😔");
      if ((window as any).applyStudyPenalty) {
        (window as any).applyStudyPenalty();
      }
      setShowQuestion(false);
      setCurrentQuestion(null);
      setUserAnswer('');
    }
    setIsCheckingAnswer(false);
  };

  const handleQuickAction = async (action: string) => {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    let prompt = "";
    
    switch (action) {
      case 'tip':
        prompt = "Give a very short, unique study tip for a student.";
        break;
      case 'joke':
        prompt = "Tell a very short, clean dad joke about school or studying.";
        break;
      case 'quote':
        prompt = "Provide a short, powerful motivational quote for studying.";
        break;
      case 'status':
        setBuddyMessage(`You're doing great! You've been active in ${activeTab} and your focus is looking sharp. 💎`);
        return;
    }

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });
      setBuddyMessage(response.text || "I'm here to help!");
    } catch (err) {
      console.error("Buddy Action Error:", err);
    }
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-[#0B1120] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#FFB74D] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const renderContent = () => {
    const currentUserData = userProfile || user;
    switch (activeTab) {
      case 'classroom':
        return <Classroom user={currentUserData} />;
      case 'youtube':
        return <YouTubePlayer />;
      case 'teacher':
        return <NotesTeacher />;
      case 'session':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
            <div className="lg:col-span-4 flex flex-col gap-6">
              <div className="glass-card p-6">
                <p className="handwritten text-xl text-[#FFB74D] italic">"{buddyMessage}"</p>
              </div>
              <CameraMonitor isStudyActive={isStudyActive} onDistractionDetected={handleDistraction} />
              <StudyTimer isActive={isStudyActive} setIsActive={setIsStudyActive} onPenalty={() => {}} />
            </div>
            <div className="lg:col-span-8">
              <div className="glass-card p-8 h-full flex flex-col items-center justify-center text-center gap-6 border-dashed border-white/10">
                <div className="w-24 h-24 bg-[#FFB74D]/10 rounded-full flex items-center justify-center text-[#FFB74D] animate-pulse">
                  <AlertCircle size={48} />
                </div>
                <div>
                  <h2 className="text-2xl font-display font-bold text-white">Focus Mode Active</h2>
                  <p className="text-white/40 max-w-md mx-auto mt-2">
                    Buddy is monitoring your focus. Any distractions will trigger a focus check. Stay sharp!
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'notes':
        return <NotesFolder />;
      case 'papers':
        return <QuestionPapers />;
      default:
        return <Classroom user={currentUserData} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1120] flex p-4 gap-4 overflow-hidden relative">
      <BackgroundParticles />
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} user={userProfile || user} />
      
      <main className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0 cyber-gradient opacity-20 pointer-events-none" />
        <div className="h-full relative z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full"
            >
              {activeTab === 'classroom' ? <Classroom user={userProfile || user} /> : renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        <FloatingBuddy message={buddyMessage} onQuickAction={handleQuickAction} />

        {/* Global Question Overlay */}
        <AnimatePresence>
          {showQuestion && currentQuestion && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="glass-card p-10 max-w-md w-full flex flex-col gap-6 border-2 border-[#FFB74D] shadow-[0_0_50px_rgba(255,183,77,0.2)]"
              >
                <div className="flex items-center gap-4 text-[#FFB74D]">
                  <AlertCircle size={40} />
                  <h2 className="text-3xl font-display font-bold tracking-tight">Focus Check!</h2>
                </div>
                <p className="text-lg text-white/80 font-medium leading-relaxed">
                  {currentQuestion.q}
                </p>
                <input
                  type="text"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Type your answer..."
                  className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-[#FFB74D] transition-all"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && checkAnswer()}
                />
                <button
                  onClick={checkAnswer}
                  disabled={isCheckingAnswer}
                  className="w-full py-4 bg-[#FFB74D] text-black font-bold rounded-2xl transition-all active:scale-95 hover:bg-[#FFA726] shadow-[0_0_20px_rgba(255,183,77,0.3)]"
                >
                  {isCheckingAnswer ? "Verifying..." : "Verify Focus"}
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
