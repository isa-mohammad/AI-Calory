"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { Camera, Utensils, Zap, BarChart3, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, [supabase]);

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div className="flex flex-col min-h-screen font-outfit overflow-x-hidden">
      {/* Navigation Header */}
      <header className="fixed top-0 left-0 right-0 h-20 flex items-center justify-between px-6 sm:px-20 z-50 bg-background/50 backdrop-blur-xl border-b border-white/5">
        <div className="text-2xl font-black italic tracking-tight">AI <span className="text-primary">Cal</span></div>
        <div className="flex items-center gap-8">
          <Link href="#features" className="hidden sm:block text-sm font-bold text-gray-400 hover:text-white transition-colors">Features</Link>
          {user ? (
            <Link 
              href="/dashboard"
              className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:scale-105 transition-all"
            >
              Dashboard
            </Link>
          ) : (
            <button 
              onClick={handleLogin}
              className="px-6 py-2.5 rounded-xl glass-card font-bold text-sm hover:bg-white/5 transition-all"
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center p-6 sm:p-20 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/20 blur-[120px] rounded-full animate-pulse" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center z-10">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card border-primary/20 text-primary text-sm font-medium">
              <Zap className="w-4 h-4" />
              <span>AI-Powered Nutrition Analysis</span>
            </div>
            
            <h1 className="text-6xl sm:text-8xl font-black leading-tight bg-clip-text text-transparent bg-gradient-to-br from-white via-white to-gray-500">
              Eat Smarter, <br />
              <span className="text-primary italic">Live Better.</span>
            </h1>
            
            <p className="text-xl text-gray-400 max-w-lg leading-relaxed">
              Unlock the power of Gemini 2.5 Flash to track your meals instantly. 
              Snap a photo, get accurate calories, and reach your goals faster than ever.
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              {user ? (
                <Link 
                  href="/dashboard"
                  className="px-8 py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-lg hover:scale-105 transition-all flex items-center gap-2"
                >
                  Go to Dashboard <ChevronRight className="w-5 h-5" />
                </Link>
              ) : (
                <button 
                  onClick={handleLogin}
                  className="px-8 py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-lg hover:scale-105 transition-all flex items-center gap-2 shadow-lg shadow-primary/20"
                >
                  Get Started Free <ChevronRight className="w-5 h-5" />
                </button>
              )}
              <Link 
                href="#features"
                className="px-8 py-4 rounded-2xl glass-card font-bold text-lg hover:bg-white/5 transition-all"
              >
                Learn More
              </Link>
            </div>
          </div>

          <div className="relative hidden lg:block animate-float">
            <div className="glass-card p-4 rotate-3 scale-110 border-white/10 shadow-2xl relative">
              <img 
                src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=2000&auto=format&fit=crop" 
                alt="Healthy Meal" 
                className="rounded-xl w-full h-[500px] object-cover"
              />
              <div className="absolute top-8 right-[-20px] glass-card p-6 border-primary/50 translate-x-4 shadow-2xl animate-bounce">
                <div className="text-primary text-sm font-bold uppercase tracking-widest">Calories</div>
                <div className="text-4xl font-black">450</div>
                <div className="text-xs text-gray-400">High Confidence</div>
              </div>
              <div className="absolute bottom-12 left-[-40px] glass-card p-4 border-secondary/50 -translate-x-4 shadow-2xl">
                <div className="flex gap-4">
                  <div>
                    <div className="text-xs text-secondary font-bold uppercase">Protein</div>
                    <div className="text-xl font-bold">25g</div>
                  </div>
                  <div>
                    <div className="text-xs text-primary font-bold uppercase">Carbs</div>
                    <div className="text-xl font-bold">60g</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="py-32 px-6 sm:px-20 bg-black/50 overflow-hidden relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl sm:text-6xl font-black mb-6">Built for Excellence</h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              We've combined state-of-the-art AI with a premium user experience to make nutrition tracking actually enjoyable.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { 
                icon: <Camera className="w-8 h-8 text-primary" />, 
                title: "Photo Recognition", 
                desc: "Powered by Gemini 2.5 Flash. Just snap a photo of your plate." 
              },
              { 
                icon: <Utensils className="w-8 h-8 text-secondary" />, 
                title: "Smart Meal Plans", 
                desc: "Personalized plans tailored to your goals and dietary needs." 
              },
              { 
                icon: <BarChart3 className="w-8 h-8 text-accent" />, 
                title: "Deep Analytics", 
                desc: "Visualize your progress with beautiful macros and weight charts." 
              }
            ].map((f, i) => (
              <div key={i} className="glass-card p-10 hover:border-white/20 transition-all group">
                <div className="mb-6 group-hover:scale-110 transition-transform">{f.icon}</div>
                <h3 className="text-2xl font-bold mb-4">{f.title}</h3>
                <p className="text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <footer className="py-20 px-6 sm:px-20 border-t border-white/5 bg-black">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
          <div>
            <div className="text-3xl font-black italic mb-2">AI <span className="text-primary">Cal</span></div>
            <p className="text-gray-500 text-sm">© 2026 AI Cal. All rights reserved.</p>
          </div>
          <div className="flex gap-8 text-gray-400 font-medium">
            <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms</Link>
            <Link href="#" className="hover:text-white transition-colors">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
