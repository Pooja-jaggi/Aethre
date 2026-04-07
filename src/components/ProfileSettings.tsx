import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, Camera, Save, X, Sparkles, Heart } from 'lucide-react';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { cn } from '@/src/lib/utils';

export const ProfileSettings: React.FC<{ user: any; onClose: () => void }> = ({ user, onClose }) => {
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const avatars = [
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Jasper",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Milo",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Luna",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver",
    "https://api.dicebear.com/7.x/bottts/svg?seed=Aethre",
    "https://api.dicebear.com/7.x/bottts/svg?seed=Aethre_Bot",
    "https://api.dicebear.com/7.x/adventurer/svg?seed=Explorer",
    "https://api.dicebear.com/7.x/adventurer/svg?seed=Scholar",
    "https://api.dicebear.com/7.x/big-ears/svg?seed=Creative",
    "https://api.dicebear.com/7.x/big-ears/svg?seed=Thinker",
  ];

  const handleAvatarClick = (avatar: string) => {
    setPhotoURL(avatar);
    setError(null);
  };

  const handleSave = async () => {
    if (!auth.currentUser) return;
    setIsSaving(true);
    setError(null);
    setIsSuccess(false);
    try {
      // Update Auth Profile
      await updateProfile(auth.currentUser, {
        displayName: displayName.trim(),
        photoURL
      });

      // Update Firestore
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        displayName: displayName.trim(),
        photoURL
      });

      setIsSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error("Error updating profile:", err);
      setError("Failed to update profile. Please try again.");
      handleFirestoreError(err, OperationType.WRITE, `users/${auth.currentUser.uid}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoURL(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="glass-card p-8 max-w-md w-full flex flex-col gap-8 relative overflow-y-auto max-h-[90vh] custom-scrollbar"
    >
      <div className="absolute top-0 right-0 p-4">
        <button onClick={onClose} className="text-white/40 hover:text-white transition-all">
          <X size={24} />
        </button>
      </div>

      <div className="flex flex-col items-center gap-4">
        <div className="relative group">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#FFB74D] shadow-[0_0_30px_rgba(255,183,77,0.2)]">
            <img src={photoURL || `https://ui-avatars.com/api/?name=${displayName}`} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
          <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-all cursor-pointer rounded-full">
            <Camera size={32} className="text-white" />
            <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
          </label>
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-display font-bold text-white">Edit Profile</h2>
          <p className="text-white/40 text-xs uppercase tracking-widest font-bold mt-1">Customize your Aethre identity</p>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold uppercase tracking-widest p-3 rounded-xl text-center">
            {error}
          </div>
        )}
        {isSuccess && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-500 text-[10px] font-bold uppercase tracking-widest p-3 rounded-xl text-center">
            Profile Updated Successfully!
          </div>
        )}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-1">Display Name</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#FFB74D] transition-all"
            placeholder="Your Name"
          />
        </div>

        <div className="flex flex-col gap-3">
          <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-1">Quick Avatars</label>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {avatars.map((avatar, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleAvatarClick(avatar)}
                className={cn(
                  "aspect-square rounded-xl overflow-hidden border-2 transition-all hover:scale-110 bg-white/5 relative group/avatar",
                  photoURL === avatar ? "border-[#FFB74D] shadow-[0_0_15px_rgba(255,183,77,0.3)]" : "border-transparent"
                )}
              >
                <img src={avatar} alt={`Avatar ${i}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                {photoURL === avatar && (
                  <div className="absolute inset-0 bg-[#FFB74D]/10 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-[#FFB74D] rounded-full animate-pulse" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={isSaving}
        className="w-full py-4 bg-[#FFB74D] text-black font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-[#FFA726] transition-all active:scale-95 disabled:opacity-50 shadow-[0_0_20px_rgba(255,183,77,0.2)]"
      >
        {isSaving ? (
          <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            <Save size={18} />
            Save Changes
          </>
        )}
      </button>

      <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-white/20 uppercase tracking-widest">
        <Sparkles size={12} />
        Aethre Premium Student
        <Heart size={12} className="text-red-500/40" />
      </div>
    </motion.div>
  );
};
