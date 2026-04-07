import React, { useState, useRef, useEffect } from 'react';
import { BookOpen, Mic, Play, Pause, Send, Search, Volume2, StopCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Modality } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import { cn } from '@/src/lib/utils';

export const NotesTeacher: React.FC = () => {
  const [notes, setNotes] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [isAnswering, setIsAnswering] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const generateSpeakingSession = async () => {
    if (!notes) return;
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Convert these notes into a clear, engaging educational speaking session. Explain the concepts naturally as a teacher would. Notes: ${notes}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const binary = atob(base64Audio);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'audio/pcm;rate=24000' });
        // Note: PCM raw data needs an AudioContext to play properly, but for simplicity in this demo
        // we'll use a more standard approach if possible or just inform the user.
        // Actually, the SDK returns raw PCM. Let's use AudioContext.
        playPcm(bytes);
      }
    } catch (err) {
      console.error("TTS Error:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const playPcm = async (bytes: Uint8Array) => {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const audioContext = new AudioContextClass({ sampleRate: 24000 });
    
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    const buffer = audioContext.createBuffer(1, bytes.length / 2, 24000);
    const channelData = buffer.getChannelData(0);
    const view = new DataView(bytes.buffer);
    for (let i = 0; i < channelData.length; i++) {
      channelData[i] = view.getInt16(i * 2, true) / 32768;
    }
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start();
    setIsSpeaking(true);
    source.onended = () => setIsSpeaking(false);
    (window as any).currentAudioSource = source;
  };

  const stopSpeaking = () => {
    if ((window as any).currentAudioSource) {
      (window as any).currentAudioSource.stop();
      setIsSpeaking(false);
    }
  };

  const askQuestion = async () => {
    if (!question) return;
    setIsAnswering(true);
    setAnswer(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: `I'm studying these notes: "${notes}". My question is: "${question}". Please research and provide a detailed answer, including related terms and concepts even if they aren't in the notes.`,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });
      setAnswer(response.text || "I couldn't find an answer.");
    } catch (err) {
      console.error("Question Error:", err);
    } finally {
      setIsAnswering(false);
    }
  };

  return (
    <div className="glass-card p-6 flex flex-col gap-4 relative overflow-hidden h-full">
      <div className="flex items-center gap-2 text-white/60 font-display font-semibold uppercase tracking-wider text-xs">
        <BookOpen size={16} className="text-blue-400" />
        AI Teacher
      </div>

      <div className="flex flex-col gap-3">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Paste your study notes here..."
          className="w-full h-32 px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFB74D] transition-all text-sm resize-none text-white"
        />
        <div className="flex gap-2">
          <button
            onClick={isSpeaking ? stopSpeaking : generateSpeakingSession}
            disabled={!notes || isGenerating}
            className={cn(
              "flex-1 py-3 text-black font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95",
              isSpeaking ? "bg-red-400 text-white" : "bg-[#FFB74D] hover:bg-[#FFA726]",
              isGenerating && "opacity-50 cursor-not-allowed"
            )}
          >
            {isGenerating ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isSpeaking ? (
              <><StopCircle size={18} /> Stop Session</>
            ) : (
              <><Volume2 size={18} /> Start Speaking Session</>
            )}
          </button>
        </div>
      </div>

      <div className="h-px bg-white/10 my-2" />

      <div className="flex flex-col gap-3">
        <div className="relative">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question about the topic..."
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFB74D] transition-all text-sm pr-12 text-white"
          />
          <button
            onClick={askQuestion}
            disabled={!question || isAnswering}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-[#FFB74D] hover:text-[#FFA726] transition-all disabled:opacity-50"
          >
            {isAnswering ? (
              <div className="w-5 h-5 border-2 border-[#FFB74D] border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </div>

        <AnimatePresence>
          {answer && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 bg-white/5 border border-white/10 rounded-2xl text-sm text-white/80 max-h-64 overflow-y-auto prose prose-invert prose-sm"
            >
              <ReactMarkdown>{answer}</ReactMarkdown>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
