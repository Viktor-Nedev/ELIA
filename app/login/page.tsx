"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const { signInWithGoogle, user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (user && !authLoading) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    try {
      await signInWithGoogle();
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Google authentication failed.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] selection:bg-blue-500/30">
      {/* Dynamic Mesh Gradient Background */}
      <div className="fixed inset-0 overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/10 blur-[120px] rounded-full animate-pulse delay-700"></div>
      </div>

      <div className="w-full max-w-[440px] px-6 py-12">
        <div className="relative group">
          {/* Subtle Glow behind the card */}
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 to-emerald-600/20 rounded-[2.5rem] blur-2xl opacity-0 group-hover:opacity-100 transition duration-1000"></div>
          
          <div className="relative bg-zinc-900/50 backdrop-blur-2xl border border-zinc-800/50 p-10 rounded-[2rem] shadow-2xl">
            <div className="space-y-2 mb-10 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-emerald-500 p-[1px] mb-4">
                <div className="w-full h-full bg-zinc-950 rounded-[15px] flex items-center justify-center">
                  <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-emerald-400 rounded-full animate-ping"></div>
                </div>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-white">
                ELIA <span className="text-zinc-500 font-light text-2xl ml-1">Portal</span>
              </h1>
              <p className="text-zinc-400 text-sm">Enterprise secure access gateway</p>
            </div>

            <form onSubmit={handleEmailLogin} className="space-y-5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider ml-1">Company Email</label>
                <input
                  type="email"
                  required
                  className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition duration-200"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Password</label>
                  <a href="#" className="text-[10px] text-zinc-500 hover:text-blue-400 transition-colors uppercase tracking-widest font-bold">Forgot?</a>
                </div>
                <input
                  type="password"
                  required
                  className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition duration-200"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {error && (
                <div className="animate-in fade-in slide-in-from-top-1 text-red-400 text-xs font-medium px-4 py-3 bg-red-400/5 border border-red-400/20 rounded-xl">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || authLoading}
                className="relative w-full overflow-hidden group/btn"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-emerald-600 group-hover/btn:scale-105 transition-transform duration-500"></div>
                <div className="relative flex items-center justify-center py-3 px-4 font-bold text-white text-sm">
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    "Authorize Session"
                  )}
                </div>
              </button>
            </form>

            <div className="my-8 flex items-center">
              <div className="flex-1 h-[1px] bg-zinc-800"></div>
              <span className="px-4 text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em]">External Auth</span>
              <div className="flex-1 h-[1px] bg-zinc-800"></div>
            </div>

            <button
              onClick={handleGoogleLogin}
              disabled={loading || authLoading}
              className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 font-semibold py-3 rounded-xl hover:bg-zinc-900 hover:border-zinc-700 hover:text-white transition-all duration-300 flex items-center justify-center space-x-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span className="text-xs uppercase tracking-widest">Sign in with Google</span>
            </button>

            <div className="mt-8 text-center">
            <p className="text-[10px] items-center text-zinc-500 uppercase tracking-widest font-bold">
              New operative?{" "}
              <Link href="/signup" className="text-blue-400 hover:text-white transition-colors ml-1">
                Initialize Account
              </Link>
            </p>
          </div>
          </div>

          

          <p className="mt-8 text-center text-[10px] text-zinc-600 uppercase tracking-widest font-bold">
            Protected by Cloud Armor <span className="mx-2 text-zinc-800">|</span> Standard 256-bit Encryption
          </p>
        </div>
        
      </div>
    </div>
  );
}
