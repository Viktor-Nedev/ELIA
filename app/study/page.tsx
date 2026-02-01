"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { sustainabilityService } from "@/lib/sustainability.service";
import { UserProfile, QuizQuestion } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, Brain, Trophy, Zap, Target, Flame, Star, 
  Clock, CheckCircle, XCircle, AlertCircle, RefreshCw,
  Play, Pause, Volume2, VolumeX, Settings,
  Award, Users, BarChart3, Leaf, Droplets,
  Cloud, Recycle, Battery, Wind, Sun, 
  BookOpen, Puzzle, Gamepad2,
  Timer, ChevronRight, ChevronLeft, HelpCircle,
  Crown, Lock, Unlock, RotateCcw,
  Sparkles, Target as TargetIcon
} from "lucide-react";

export default function StudyPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"quizzes" | "games">("quizzes");
  // Quiz State
  const [currentQuiz, setCurrentQuiz] = useState<QuizQuestion | null>(null);
  const [gameActive, setGameActive] = useState(false);
  const [score, setScore] = useState(0); // This will be points earned in current session
  const [timeLeft, setTimeLeft] = useState(60);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizResult, setQuizResult] = useState<{isCorrect: boolean, points: number} | null>(null);

  // User/Global State
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [leaderboard, setLeaderboard] = useState<UserProfile[]>([]);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [isLoading, setIsLoading] = useState(true);
  const [soundOn, setSoundOn] = useState(true);

  // Load Initial Data
  useEffect(() => {
    async function init() {
      if (user) {
        try {
          const [profile, leaders] = await Promise.all([
            sustainabilityService.getUserProfile(user.uid),
            sustainabilityService.getLeaderboard('weekly', user.uid)
          ]);
          setUserProfile(profile);
          setLeaderboard(leaders);
        } catch (e) {
          console.error("Failed to load study data", e);
        }
      }
      setIsLoading(false);
    }
    init();
  }, [user]);

  // Start quiz timer
  useEffect(() => {
    if (gameActive && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      handleTimeUp();
    }
  }, [gameActive, timeLeft]);

  const startQuiz = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const quiz = await sustainabilityService.getRandomQuiz(difficulty);
      if (quiz) {
        setCurrentQuiz(quiz);
        setGameActive(true);
        setTimeLeft(60);
        setScore(0);
        setQuizResult(null);
        setSelectedAnswer(null);
        setShowExplanation(false);
        setQuizCompleted(false);
      }
    } catch (e) {
      console.error("Failed to start quiz", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSelect = async (index: number) => {
    if (!gameActive || selectedAnswer !== null || !currentQuiz || !user) return;
    
    setSelectedAnswer(index);
    
    try {
      const result = await sustainabilityService.submitQuizAnswer(user.uid, currentQuiz.id!, index, difficulty);
      
      setQuizResult({
        isCorrect: result.isCorrect,
        points: result.pointsEarned
      });
      setShowExplanation(true);
      setGameActive(false); // Stop timer
      setQuizCompleted(true);
      setScore(result.pointsEarned);

      // Refresh profile to update stats
      const profile = await sustainabilityService.getUserProfile(user.uid);
      setUserProfile(profile);

    } catch (e) {
      console.error("Failed to submit answer", e);
    }
  };

  const handleTimeUp = () => {
    setGameActive(false);
    setQuizCompleted(true);
    // Could auto-submit as wrong here if desired
  };

  const startGame = async (gameId: string) => {
    if (!user) return;
    const check = await sustainabilityService.checkGameCooldown(user.uid, gameId);
    
    if (check.canPlay) {
      // Navigate to game or start game component
      // For now we only have Carbon Sort which is a separate page/component
      if (gameId === 'carbon-sort') {
         window.location.href = "/carbon-sort";
      } else {
         console.log("Game not implemented yet");
      }
    } else {
      alert(`Cooldown active! Wait ${check.timeLeft}s`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050505] text-zinc-100">
        <div className="max-w-[1200px] mx-auto px-6 py-12">
          <div className="mb-12">
            <div className="h-6 bg-zinc-900 rounded w-32 mb-6"></div>
            <div className="h-12 bg-zinc-900 rounded w-64 mb-2"></div>
            <div className="h-4 bg-zinc-900 rounded w-96"></div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-8">
                <div className="h-8 bg-zinc-900 rounded w-48 mb-6"></div>
                <div className="h-4 bg-zinc-900 rounded w-64 mb-8"></div>
                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="h-24 bg-zinc-900 rounded-2xl"></div>
                  <div className="h-24 bg-zinc-900 rounded-2xl"></div>
                  <div className="h-24 bg-zinc-900 rounded-2xl"></div>
                </div>
                <div className="h-64 bg-zinc-900 rounded-2xl"></div>
              </div>
            </div>
            
            <div className="space-y-8">
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-8">
                <div className="h-6 bg-zinc-900 rounded w-32 mb-6"></div>
                <div className="space-y-4">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="h-12 bg-zinc-900 rounded-xl"></div>
                  ))}
                </div>
              </div>
              
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-8">
                <div className="h-6 bg-zinc-900 rounded w-32 mb-6"></div>
                <div className="space-y-3">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="h-16 bg-zinc-900 rounded-xl"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100">
      <div className="max-w-[1200px] mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="text-5xl font-black text-white italic uppercase tracking-tighter mb-2">Eco Academy</h1>
              <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">
                Learn • Play • Earn • Master Sustainable Practices
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="px-6 py-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl">
                <div className="flex items-center gap-3">
                  <Trophy className="w-5 h-5 text-emerald-400" />
                  <div>
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Current Score</p>
                    <p className="text-2xl font-black text-white">{score.toLocaleString()}</p>
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-3 bg-orange-500/10 border border-orange-500/30 rounded-2xl">
                <div className="flex items-center gap-3">
                  <Flame className="w-5 h-5 text-orange-400" />
                  <div>
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Streak</p>
                    <p className="text-2xl font-black text-white">{userProfile?.quizStats?.currentStreak || 0}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Navigation Tabs */}
        <div className="flex flex-wrap gap-4 border-b border-zinc-800 pb-6 mb-8">
          <TabButton 
            active={activeTab === "quizzes"} 
            onClick={() => setActiveTab("quizzes")}
            label="Quizzes" 
            icon={<Brain className="w-5 h-5" />}
          />
          <TabButton 
            active={activeTab === "games"} 
            onClick={() => setActiveTab("games")}
            label="Mini Games" 
            icon={<Gamepad2 className="w-5 h-5" />}
          />
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Active Game/Quiz */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {activeTab === "quizzes" && (
                <motion.div
                  key="quizzes"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-8">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-2xl font-black text-white italic uppercase flex items-center gap-3">
                          <Brain className="w-7 h-7 text-emerald-500" />
                          Sustainability Quiz
                        </h3>
                        <p className="text-zinc-500 text-sm mt-2">Test your knowledge and earn points for correct answers!</p>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => setSoundOn(!soundOn)}
                          className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-2xl transition-colors"
                        >
                          {soundOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                        </button>
                        <button 
                          onClick={() => setDifficulty(difficulty === "easy" ? "medium" : difficulty === "medium" ? "hard" : "easy")}
                          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors text-sm font-black uppercase"
                        >
                          {difficulty}
                        </button>
                      </div>
                    </div>

                    {/* Game Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-8">
                      <StatCard 
                        label="Time Left" 
                        value={timeLeft.toString()} 
                        icon={<Clock className="w-4 h-4" />}
                        color={timeLeft < 10 ? "text-red-400" : "text-emerald-400"}
                      />
                      <StatCard 
                        label="Points Earned" 
                        value={quizResult ? `+${quizResult.points}` : "0"} 
                        icon={<Star className="w-4 h-4" />}
                        color="text-yellow-400"
                      />
                      <StatCard 
                        label="Streak" 
                        value={(userProfile?.quizStats?.currentStreak || 0).toString()} 
                        icon={<Flame className="w-4 h-4" />}
                        color="text-orange-400"
                      />
                    </div>

                    {/* Quiz Content */}
                    {!gameActive && !quizCompleted ? (
                      <div className="text-center py-12">
                        <Brain className="w-24 h-24 text-zinc-800 mx-auto mb-6" />
                        <h4 className="text-2xl font-black text-white mb-4">Ready to Test Your Knowledge?</h4>
                        <p className="text-zinc-500 mb-8 max-w-md mx-auto">
                          Answer a random sustainability question to earn points and keep your streak alive!
                        </p>
                        <button 
                          onClick={startQuiz}
                          className="px-8 py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-transform flex items-center gap-3 mx-auto"
                        >
                          <Play className="w-5 h-5" /> Start Quiz
                        </button>
                      </div>
                    ) : quizCompleted && quizResult ? (
                      <div className="text-center py-12">
                        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-emerald-500/20 to-blue-500/20 flex items-center justify-center mx-auto mb-6">
                           {quizResult.isCorrect ? <CheckCircle className="w-16 h-16 text-emerald-400" /> : <XCircle className="w-16 h-16 text-red-500" />}
                        </div>
                        <h4 className="text-3xl font-black text-white mb-4">{quizResult.isCorrect ? "Correct!" : "Incorrect"}</h4>
                        <p className="text-5xl font-black text-emerald-400 mb-2">+{quizResult.points} Points</p>
                        
                        {/* Explanation */}
                         <div className="max-w-md mx-auto mb-8 p-4 bg-zinc-950/50 rounded-xl border border-zinc-800">
                             <p className="text-zinc-300 text-sm">{currentQuiz?.explanation}</p>
                         </div>

                        <div className="flex gap-4 justify-center">
                          <button 
                            onClick={startQuiz}
                            className="px-6 py-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 hover:bg-emerald-500/20 transition-colors font-black uppercase flex items-center gap-2"
                          >
                            <RefreshCw className="w-4 h-4" /> Next Question
                          </button>
                         <Link href="/achievements"
                            className="px-6 py-3 bg-blue-500/10 border border-blue-500/30 rounded-2xl text-blue-400 hover:bg-blue-500/20 transition-colors font-black uppercase flex items-center gap-2"
                          >
                            <Award className="w-4 h-4" /> View Achievements
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-8">
                        {/* Question Progress - Just one question now */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                             <Leaf className="w-4 h-4 text-emerald-500" />
                            <span className="text-xs font-black text-zinc-600 uppercase tracking-widest">{currentQuiz?.category}</span>
                          </div>
                        </div>

                        {/* Question Text */}
                        <div className="p-6 bg-zinc-950/50 border border-zinc-800 rounded-2xl">
                          <h2 className="text-xl font-bold text-white leading-relaxed">
                            {currentQuiz?.question}
                          </h2>
                        </div>

                        {/* Answers */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {currentQuiz?.options.map((option, index) => (
                            <button 
                              key={index}
                              disabled={selectedAnswer !== null}
                              className={`p-6 border rounded-2xl text-left transition-all 
                                ${selectedAnswer === index 
                                    ? 'bg-emerald-500/20 border-emerald-500' 
                                    : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700 hover:scale-[1.02]'
                                }`}
                              onClick={() => handleAnswerSelect(index)}
                            >
                              <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${selectedAnswer === index ? 'bg-emerald-500 text-white' : 'bg-zinc-800 text-zinc-400'}`}>
                                  {String.fromCharCode(65 + index)}
                                </div>
                                <span className="text-zinc-200 font-medium">{option}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === "games" && (
                <motion.div
                  key="games"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-8">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-2xl font-black text-white italic uppercase flex items-center gap-3">
                          <Gamepad2 className="w-7 h-7 text-blue-500" />
                          Mini Games
                        </h3>
                        <p className="text-zinc-500 text-sm mt-2">Play interactive games to learn about sustainability!</p>
                      </div>
                    </div>

                    {/* Your Stats - Moved here */}
                    <div className="mb-8">
                      <h4 className="text-sm font-black text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" /> Your Game Stats
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 bg-zinc-950/50 border border-zinc-800 rounded-2xl">
                          <div className="text-xs text-zinc-600 uppercase tracking-widest mb-2">Games Played</div>
                          <div className="text-2xl font-black text-white">0</div>
                        </div>
                        <div className="p-4 bg-zinc-950/50 border border-zinc-800 rounded-2xl">
                          <div className="text-xs text-zinc-600 uppercase tracking-widest mb-2">High Score</div>
                          <div className="text-2xl font-black text-white">0</div>
                        </div>
                        <div className="p-4 bg-zinc-950/50 border border-zinc-800 rounded-2xl">
                          <div className="text-xs text-zinc-600 uppercase tracking-widest mb-2">Total Time</div>
                          <div className="text-2xl font-black text-white">0m</div>
                        </div>
                        <div className="p-4 bg-zinc-950/50 border border-zinc-800 rounded-2xl">
                          <div className="text-xs text-zinc-600 uppercase tracking-widest mb-2">Perfect Games</div>
                          <div className="text-2xl font-black text-white">0</div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Game 1: Carbon Sort */}
             <div className="p-6 bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-zinc-800 rounded-2xl hover:scale-[1.02] transition-transform cursor-pointer group">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-black/30 flex items-center justify-center">
                          <Recycle className="w-8 h-8 text-emerald-500" />
    </div>
    <div>
      <h4 className="font-black text-white text-lg">Carbon Sort</h4>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-xs px-2 py-1 bg-zinc-900 rounded-md">Easy</span>
        <span className="text-xs text-zinc-600">50 pts/game</span>
      </div>
    </div>
  </div>
  <p className="text-zinc-400 text-sm mb-4">Sort waste items into correct recycling bins. Learn proper waste management.</p>
  <div className="flex items-center justify-between">
    <span className="text-xs text-zinc-600">Cooldown: 5m</span>
    <button 
      onClick={() => startGame('carbon-sort')}
      className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-sm font-black uppercase hover:bg-emerald-500/20 transition-colors"
    >
      Play Now
    </button>
  </div>
</div>





                      {/* Game 2: Water Flow */}
                      <div className="p-6 bg-gradient-to-br from-blue-500/20 to-blue-500/5 border border-zinc-800 rounded-2xl hover:scale-[1.02] transition-transform cursor-pointer group"
                           onClick={() => startGame("water-flow")}>
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-14 h-14 rounded-2xl bg-black/30 flex items-center justify-center">
                            <Droplets className="w-8 h-8 text-blue-500" />
                          </div>
                          <div>
                            <h4 className="font-black text-white text-lg">Water Flow</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs px-2 py-1 bg-zinc-900 rounded-md">Medium</span>
                              <span className="text-xs text-zinc-600">100 pts/game</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-zinc-400 text-sm mb-4">Guide water to conservation points while avoiding leaks.</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-zinc-600">Best: 0 pts</span>
                          <button className="px-4 py-2 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-xl text-sm font-black uppercase hover:bg-blue-500/20 transition-colors">
                            Play Now
                          </button>
                        </div>
                      </div>

                      {/* Game 3: Energy Chain */}
                      <div className="p-6 bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 border border-zinc-800 rounded-2xl hover:scale-[1.02] transition-transform cursor-pointer group"
                           onClick={() => startGame("energy-chain")}>
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-14 h-14 rounded-2xl bg-black/30 flex items-center justify-center">
                            <Zap className="w-8 h-8 text-yellow-500" />
                          </div>
                          <div>
                            <h4 className="font-black text-white text-lg">Energy Chain</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs px-2 py-1 bg-zinc-900 rounded-md">Hard</span>
                              <span className="text-xs text-zinc-600">150 pts/game</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-zinc-400 text-sm mb-4">Connect renewable energy sources to power cities efficiently.</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-zinc-600">Best: 0 pts</span>
                          <button className="px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 rounded-xl text-sm font-black uppercase hover:bg-yellow-500/20 transition-colors">
                            Play Now
                          </button>
                        </div>
                      </div>

                      {/* Game 4: Eco Memory */}
                      <div className="p-6 bg-gradient-to-br from-purple-500/20 to-purple-500/5 border border-zinc-800 rounded-2xl hover:scale-[1.02] transition-transform cursor-pointer group"
                           onClick={() => startGame("eco-memory")}>
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-14 h-14 rounded-2xl bg-black/30 flex items-center justify-center">
                            <Brain className="w-8 h-8 text-purple-500" />
                          </div>
                          <div>
                            <h4 className="font-black text-white text-lg">Eco Memory</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs px-2 py-1 bg-zinc-900 rounded-md">Medium</span>
                              <span className="text-xs text-zinc-600">120 pts/game</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-zinc-400 text-sm mb-4">Match sustainable practice pairs to improve your memory.</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-zinc-600">Best: 0 pts</span>
                          <button className="px-4 py-2 bg-purple-500/10 border border-purple-500/30 text-purple-400 rounded-xl text-sm font-black uppercase hover:bg-purple-500/20 transition-colors">
                            Play Now
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 p-6 bg-zinc-950/50 border border-zinc-800 rounded-2xl">
                      <h4 className="text-lg font-black text-white mb-3">How to Play</h4>
                      <p className="text-zinc-400 text-sm mb-4">
                        Each game teaches different aspects of sustainability. Complete games to earn points and unlock achievements.
                        Higher difficulty games award more points.
                      </p>
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm text-zinc-600">New games coming soon!</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Column - Leaderboards */}
          <div className="space-y-8">
            {/* Weekly Leaders Card */}
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-8">
              <h4 className="text-sm font-black text-zinc-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Trophy className="w-4 h-4" /> Weekly Leaders
              </h4>
              
              <div className="space-y-3">
                {leaderboard.length > 0 ? leaderboard.slice(0, 5).map((u, i) => (
                  <div key={u.id} className="flex items-center gap-3 p-3 bg-zinc-950/50 rounded-xl">
                      <span className={`text-lg font-black w-6 text-center ${i === 0 ? "text-yellow-400" : i === 1 ? "text-zinc-300" : i === 2 ? "text-orange-400" : "text-zinc-600"}`}>
                        #{i + 1}
                      </span>
                      <div className="flex-1">
                          <p className="text-sm font-bold text-white max-w-[120px] truncate">{u.displayName || "Anonymous"}</p>
                          <p className="text-xs text-zinc-500">{u.weeklyPoints || 0} pts</p>
                      </div>
                  </div>
                )) : (
                    <p className="text-zinc-500 text-center py-4">No leaders this week yet.</p>
                )}
              </div>
              
              <div className="mt-6 p-4 bg-zinc-950/50 border border-zinc-800 rounded-xl">
                <div className="flex items-center gap-3">
                  <Crown className="w-4 h-4 text-yellow-500" />
                  <div>
                    <p className="text-sm font-black text-white">Your Rank: #--</p>
                    <p className="text-xs text-zinc-600">Play quizzes to join the leaderboard</p>
                  </div>
                </div>
              </div>
            </div>


            {/* Upcoming Features */}
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-8">
              <h4 className="text-sm font-black text-zinc-400 uppercase tracking-widest mb-6">Coming Soon</h4>
              
              <div className="space-y-4">
                <div className="p-3 bg-zinc-950/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      <Users className="w-4 h-4 text-purple-500" />
                    </div>
                    <div>
                      <p className="font-black text-white">Multiplayer Games</p>
                      <p className="text-xs text-zinc-600">Challenge friends in real-time</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-3 bg-zinc-950/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <TargetIcon className="w-4 h-4 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-black text-white">Daily Tournaments</p>
                      <p className="text-xs text-zinc-600">Compete for special rewards</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper Components
function TabButton({ active, onClick, label, icon }: { 
  active: boolean; 
  onClick: () => void; 
  label: string; 
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-8 py-4 rounded-2xl flex items-center gap-3 transition-all ${active ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-zinc-900/40 border border-zinc-800 text-zinc-500 hover:text-zinc-300'}`}
    >
      {icon}
      <span className="text-sm font-black uppercase tracking-widest">{label}</span>
    </button>
  );
}

function StatCard({ label, value, icon, color }: { 
  label: string; 
  value: string; 
  icon: React.ReactNode;
  color?: string;
}) {
  return (
    <div className="p-4 bg-zinc-950/50 border border-zinc-800 rounded-2xl">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-zinc-600 uppercase tracking-widest">{label}</span>
        <div className="p-2 rounded-lg bg-zinc-800">
          {icon}
        </div>
      </div>
      <p className={`text-2xl font-black ${color || 'text-white'}`}>{value}</p>
    </div>
  );
}

