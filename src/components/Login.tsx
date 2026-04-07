import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, LogIn, ShieldCheck, Zap } from 'lucide-react';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup } from 'firebase/auth';

export const Login: React.FC = () => {
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error("Login Error:", err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#0B1120]">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 cyber-gradient opacity-50" />
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 10, repeat: Infinity }}
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#FFB74D]/10 rounded-full blur-[100px]"
      />
      <motion.div 
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 8, repeat: Infinity }}
        className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px]"
      />

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass-card p-10 max-w-md w-full relative z-10 flex flex-col items-center text-center gap-8"
      >
        <div className="w-20 h-20 bg-[#FFB74D] rounded-3xl flex items-center justify-center shadow-[0_0_40px_rgba(255,183,77,0.5)] animate-float">
          <Sparkles className="text-black" size={40} />
        </div>

        <div>
          <h1 className="text-4xl font-display font-bold text-white tracking-tight mb-2">Aethre Classroom</h1>
          <p className="text-white/40 text-sm font-medium">Your private AI-powered study sanctuary.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 w-full text-left">
          <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
            <div className="p-2 bg-white/5 rounded-xl text-[#FFB74D]"><ShieldCheck size={20} /></div>
            <div>
              <p className="text-xs font-bold text-white uppercase tracking-widest">Secure Access</p>
              <p className="text-[10px] text-white/40">Your data is encrypted and private.</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
            <div className="p-2 bg-white/5 rounded-xl text-blue-400"><Zap size={20} /></div>
            <div>
              <p className="text-xs font-bold text-white uppercase tracking-widest">AI Powered</p>
              <p className="text-[10px] text-white/40">Personalized study buddy & teacher.</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogin}
          className="w-full py-4 bg-[#FFB74D] text-black font-bold rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 hover:bg-[#FFA726] shadow-[0_0_30px_rgba(255,183,77,0.3)]"
        >
          <LogIn size={20} />
          Enter Classroom
        </button>

        <p className="text-[10px] text-white/20 uppercase tracking-[0.2em] font-bold">
          Powered by Google Gemini AI
        </p>
      </motion.div>
    </div>
  );
};
