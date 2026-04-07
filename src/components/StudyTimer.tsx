import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, Timer as TimerIcon, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';

interface StudyTimerProps {
  onPenalty: () => void;
  isActive: boolean;
  setIsActive: (active: boolean) => void;
}

export const StudyTimer: React.FC<StudyTimerProps> = ({ onPenalty, isActive, setIsActive }) => {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // Default 25 mins
  const [showPenaltyAlert, setShowPenaltyAlert] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, setIsActive]);

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(25 * 60);
  };

  const applyPenalty = useCallback(() => {
    setTimeLeft((prev) => Math.max(0, prev - 60));
    setShowPenaltyAlert(true);
    setTimeout(() => setShowPenaltyAlert(false), 3000);
  }, []);

  // Expose penalty to parent via ref or just use the prop if we want the parent to trigger it
  // But the prompt says "if distracted... asks question... if not able to answer it decreases timer"
  // So the parent will call a function that triggers the question, and if failed, call applyPenalty.
  
  // For now, let's just export the penalty function if needed, but we'll use the prop.
  useEffect(() => {
    // This is a bit hacky but works for this demo: 
    // we'll attach the penalty function to a global window object for the parent to call
    (window as any).applyStudyPenalty = applyPenalty;
  }, [applyPenalty]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="glass-card p-6 flex flex-col items-center gap-4 relative overflow-hidden h-full justify-center">
      <div className="flex items-center gap-2 text-white/60 font-display font-semibold uppercase tracking-wider text-xs">
        <TimerIcon size={16} className="text-orange-400" />
        Study Session
      </div>

      <div className="text-6xl font-display font-bold text-white tabular-nums">
        {formatTime(timeLeft)}
      </div>

      <div className="flex gap-3">
        <button
          onClick={toggleTimer}
          className={cn(
            "p-4 rounded-2xl transition-all active:scale-95 shadow-lg",
            isActive ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
          )}
        >
          {isActive ? <Pause size={28} /> : <Play size={28} />}
        </button>
        <button
          onClick={resetTimer}
          className="p-4 rounded-2xl bg-white/5 text-white/60 border border-white/10 transition-all active:scale-95 hover:bg-white/10"
        >
          <RotateCcw size={28} />
        </button>
      </div>

      <AnimatePresence>
        {showPenaltyAlert && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="absolute bottom-2 bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1"
          >
            <AlertCircle size={12} />
            -1 Minute Penalty!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
