import React, { useState } from 'react';
import { Youtube, Play, ExternalLink, Sparkles, Copy, Check, Save } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';

export const YouTubePlayer: React.FC = () => {
  const [url, setUrl] = useState('');
  const [videoId, setVideoId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiNotes, setAiNotes] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSavingToNotes, setIsSavingToNotes] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);

  const extractVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleLoad = () => {
    const id = extractVideoId(url);
    if (id) {
      setVideoId(id);
    } else {
      alert("Please enter a valid YouTube URL!");
    }
  };

  const generateNotes = async () => {
    if (!url) return;
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Please provide detailed study notes and a summary for this lecture video: ${url}. Focus on key concepts, definitions, and important takeaways.`,
        config: {
          tools: [{ urlContext: {} }]
        }
      });
      setAiNotes(response.text || "Could not generate notes for this video.");
    } catch (err) {
      console.error("AI Note Generation Error:", err);
      setAiNotes("Error generating notes. Please make sure the video is accessible.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (aiNotes) {
      navigator.clipboard.writeText(aiNotes);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const saveToMyNotes = async () => {
    if (!aiNotes || !auth.currentUser) return;
    setIsSavingToNotes(true);
    try {
      await addDoc(collection(db, 'notes'), {
        userId: auth.currentUser.uid,
        title: `Lecture Notes: ${videoId}`,
        content: aiNotes,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      alert("Notes saved to your folder! 📚");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'notes');
    } finally {
      setIsSavingToNotes(false);
    }
  };

  return (
    <div className={cn(
      "glass-card p-6 flex flex-col gap-4 relative overflow-hidden h-full transition-all duration-700",
      isFocusMode ? "bg-black/90 border-transparent" : ""
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-white/60 font-display font-semibold uppercase tracking-wider text-xs">
          <Youtube size={16} className="text-red-500" />
          Study Stream
        </div>
        {videoId && (
          <button 
            onClick={() => setIsFocusMode(!isFocusMode)}
            className={cn(
              "interactive-pill text-[8px]",
              isFocusMode ? "bg-[#FFB74D] text-black border-[#FFB74D]" : ""
            )}
          >
            {isFocusMode ? "Exit Focus" : "Focus Mode"}
          </button>
        )}
      </div>

      {!videoId ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-8 max-w-md mx-auto w-full">
          <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center text-red-500 animate-glow">
            <Youtube size={40} />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-display font-bold text-white mb-2">Ready to Stream?</h2>
            <p className="text-white/40 text-sm">Paste a YouTube lecture link below and Aethre will help you take notes.</p>
          </div>
          <div className="flex flex-col gap-3 w-full">
            <div className="relative group">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste YouTube URL here..."
                className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#FFB74D] transition-all text-sm text-white pr-12"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#FFB74D] transition-colors">
                <ExternalLink size={18} />
              </div>
            </div>
            <button
              onClick={handleLoad}
              className="w-full py-4 bg-[#FFB74D] text-black font-bold rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 hover:bg-[#FFA726] shadow-[0_0_30px_rgba(255,183,77,0.2)]"
            >
              <Play size={18} />
              Load Video
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4 h-full">
          <div className={cn(
            "relative aspect-video rounded-2xl overflow-hidden border border-white/10 transition-all duration-700",
            isFocusMode ? "scale-105 shadow-[0_0_100px_rgba(255,183,77,0.1)]" : ""
          )}>
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          
          <div className="flex justify-between items-center">
            <button
              onClick={() => { setVideoId(null); setAiNotes(null); setIsFocusMode(false); }}
              className="text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white transition-all"
            >
              Change Video
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={generateNotes}
                disabled={isGenerating}
                className="flex items-center gap-2 px-4 py-2 bg-[#FFB74D]/10 text-[#FFB74D] rounded-xl text-xs font-bold hover:bg-[#FFB74D]/20 transition-all disabled:opacity-50 relative overflow-hidden group"
              >
                <Sparkles size={14} className={cn(isGenerating && "animate-spin")} />
                {isGenerating ? "Analyzing..." : "AI Note Taker"}
                {isGenerating && (
                  <motion.div 
                    className="absolute bottom-0 left-0 h-0.5 bg-[#FFB74D]"
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 5, ease: "linear" }}
                  />
                )}
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {isGenerating ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center gap-4 py-10"
              >
                <div className="w-12 h-12 border-4 border-[#FFB74D] border-t-transparent rounded-full animate-spin" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#FFB74D] animate-pulse">Aethre AI is listening to the lecture...</p>
              </motion.div>
            ) : aiNotes && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="flex-1 flex flex-col gap-3 min-h-0"
              >
                <div className="flex items-center justify-between px-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/40">Lecture Notes</h4>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={saveToMyNotes}
                      disabled={isSavingToNotes}
                      className="text-white/40 hover:text-[#FFB74D] transition-all flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest"
                    >
                      <Save size={14} />
                      {isSavingToNotes ? "Saving..." : "Save to Notes"}
                    </button>
                    <button
                      onClick={copyToClipboard}
                      className="text-white/40 hover:text-white transition-all"
                    >
                      {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
                <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-6 overflow-y-auto custom-scrollbar prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown>{aiNotes}</ReactMarkdown>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
