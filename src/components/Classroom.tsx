import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Zap, Trophy, Target, MessageCircle, Heart, Star, Edit3, User, Settings, Timer, FileText, GraduationCap } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { ProfileSettings } from './ProfileSettings';

export const Classroom: React.FC<{ user: any }> = ({ user }) => {
  const [showProfileSettings, setShowProfileSettings] = useState(false);

  const stats = [
    { label: 'Focus Points', value: '0', icon: Target, color: 'text-[#FFB74D]' },
    { label: 'Study Hours', value: '0.0', icon: Zap, color: 'text-blue-400' },
    { label: 'Notes Saved', value: '0', icon: Sparkles, color: 'text-purple-400' },
    { label: 'Rank', value: '-', icon: Trophy, color: 'text-yellow-400' },
  ];

  const characters = [
    { name: 'Nova', role: 'Focus Guide', emoji: '🤖', message: "Ready for another deep focus session? I'll be watching for distractions!", color: 'bg-blue-500/20' },
    { name: 'Sage', role: 'AI Teacher', emoji: '🦉', message: "Your notes are looking great. Want to start a speaking session?", color: 'bg-[#FFB74D]/20' },
    { name: 'Spark', role: 'Motivation', emoji: '⚡', message: "You're only 10 points away from your daily goal! Keep it up!", color: 'bg-green-500/20' },
  ];

  return (
    <div className="flex flex-col gap-8 h-full overflow-y-auto custom-scrollbar pr-2">
      {/* Welcome Header */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass-card p-8 relative overflow-hidden"
      >
        <div className="absolute inset-0 cyber-gradient opacity-30" />
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
          <div className="relative group">
            <div className="w-24 h-24 rounded-3xl overflow-hidden border-4 border-[#FFB74D] shadow-[0_0_30px_rgba(255,183,77,0.3)]">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full bg-[#FFB74D] flex items-center justify-center text-black font-bold text-2xl">
                  {user?.displayName?.[0] || 'S'}
                </div>
              )}
            </div>
            <button 
              onClick={() => setShowProfileSettings(true)}
              className="absolute -bottom-2 -right-2 p-2 bg-[#FFB74D] text-black rounded-xl opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:scale-110"
            >
              <Edit3 size={14} />
            </button>
          </div>
          <div className="text-center md:text-left flex-1">
            <div className="flex items-center justify-center md:justify-start gap-3">
              <h1 className="text-3xl md:text-4xl font-display font-bold text-white tracking-tight">
                Welcome Back, <span className="text-[#FFB74D]">{user?.displayName?.split(' ')[0] || 'Student'}</span>!
              </h1>
              <button 
                onClick={() => setShowProfileSettings(true)}
                className="p-2 text-white/20 hover:text-[#FFB74D] transition-all"
              >
                <Settings size={18} />
              </button>
            </div>
            <p className="text-white/40 font-medium mt-1">Your classroom is ready for some serious learning today.</p>
          </div>
        </div>

        <AnimatePresence>
          {showProfileSettings && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
              <ProfileSettings user={user} onClose={() => setShowProfileSettings(false)} />
            </div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className="glass-card p-6 flex flex-col gap-2 relative group cursor-default"
          >
            <div className={cn(
              "p-3 rounded-2xl bg-white/5 w-fit mb-2 transition-all group-hover:bg-[#FFB74D]/10",
              stat.label === 'Focus Points' && "focus-pulse"
            )}>
              <stat.icon className={cn(stat.color)} size={24} />
            </div>
            <p className="text-2xl font-display font-bold text-white group-hover:text-[#FFB74D] transition-colors">{stat.value}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* AI Characters Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">Your AI Buddies</h2>
          <button className="text-[10px] font-bold text-[#FFB74D] uppercase tracking-widest hover:underline">Manage Team</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {characters.map((char, i) => (
            <motion.div
              key={char.name}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              whileHover={{ y: -8 }}
              className="glass-card p-6 flex flex-col gap-4 group cursor-pointer border-white/5 hover:border-[#FFB74D]/30"
            >
              <div className="flex items-center justify-between">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner", char.color)}>
                  {char.emoji}
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-white group-hover:text-[#FFB74D] transition-colors">{char.name}</p>
                  <p className="text-[10px] font-bold text-[#FFB74D]/60 uppercase tracking-widest">{char.role}</p>
                </div>
              </div>
              <div className="bg-white/5 p-4 rounded-2xl relative group-hover:bg-white/10 transition-colors">
                <div className="absolute -top-2 left-4 w-4 h-4 bg-white/5 rotate-45 group-hover:bg-white/10 transition-colors" />
                <p className="text-xs text-white/60 leading-relaxed italic">"{char.message}"</p>
              </div>
              <div className="flex items-center justify-between mt-auto">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="w-6 h-6 rounded-full border-2 border-[#0A0A0A] bg-white/10 flex items-center justify-center">
                        <Star size={10} className="text-yellow-400" fill="currentColor" />
                      </div>
                    ))}
                  </div>
                  <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Level 12</span>
                </div>
                <button className="px-3 py-1.5 bg-white/5 rounded-lg text-[10px] font-bold text-white/40 opacity-0 group-hover:opacity-100 transition-all hover:bg-[#FFB74D] hover:text-black">
                  Chat
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent Activity / Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Target size={18} className="text-[#FFB74D]" />
              Daily Goals
            </h3>
            <span className="text-[10px] font-bold text-[#FFB74D] uppercase tracking-widest bg-[#FFB74D]/10 px-2 py-1 rounded-md">2/3 Done</span>
          </div>
          <div className="flex flex-col gap-4">
            {[
              { label: 'Complete 2 Focus Sessions', progress: 50, color: 'bg-[#FFB74D]', icon: Timer },
              { label: 'Review Physics Notes', progress: 100, color: 'bg-green-500', icon: FileText },
              { label: 'Solve 5 PYQs', progress: 20, color: 'bg-blue-500', icon: GraduationCap },
            ].map((goal) => (
              <motion.div 
                key={goal.label} 
                whileHover={{ x: 5 }}
                className="flex flex-col gap-2 p-3 rounded-2xl hover:bg-white/5 transition-colors cursor-pointer group"
              >
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                  <div className="flex items-center gap-2">
                    <goal.icon size={12} className="text-white/40 group-hover:text-[#FFB74D] transition-colors" />
                    <span className="text-white/60 group-hover:text-white transition-colors">{goal.label}</span>
                  </div>
                  <span className="text-white">{goal.progress}%</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${goal.progress}%` }}
                    className={cn("h-full rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)]", goal.color)}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="glass-card p-6 flex flex-col items-center justify-center text-center gap-4 border-dashed border-white/10">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-white/20">
            <MessageCircle size={32} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Community Chat</h3>
            <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">Coming Soon</p>
          </div>
          <p className="text-xs text-white/40 max-w-[200px]">Connect with other students in the Aethre network.</p>
        </div>

        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="glass-card p-6 bg-[#FFB74D]/5 border-[#FFB74D]/20"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Edit3 size={18} className="text-[#FFB74D]" />
              Quick Thought
            </h3>
            <Sparkles size={14} className="text-[#FFB74D] animate-pulse" />
          </div>
          <textarea 
            placeholder="What's on your mind? AI will help you organize it later..."
            className="w-full bg-black/20 border border-white/5 rounded-xl p-4 text-xs text-white/60 focus:outline-none focus:border-[#FFB74D]/40 transition-all resize-none h-24 custom-scrollbar"
          />
          <div className="flex justify-end mt-4">
            <button className="interactive-pill text-[8px]">Save to Aethre</button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
