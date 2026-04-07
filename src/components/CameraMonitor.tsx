import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, CameraOff, Eye, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import { cn } from '@/src/lib/utils';

interface CameraMonitorProps {
  isStudyActive: boolean;
  onDistractionDetected: (reason: string) => void;
}

export const CameraMonitor: React.FC<CameraMonitorProps> = ({ isStudyActive, onDistractionDetected }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<string | null>(null);

  const [cameraError, setCameraError] = useState<string | null>(null);

  const [distractionStartTime, setDistractionStartTime] = useState<number | null>(null);
  const [showFocusWarning, setShowFocusWarning] = useState(false);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraOn(true);
      }
    } catch (err: any) {
      console.error("Error accessing camera:", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError("Camera permission denied. Please check your browser settings or try opening the app in a new tab.");
      } else {
        setCameraError("Could not access camera. Please ensure no other app is using it.");
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraOn(false);
      setDistractionStartTime(null);
      setShowFocusWarning(false);
    }
  };

  const analyzeFrame = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !isStudyActive) return;

    setIsAnalyzing(true);
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const base64Image = canvas.toDataURL('image/jpeg').split(',')[1];

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: {
          parts: [
            { text: "Analyze the student's focus, specifically looking at their eyes and gaze. Are they looking at the screen/study material, or are they distracted (looking away, eyes closed, using phone, etc.)? Respond with 'focused' or 'distracted' followed by a brief reason. Example: 'distracted: looking away from screen'" },
            { inlineData: { data: base64Image, mimeType: "image/jpeg" } }
          ]
        }
      });

      const result = response.text?.toLowerCase() || "";
      setLastAnalysis(result);
      
      if (result.includes('distracted')) {
        if (!distractionStartTime) {
          setDistractionStartTime(Date.now());
        } else {
          const duration = (Date.now() - distractionStartTime) / 1000 / 60; // in minutes
          if (duration >= 5) {
            setShowFocusWarning(true);
            onDistractionDetected("prolonged distraction (5+ minutes)");
          }
        }
        onDistractionDetected(result.split(':')[1]?.trim() || "Distraction detected");
      } else {
        setDistractionStartTime(null);
        setShowFocusWarning(false);
      }
    } catch (err) {
      console.error("AI Analysis Error:", err);
    } finally {
      setIsAnalyzing(false);
    }
  }, [isStudyActive, onDistractionDetected, distractionStartTime]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isCameraOn && isStudyActive) {
      // Analyze every 30 seconds
      interval = setInterval(analyzeFrame, 30000);
    }
    return () => clearInterval(interval);
  }, [isCameraOn, isStudyActive, analyzeFrame]);

  return (
    <div className="glass-card p-4 flex flex-col gap-4 relative overflow-hidden">
      <AnimatePresence>
        {showFocusWarning && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-0 left-0 right-0 z-50 bg-red-500 text-white p-3 text-center font-bold text-xs shadow-lg animate-pulse"
          >
            FOCUS BUDDY YOU NEED TO DO IT! 🧐
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-white/60 font-display font-semibold uppercase tracking-wider text-xs">
          <Eye size={16} />
          Buddy's Vision
        </div>
        <button
          onClick={isCameraOn ? stopCamera : startCamera}
          className={cn(
            "p-2 rounded-full transition-all active:scale-95",
            isCameraOn ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"
          )}
        >
          {isCameraOn ? <CameraOff size={18} /> : <Camera size={18} />}
        </button>
      </div>

      <div className="relative aspect-video bg-white/5 rounded-2xl overflow-hidden border-2 border-dashed border-white/10 flex items-center justify-center">
        {!isCameraOn && !cameraError && (
          <div className="text-white/20 text-center p-4">
            <Camera size={48} className="mx-auto mb-2 opacity-20" />
            <p className="text-xs font-medium">Turn on camera so Buddy can see you!</p>
          </div>
        )}
        {cameraError && (
          <div className="text-red-500 text-center p-4 bg-red-50/50 inset-0 absolute flex flex-col items-center justify-center">
            <AlertTriangle size={32} className="mb-2" />
            <p className="text-[10px] font-bold leading-tight max-w-[200px]">{cameraError}</p>
            <button 
              onClick={startCamera}
              className="mt-2 text-[10px] underline font-bold uppercase tracking-widest"
            >
              Try Again
            </button>
          </div>
        )}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={cn("w-full h-full object-cover", !isCameraOn && "hidden")}
        />
        <canvas ref={canvasRef} className="hidden" />

        <AnimatePresence>
          {isAnalyzing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white/40 backdrop-blur-[2px] flex items-center justify-center"
            >
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-4 border-[#FFB74D] border-t-transparent rounded-full animate-spin" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#5D4037]">Buddy is watching...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {lastAnalysis && (
        <div className={cn(
          "text-[10px] font-medium px-2 py-1 rounded-md flex items-center gap-1",
          lastAnalysis.includes('focused') ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700"
        )}>
          {lastAnalysis.includes('distracted') && <AlertTriangle size={10} />}
          {lastAnalysis}
        </div>
      )}
    </div>
  );
};
