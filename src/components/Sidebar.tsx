import React from 'react';
import { Youtube, BookOpen, Timer, FolderOpen, FileText, LogOut, User as UserIcon, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: any;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, user }) => {
  const menuItems = [
    { id: 'classroom', icon: Sparkles, label: 'Classroom' },
    { id: 'youtube', icon: Youtube, label: 'Study Stream' },
    { id: 'teacher', icon: BookOpen, label: 'AI Teacher' },
    { id: 'session', icon: Timer, label: 'Focus Mode' },
    { id: 'notes', icon: FolderOpen, label: 'My Notes' },
    { id: 'papers', icon: FileText, label: 'PYQ Vault' },
  ];

  return (
    <motion.aside 
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="w-20 lg:w-64 glass-card h-[calc(100vh-2rem)] sticky top-4 flex flex-col p-4 z-50"
    >
      <div className="flex items-center gap-3 px-2 mb-10">
        <div className="w-10 h-10 bg-[#FFB74D] rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(255,183,77,0.4)]">
          <Sparkles className="text-black" size={24} />
        </div>
        <span className="hidden lg:block font-display font-bold text-xl tracking-tight text-white">Aethre</span>
      </div>

      <nav className="flex-1 flex flex-col gap-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "flex items-center gap-4 p-3 rounded-2xl transition-all group relative overflow-hidden",
              activeTab === item.id ? "nav-item-active" : "text-white/60 hover:bg-white/5 hover:text-white"
            )}
          >
            <motion.div
              whileHover={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 0.3 }}
            >
              <item.icon size={24} className={cn(
                "transition-colors",
                activeTab === item.id ? "text-black" : "group-hover:text-[#FFB74D]"
              )} />
            </motion.div>
            <span className="hidden lg:block font-medium">{item.label}</span>
            {activeTab === item.id && (
              <motion.div 
                layoutId="active-glow"
                className="absolute inset-0 bg-white/10 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              />
            )}
          </button>
        ))}
      </nav>

      <div className="mt-auto pt-4 border-t border-white/10 flex flex-col gap-4">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/20">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-full h-full bg-white/10 flex items-center justify-center text-white/40">
                <UserIcon size={20} />
              </div>
            )}
          </div>
          <div className="hidden lg:block overflow-hidden">
            <p className="text-sm font-bold text-white truncate">{user?.displayName || 'Student'}</p>
            <p className="text-[10px] text-white/40 truncate">{user?.email}</p>
          </div>
        </div>
        <button 
          onClick={() => signOut(auth)}
          className="flex items-center gap-4 p-3 rounded-2xl text-red-400 hover:bg-red-400/10 transition-all"
        >
          <LogOut size={24} />
          <span className="hidden lg:block font-medium">Logout</span>
        </button>
      </div>
    </motion.aside>
  );
};
