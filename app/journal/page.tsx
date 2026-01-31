"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { processJournalEntry } from "@/app/actions/ai.actions";
import { sustainabilityService } from "@/lib/sustainability.service";
import { AIAnalysisResponse } from "@/lib/types";
import { 
  ArrowLeft, Send, Sparkles, CheckCircle2, HelpCircle, 
  Bot, User, Leaf, Zap, Droplet, Flame, Recycle, 
  MessageSquare, TrendingUp, Clock, Calendar, AlertCircle,
  ChevronRight, Wand2, Edit3, Save, RotateCcw, Lightbulb
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function JournalPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [result, setResult] = useState<AIAnalysisResponse | null>(null);
  const [error, setError] = useState("");
  const [isRevision, setIsRevision] = useState(false);
  const [aiQuestions, setAiQuestions] = useState<string[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<number>(0);
  const [conversation, setConversation] = useState<Array<{
    role: 'user' | 'ai';
    content: string;
    timestamp: Date;
  }>>([]);

  const quickPrompts = [
    "Biked to work instead of driving",
    "Used reusable containers for lunch",
    "Took shorter showers today",
    "Recycled plastic and paper waste",
    "Turned off unused lights and electronics",
    "Ate vegetarian meals today",
    "Used public transportation",
    "Conserved water while washing dishes"
  ];

  // Load today's entry if exists
  useEffect(() => {
    const fetchToday = async () => {
      if (!user) return;
      try {
        const todayEntry = await sustainabilityService.getEntryForToday(user.uid);
        if (todayEntry) {
          setText(todayEntry.rawText);
          setIsRevision(true);
          // Initialize conversation with existing entry
          setConversation([{
            role: 'user',
            content: todayEntry.rawText,
            timestamp: new Date()
          }]);
        }
      } catch (err) {
        console.error("Load entry error:", err);
      } finally {
        setInitialLoading(false);
      }
    };
    fetchToday();
  }, [user]);

  // Add user message to conversation
  const addUserMessage = (content: string) => {
    setConversation(prev => [...prev, {
      role: 'user',
      content,
      timestamp: new Date()
    }]);
  };

  // Add AI message to conversation
  const addAIMessage = (content: string) => {
    setConversation(prev => [...prev, {
      role: 'ai',
      content,
      timestamp: new Date()
    }]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text || !user) return;
    
    setLoading(true);
    setError("");
    try {
      addUserMessage(text);
      
      const data = await processJournalEntry(text);
      setResult(data);
      
      // Add AI comment to conversation
      addAIMessage(data.comment);
      
      // If there are follow-up questions, show them
      if (data.followUpQuestions?.length > 0) {
        setAiQuestions(data.followUpQuestions);
        setCurrentQuestion(0);
        addAIMessage(`I need some clarification to better calculate your impact. ${data.followUpQuestions[0]}`);
      }
      
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerQuestion = (answer: string) => {
    if (!user || !aiQuestions[currentQuestion]) return;
    
    addUserMessage(`Answer: ${answer}`);
    
    // Move to next question or finish
    if (currentQuestion < aiQuestions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      addAIMessage(aiQuestions[currentQuestion + 1]);
    } else {
      // Process with answers
      addAIMessage("Thanks for the clarification! Updating my analysis...");
      setAiQuestions([]);
      // Here you would re-process with the answers
    }
  };

  const handleConfirm = async () => {
    if (!user || !result) return;
    setLoading(true);
    try {
      await sustainabilityService.upsertEntry({
        userId: user.uid,
        date: new Date().toISOString().split("T")[0],
        rawText: text,
        emissions: result.emissions,
        points: result.points,
        aiComment: result.comment,
      });
      router.push("/");
    } catch (err: any) {
      setError("Failed to save entry.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 lg:px-8 pt-4 lg:pt-6">
            
            {/* Header */}
            <motion.header 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-between items-center gap-4 mb-6 lg:mb-8"
            >
              <div className="hidden lg:flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center">
                  <Bot size={28} />
                </div>
                <div>
                  <h1 className="text-3xl font-black tracking-tight text-white uppercase italic">
                    AI <span className="text-emerald-500">Journal</span>
                  </h1>
                  <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">Conversational Sustainability Log</p>
                </div>
              </div>

              <div className="lg:hidden">
                <h1 className="text-2xl font-black tracking-tight text-white uppercase italic">
                  AI <span className="text-emerald-500">Journal</span>
                </h1>
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Sustainability Log</p>
              </div>


            </motion.header>

            {initialLoading ? (
              <div className="h-[600px] flex items-center justify-center">
                <div className="text-center space-y-6">
                  <div className="w-16 h-16 border-4 border-zinc-800 border-t-emerald-500 rounded-full animate-spin mx-auto"></div>
                  <p className="text-zinc-500 font-medium">Loading your journal...</p>
                </div>
              </div>
            ) : (
              <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 pb-20">
                
                {/* Left Column - Chat Interface */}
                <div className="lg:col-span-8 space-y-6">
                  
                  {/* Conversation Panel */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="relative">
                        <div className="absolute inset-0 bg-emerald-500/20 blur-md rounded-full"></div>
                        <Bot size={24} className="text-emerald-400 relative z-10" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-white">AI Conversation</h2>
                        <p className="text-sm text-zinc-400">Chat with Eco AI about your day</p>
                      </div>
                      {isRevision && (
                        <span className="ml-auto px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-xs font-bold text-amber-400 uppercase">
                          Editing
                        </span>
                      )}
                    </div>

                    {/* Conversation Messages */}
                    <div className="h-[400px] overflow-y-auto space-y-6 p-2">
                      {conversation.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                          <div className="w-20 h-20 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
                            <Sparkles size={32} className="text-emerald-400" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-white mb-2">Start Your Sustainability Story</h3>
                            <p className="text-zinc-400">Tell me about your eco-friendly actions today!</p>
                          </div>
                        </div>
                      ) : (
                        <AnimatePresence>
                          {conversation.map((msg, idx) => (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              className={`flex gap-3 ${msg.role === 'ai' ? 'flex-row' : 'flex-row-reverse'}`}
                            >
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                msg.role === 'ai' 
                                  ? 'bg-emerald-500/20 text-emerald-400' 
                                  : 'bg-blue-500/20 text-blue-400'
                              }`}>
                                {msg.role === 'ai' ? <Bot size={16} /> : <User size={16} />}
                              </div>
                              <div className={`flex-1 ${msg.role === 'ai' ? 'text-left' : 'text-right'}`}>
                                <div className={`inline-block max-w-[80%] p-4 rounded-2xl ${
                                  msg.role === 'ai'
                                    ? 'bg-zinc-800/50 text-zinc-200 border border-zinc-700/50'
                                    : 'bg-gradient-to-r from-blue-500/20 to-emerald-500/20 text-white border border-blue-500/30'
                                }`}>
                                  <p className="text-sm">{msg.content}</p>
                                </div>
                                <p className="text-xs text-zinc-500 mt-2">
                                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      )}
                    </div>

                    {/* AI Questions */}
                    {aiQuestions.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <HelpCircle size={16} className="text-emerald-400" />
                          <span className="text-sm font-bold text-emerald-400">Question {currentQuestion + 1} of {aiQuestions.length}</span>
                        </div>
                        <p className="text-white font-medium mb-4">{aiQuestions[currentQuestion]}</p>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleAnswerQuestion("Yes")}
                            className="px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-400 font-medium hover:bg-emerald-500/30 transition-colors"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => handleAnswerQuestion("No")}
                            className="px-4 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-zinc-400 font-medium hover:bg-zinc-800 transition-colors"
                          >
                            No
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>

                  {/* Input Form */}
                  <motion.form 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    onSubmit={handleSubmit} 
                    className="space-y-4"
                  >
                    <div className="relative group">
                      <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-50 transition duration-1000"></div>
                      <textarea
                        required
                        className="w-full h-[180px] bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 text-lg font-medium text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-all resize-none shadow-2xl relative z-10"
                        placeholder="Today I biked to work, avoided plastic packaging at lunch, and used cold water for laundry..."
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                      />
                    </div>

                    <div className="flex gap-4">
                      <button
                        type="submit"
                        disabled={loading || !text}
                        className="flex-1 py-5 bg-gradient-to-r from-emerald-600 to-blue-600 rounded-2xl font-bold text-white uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg shadow-emerald-600/20 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:grayscale"
                      >
                        {loading ? (
                          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                          <>
                            <Sparkles size={20} />
                            {isRevision ? "Update Analysis" : "Analyze with AI"}
                          </>
                        )}
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setText("")}
                        disabled={!text}
                        className="px-6 py-5 bg-zinc-900/50 border border-zinc-800/50 rounded-2xl font-medium text-zinc-400 hover:text-white transition-colors disabled:opacity-30"
                      >
                        <RotateCcw size={20} />
                      </button>
                    </div>
                  </motion.form>
                </div>

                {/* Right Column - Analysis & Stats */}
                <div className="lg:col-span-4 space-y-6">
                  
                  {/* Analysis Result */}
                  {result && (
                    <motion.div 
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-gradient-to-b from-emerald-900/20 to-blue-900/20 backdrop-blur-xl border border-emerald-800/30 rounded-2xl p-6"
                    >
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                          <Wand2 size={20} className="text-emerald-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white">AI Analysis</h3>
                          <p className="text-sm text-emerald-400">Complete!</p>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="p-4 bg-black/30 rounded-xl border border-emerald-800/20">
                          <p className="text-emerald-300 italic text-sm">"{result.comment}"</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <StatCard 
                            icon={<Flame size={16} />}
                            label="CO₂ Saved"
                            value={`${result.emissions.co2}kg`}
                            color="from-orange-500 to-red-500"
                          />
                          <StatCard 
                            icon={<Droplet size={16} />}
                            label="Water Saved"
                            value={`${result.emissions.water}L`}
                            color="from-blue-400 to-cyan-500"
                          />
                          <StatCard 
                            icon={<Zap size={16} />}
                            label="Energy Saved"
                            value={`${result.emissions.energy}kWh`}
                            color="from-yellow-500 to-amber-500"
                          />
                          <StatCard 
                            icon={<Leaf size={16} />}
                            label="Points Earned"
                            value={`+${result.points}`}
                            color="from-emerald-500 to-green-500"
                          />
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-zinc-400">Impact Score</span>
                            <span className="text-lg font-bold text-white">{Math.round(result.points * 10)}/100</span>
                          </div>
                          <div className="w-full bg-zinc-800/50 rounded-full h-2">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(100, Math.round(result.points * 10))}%` }}
                              className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full"
                            ></motion.div>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <button
                            onClick={() => setResult(null)}
                            className="flex-1 py-3 bg-zinc-900/50 border border-zinc-800/50 rounded-xl font-medium text-zinc-400 hover:text-white transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={handleConfirm}
                            disabled={loading}
                            className="flex-1 py-3 bg-white text-zinc-950 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all"
                          >
                            {loading ? (
                              <div className="w-5 h-5 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin"></div>
                            ) : (
                              <>
                                <CheckCircle2 size={16} />
                                Save
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Daily Impact Stats */}
                  <motion.div 
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6"
                  >
                    <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-4">Daily Impact</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-zinc-800/30 rounded-xl">
                        <div className="flex items-center gap-3">
                          <Calendar size={16} className="text-zinc-500" />
                          <span className="text-sm text-zinc-300">Today's Progress</span>
                        </div>
                        <span className="text-emerald-400 font-bold">{result ? 'Complete' : 'Pending'}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-zinc-800/30 rounded-xl">
                        <div className="flex items-center gap-3">
                          <TrendingUp size={16} className="text-zinc-500" />
                          <span className="text-sm text-zinc-300">Streak</span>
                        </div>
                        <span className="text-orange-400 font-bold">7 days</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-zinc-800/30 rounded-xl">
                        <div className="flex items-center gap-3">
                          <Clock size={16} className="text-zinc-500" />
                          <span className="text-sm text-zinc-300">Last Entry</span>
                        </div>
                        <span className="text-blue-400 font-bold">Today</span>
                      </div>
                    </div>
                  </motion.div>

                  {/* AI Tips */}
                  <motion.div 
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <Lightbulb size={16} className="text-emerald-400" />
                      <h3 className="text-sm font-bold uppercase tracking-widest text-emerald-400">AI Tips</h3>
                    </div>
                    <ul className="space-y-3 mb-6">
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2"></div>
                        <p className="text-sm text-zinc-300">Be specific about distances, durations, and quantities</p>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2"></div>
                        <p className="text-sm text-zinc-300">Mention alternatives you chose (e.g., "biked instead of drove")</p>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2"></div>
                        <p className="text-sm text-zinc-300">Include both positive actions and missed opportunities</p>
                      </li>
                    </ul>

                    {/* Quick Prompts под AI Tips */}
                    <div className="pt-4 border-t border-zinc-800/30">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3">Quick Prompts</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {quickPrompts.slice(0, 4).map((prompt, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setText(prev => prev ? `${prev}. ${prompt}` : prompt)}
                            className="p-2 bg-zinc-800/30 border border-zinc-700/30 rounded-lg text-xs text-zinc-300 hover:text-white hover:border-emerald-500/30 hover:bg-emerald-500/10 transition-all text-left"
                          >
                            {prompt}
                          </button>
                        ))}
                      </div>
                      {quickPrompts.length > 4 && (
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {quickPrompts.slice(4, 8).map((prompt, idx) => (
                            <button
                              key={idx + 4}
                              type="button"
                              onClick={() => setText(prev => prev ? `${prev}. ${prompt}` : prompt)}
                              className="p-2 bg-zinc-800/30 border border-zinc-700/30 rounded-lg text-xs text-zinc-300 hover:text-white hover:border-emerald-500/30 hover:bg-emerald-500/10 transition-all text-left"
                            >
                              {prompt}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                </div>
              </main>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl"
              >
                <div className="flex items-center gap-2 text-red-400">
                  <AlertCircle size={16} />
                  <p className="text-sm font-medium">{error}</p>
                </div>
              </motion.div>
            )}
          </div>
        </div>
  );
}


function StatCard({ icon, label, value, color }: { 
  icon: React.ReactNode, 
  label: string, 
  value: string, 
  color: string 
}) {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4 text-center">
      <div className={`inline-flex p-2 rounded-lg bg-gradient-to-br ${color} mb-2`}>
        {icon}
      </div>
      <p className="text-xs font-bold text-zinc-500 uppercase tracking-tighter mb-1">{label}</p>
      <p className="text-lg font-black text-white">{value}</p>
    </div>
  );
}