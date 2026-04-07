import React, { useState, useEffect } from 'react';
import { FileText, Plus, Trash2, Save, Search, Sparkles, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { cn } from '@/src/lib/utils';
import ReactMarkdown from 'react-markdown';

export const QuestionPapers: React.FC = () => {
  const [papers, setPapers] = useState<any[]>([]);
  const [activePaper, setActivePaper] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(collection(db, 'questionPapers'), where('userId', '==', auth.currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const papersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPapers(papersData.sort((a: any, b: any) => b.createdAt?.seconds - a.createdAt?.seconds));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'questionPapers'));
    return () => unsubscribe();
  }, []);

  const savePaper = async () => {
    if (!title || !subject || !content || !auth.currentUser) return;
    try {
      if (activePaper) {
        await updateDoc(doc(db, 'questionPapers', activePaper.id), {
          title, subject, content, updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'questionPapers'), {
          userId: auth.currentUser.uid,
          title, subject, content,
          createdAt: serverTimestamp()
        });
      }
      setIsEditing(false);
      setActivePaper(null);
      setTitle('');
      setSubject('');
      setContent('');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'questionPapers');
    }
  };

  const deletePaper = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'questionPapers', id));
      if (activePaper?.id === id) {
        setActivePaper(null);
        setIsEditing(false);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'questionPapers');
    }
  };

  const filteredPapers = papers.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
      {/* Sidebar List */}
      <div className="lg:col-span-4 flex flex-col gap-4">
        <div className="glass-card p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-display font-bold text-white flex items-center gap-2">
              <BookOpen size={20} className="text-blue-400" />
              PYQ Vault
            </h2>
            <button 
              onClick={() => { setIsEditing(true); setActivePaper(null); setTitle(''); setSubject(''); setContent(''); }}
              className="p-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all active:scale-95"
            >
              <Plus size={20} />
            </button>
          </div>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input 
              type="text" 
              placeholder="Search papers or subjects..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-3 pr-2">
          {filteredPapers.map((paper) => (
            <motion.button
              layout
              key={paper.id}
              onClick={() => { setActivePaper(paper); setIsEditing(false); setTitle(paper.title); setSubject(paper.subject); setContent(paper.content); }}
              className={cn(
                "glass-card p-4 text-left group relative",
                activePaper?.id === paper.id ? "border-blue-500/50 bg-white/10" : "hover:bg-white/5"
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-white truncate pr-6">{paper.title}</h3>
                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full">{paper.subject}</span>
              </div>
              <p className="text-xs text-white/40 line-clamp-2">{paper.content}</p>
              <button 
                onClick={(e) => { e.stopPropagation(); deletePaper(paper.id); }}
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
          {isEditing || activePaper ? (
            <motion.div
              key={activePaper?.id || 'new'}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="glass-card p-8 h-full flex flex-col gap-6"
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-4">
                  {isEditing ? (
                    <div className="flex-1 flex flex-col gap-2">
                      <input 
                        type="text" 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Paper Title (e.g. Physics Midterm 2024)"
                        className="w-full bg-transparent text-2xl font-display font-bold text-white focus:outline-none placeholder:text-white/20"
                      />
                      <input 
                        type="text" 
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Subject"
                        className="w-full bg-transparent text-sm font-bold text-blue-400 uppercase tracking-widest focus:outline-none placeholder:text-blue-400/20"
                      />
                    </div>
                  ) : (
                    <div className="flex-1">
                      <h2 className="text-2xl font-display font-bold text-white">{activePaper.title}</h2>
                      <p className="text-sm font-bold text-blue-400 uppercase tracking-widest">{activePaper.subject}</p>
                    </div>
                  )}
                  <div className="flex gap-2">
                    {isEditing ? (
                      <button 
                        onClick={savePaper}
                        className="px-6 py-2 bg-blue-500 text-white font-bold rounded-xl flex items-center gap-2 hover:bg-blue-600 transition-all active:scale-95"
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
              </div>

              {isEditing ? (
                <textarea 
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Paste the questions or content here..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-6 text-white focus:outline-none resize-none custom-scrollbar font-mono text-sm"
                />
              ) : (
                <div className="flex-1 overflow-y-auto custom-scrollbar prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown>{activePaper.content}</ReactMarkdown>
                </div>
              )}
            </motion.div>
          ) : (
            <div className="glass-card p-8 h-full flex flex-col items-center justify-center text-center gap-4">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center text-white/20">
                <FileText size={40} />
              </div>
              <div>
                <h2 className="text-xl font-display font-bold text-white">No Paper Selected</h2>
                <p className="text-white/40 text-sm">Select a question paper from the vault or add a new one.</p>
              </div>
              <button 
                onClick={() => { setIsEditing(true); setActivePaper(null); setTitle(''); setSubject(''); setContent(''); }}
                className="mt-4 px-8 py-3 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 transition-all active:scale-95 flex items-center gap-2"
              >
                <Plus size={20} /> Add New Paper
              </button>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
