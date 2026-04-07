import React, { useState, useEffect, useRef } from 'react';
import { FolderOpen, Plus, Trash2, Save, FileText, Search, Sparkles, Upload, Brain, GraduationCap, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { cn } from '@/src/lib/utils';
import ReactMarkdown from 'react-markdown';
import { GoogleGenAI, Type } from "@google/genai";

export const NotesFolder: React.FC = () => {
  const [notes, setNotes] = useState<any[]>([]);
  const [activeNote, setActiveNote] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [flashcards, setFlashcards] = useState<any[] | null>(null);
  const [quiz, setQuiz] = useState<any[] | null>(null);
  const [currentFlashcard, setCurrentFlashcard] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [showQuizResults, setShowQuizResults] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(collection(db, 'notes'), where('userId', '==', auth.currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotes(notesData.sort((a: any, b: any) => b.createdAt?.seconds - a.createdAt?.seconds));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'notes'));
    return () => unsubscribe();
  }, []);

  const saveNote = async () => {
    if (!title || !content || !auth.currentUser) return;
    try {
      if (activeNote) {
        await updateDoc(doc(db, 'notes', activeNote.id), {
          title, content, updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'notes'), {
          userId: auth.currentUser.uid,
          title, content,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      setIsEditing(false);
      setActiveNote(null);
      setTitle('');
      setContent('');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'notes');
    }
  };

  const deleteNote = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'notes', id));
      if (activeNote?.id === id) {
        setActiveNote(null);
        setIsEditing(false);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'notes');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsGenerating(true);
    // In a real app, we'd use a library like pdf.js or docx-parser.
    // For this demo, we'll simulate extraction or use the filename as a prompt.
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `I have a file named "${file.name}". Please generate a comprehensive set of study notes based on what you know about this topic. If it's a common subject, provide detailed explanations.`,
      });
      
      setTitle(file.name.split('.')[0]);
      setContent(response.text || "Could not extract content.");
      setIsEditing(true);
      setActiveNote(null);
    } catch (err) {
      console.error("File AI Extraction Error:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateFlashcards = async () => {
    if (!activeNote) return;
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate 5 flashcards from these notes: ${activeNote.content}. Return as JSON array of objects with 'front' and 'back' properties.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                front: { type: Type.STRING },
                back: { type: Type.STRING }
              },
              required: ["front", "back"]
            }
          }
        }
      });
      setFlashcards(JSON.parse(response.text || "[]"));
      setCurrentFlashcard(0);
      setIsFlipped(false);
    } catch (err) {
      console.error("Flashcard Generation Error:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateQuiz = async () => {
    if (!activeNote) return;
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate a 5-question multiple choice quiz from these notes: ${activeNote.content}. Return as JSON array of objects with 'question', 'options' (array of 4 strings), and 'correctIndex' (0-3).`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctIndex: { type: Type.NUMBER }
              },
              required: ["question", "options", "correctIndex"]
            }
          }
        }
      });
      setQuiz(JSON.parse(response.text || "[]"));
      setQuizAnswers({});
      setShowQuizResults(false);
    } catch (err) {
      console.error("Quiz Generation Error:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredNotes = notes.filter(n => n.title.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full relative overflow-hidden">
      {/* Sidebar List */}
      <div className="lg:col-span-4 flex flex-col gap-4">
        <div className="glass-card p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-display font-bold text-white flex items-center gap-2">
              <FolderOpen size={20} className="text-[#FFB74D]" />
              My Notes
            </h2>
            <div className="flex gap-2">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-2 bg-white/5 text-white/60 border border-white/10 rounded-xl hover:bg-white/10 transition-all active:scale-95"
                title="Upload PDF/PPT/Word"
              >
                <Upload size={20} />
              </button>
              <button 
                onClick={() => { setIsEditing(true); setActiveNote(null); setTitle(''); setContent(''); setFlashcards(null); setQuiz(null); }}
                className="p-2 bg-[#FFB74D] text-black rounded-xl hover:bg-[#FFA726] transition-all active:scale-95"
              >
                <Plus size={20} />
              </button>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".pdf,.ppt,.pptx,.doc,.docx" 
              onChange={handleFileUpload}
            />
          </div>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input 
              type="text" 
              placeholder="Search notes..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FFB74D] transition-all text-white"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-3 pr-2">
          {filteredNotes.map((note) => (
            <motion.button
              layout
              key={note.id}
              onClick={() => { setActiveNote(note); setIsEditing(false); setTitle(note.title); setContent(note.content); setFlashcards(null); setQuiz(null); }}
              className={cn(
                "glass-card p-4 text-left group relative transition-all",
                activeNote?.id === note.id ? "border-[#FFB74D]/50 bg-white/10" : "hover:bg-white/5"
              )}
            >
              <h3 className="font-bold text-white mb-1 truncate">{note.title}</h3>
              <p className="text-xs text-white/40 line-clamp-2">{note.content}</p>
              <button 
                onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                className="absolute top-4 right-4 p-2 text-red-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-400/10 rounded-lg"
              >
                <Trash2 size={14} />
              </button>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Editor/Viewer */}
      <div className="lg:col-span-8 flex flex-col gap-6">
        <AnimatePresence mode="wait">
          {isEditing || activeNote ? (
            <motion.div
              key={activeNote?.id || 'new'}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="glass-card p-8 h-full flex flex-col gap-6"
            >
              <div className="flex items-center justify-between gap-4">
                {isEditing ? (
                  <input 
                    type="text" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Note Title"
                    className="flex-1 bg-transparent text-2xl font-display font-bold text-white focus:outline-none placeholder:text-white/20"
                  />
                ) : (
                  <div className="flex flex-col">
                    <h2 className="text-2xl font-display font-bold text-white">{activeNote.title}</h2>
                    <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold">Last updated {activeNote.updatedAt?.toDate().toLocaleDateString()}</p>
                  </div>
                )}
                <div className="flex gap-2">
                  {!isEditing && activeNote && (
                    <>
                      <button 
                        onClick={generateFlashcards}
                        disabled={isGenerating}
                        className="p-2 bg-white/5 text-white/60 border border-white/10 rounded-xl hover:bg-white/10 transition-all active:scale-95"
                        title="Generate Flashcards"
                      >
                        <Brain size={20} />
                      </button>
                      <button 
                        onClick={generateQuiz}
                        disabled={isGenerating}
                        className="p-2 bg-white/5 text-white/60 border border-white/10 rounded-xl hover:bg-white/10 transition-all active:scale-95"
                        title="Take AI Quiz"
                      >
                        <GraduationCap size={20} />
                      </button>
                    </>
                  )}
                  {isEditing ? (
                    <button 
                      onClick={saveNote}
                      className="px-6 py-2 bg-[#FFB74D] text-black font-bold rounded-xl flex items-center gap-2 hover:bg-[#FFA726] transition-all active:scale-95"
                    >
                      <Save size={18} /> Save
                    </button>
                  ) : (
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="px-6 py-2 bg-white/10 text-white font-bold rounded-xl flex items-center gap-2 hover:bg-white/20 transition-all active:scale-95"
                    >
                      Edit
                    </button>
                  )}
                </div>
              </div>

              {isEditing ? (
                <textarea 
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Start writing your notes in Markdown..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-6 text-white focus:outline-none resize-none custom-scrollbar font-mono text-sm leading-relaxed"
                />
              ) : (
                <div className="flex-1 overflow-y-auto custom-scrollbar prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown>{activeNote.content}</ReactMarkdown>
                </div>
              )}
            </motion.div>
          ) : (
            <div className="glass-card p-8 h-full flex flex-col items-center justify-center text-center gap-4">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center text-white/20">
                <FileText size={40} />
              </div>
              <div>
                <h2 className="text-xl font-display font-bold text-white">No Note Selected</h2>
                <p className="text-white/40 text-sm">Select a note from the sidebar or create a new one to get started.</p>
              </div>
              <div className="flex gap-4 mt-4">
                <button 
                  onClick={() => { setIsEditing(true); setActiveNote(null); setTitle(''); setContent(''); }}
                  className="px-8 py-3 bg-[#FFB74D] text-black font-bold rounded-xl hover:bg-[#FFA726] transition-all active:scale-95 flex items-center gap-2"
                >
                  <Plus size={20} /> Create New
                </button>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="px-8 py-3 bg-white/5 text-white border border-white/10 rounded-xl hover:bg-white/10 transition-all active:scale-95 flex items-center gap-2"
                >
                  <Upload size={20} /> Upload File
                </button>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Flashcards Overlay */}
      <AnimatePresence>
        {flashcards && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <div className="max-w-xl w-full flex flex-col gap-6">
              <div className="flex justify-between items-center text-white">
                <h3 className="text-xl font-display font-bold">AI Flashcards</h3>
                <button onClick={() => setFlashcards(null)} className="p-2 hover:bg-white/10 rounded-full transition-all">
                  <X size={24} />
                </button>
              </div>

              <div className="perspective-1000 h-80">
                <motion.div
                  animate={{ rotateY: isFlipped ? 180 : 0 }}
                  transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="w-full h-full relative preserve-3d cursor-pointer"
                >
                  {/* Front */}
                  <div className="absolute inset-0 backface-hidden glass-card p-10 flex items-center justify-center text-center">
                    <p className="text-2xl font-display font-bold text-white">{flashcards[currentFlashcard].front}</p>
                    <p className="absolute bottom-6 text-[10px] text-white/20 uppercase tracking-widest font-bold">Click to flip</p>
                  </div>
                  {/* Back */}
                  <div className="absolute inset-0 backface-hidden glass-card p-10 flex items-center justify-center text-center rotate-y-180 bg-[#FFB74D]/10 border-[#FFB74D]/30">
                    <p className="text-xl text-white/80 leading-relaxed">{flashcards[currentFlashcard].back}</p>
                  </div>
                </motion.div>
              </div>

              <div className="flex justify-between items-center">
                <button 
                  disabled={currentFlashcard === 0}
                  onClick={() => { setCurrentFlashcard(prev => prev - 1); setIsFlipped(false); }}
                  className="p-4 bg-white/5 text-white rounded-2xl disabled:opacity-20 transition-all"
                >
                  <ChevronLeft size={24} />
                </button>
                <div className="text-white/40 font-bold uppercase tracking-widest text-xs">
                  {currentFlashcard + 1} / {flashcards.length}
                </div>
                <button 
                  disabled={currentFlashcard === flashcards.length - 1}
                  onClick={() => { setCurrentFlashcard(prev => prev + 1); setIsFlipped(false); }}
                  className="p-4 bg-white/5 text-white rounded-2xl disabled:opacity-20 transition-all"
                >
                  <ChevronRight size={24} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quiz Overlay */}
      <AnimatePresence>
        {quiz && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <div className="max-w-2xl w-full glass-card p-8 flex flex-col gap-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-center text-white">
                <div className="flex items-center gap-3">
                  <GraduationCap size={24} className="text-[#FFB74D]" />
                  <h3 className="text-xl font-display font-bold">AI Knowledge Quiz</h3>
                </div>
                <button onClick={() => setQuiz(null)} className="p-2 hover:bg-white/10 rounded-full transition-all">
                  <X size={24} />
                </button>
              </div>

              <div className="flex flex-col gap-10">
                {quiz.map((q, qIdx) => (
                  <div key={qIdx} className="flex flex-col gap-4">
                    <p className="text-lg text-white font-medium">{qIdx + 1}. {q.question}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {q.options.map((opt: string, oIdx: number) => {
                        const isSelected = quizAnswers[qIdx] === oIdx;
                        const isCorrect = q.correctIndex === oIdx;
                        const showResult = showQuizResults;
                        
                        return (
                          <button
                            key={oIdx}
                            disabled={showQuizResults}
                            onClick={() => setQuizAnswers(prev => ({ ...prev, [qIdx]: oIdx }))}
                            className={cn(
                              "p-4 rounded-xl text-left text-sm transition-all border",
                              !showResult && isSelected ? "bg-[#FFB74D] text-black border-[#FFB74D]" : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10",
                              showResult && isCorrect ? "bg-green-500/20 text-green-400 border-green-500/50" : "",
                              showResult && isSelected && !isCorrect ? "bg-red-500/20 text-red-400 border-red-500/50" : ""
                            )}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {!showQuizResults ? (
                <button 
                  onClick={() => setShowQuizResults(true)}
                  disabled={Object.keys(quizAnswers).length < quiz.length}
                  className="w-full py-4 bg-[#FFB74D] text-black font-bold rounded-2xl transition-all active:scale-95 disabled:opacity-50"
                >
                  Submit Quiz
                </button>
              ) : (
                <div className="flex flex-col gap-4 items-center">
                  <div className="text-2xl font-display font-bold text-white">
                    Score: {quiz.filter((q, i) => quizAnswers[i] === q.correctIndex).length} / {quiz.length}
                  </div>
                  <button 
                    onClick={() => setQuiz(null)}
                    className="px-8 py-3 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-all"
                  >
                    Close Quiz
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Overlay */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-[#FFB74D] border-t-transparent rounded-full animate-spin" />
              <p className="text-[#FFB74D] font-bold uppercase tracking-widest text-xs animate-pulse">Aethre AI is thinking...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
