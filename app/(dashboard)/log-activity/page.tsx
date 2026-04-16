"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Dumbbell, Clock, Flame, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";

const EXERCISE_TYPES = [
  "Running", "Cycling", "Swimming", "Weightlifting",
  "Yoga", "Walking", "HIIT", "Other"
];

export default function LogActivityPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    exercise_type: "Running",
    duration_minutes: "",
    calories_burned: "",
    logged_at: new Date().toISOString().split('T')[0],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error: insertError } = await supabase
        .from("exercise_logs")
        .insert({
          user_id: user.id,
          exercise_type: formData.exercise_type,
          duration_minutes: parseInt(formData.duration_minutes),
          calories_burned: formData.calories_burned ? parseInt(formData.calories_burned) : null,
          logged_at: new Date(formData.logged_at).toISOString(),
        });

      if (insertError) throw insertError;

      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-accent animate-bounce">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-black italic text-white">Activity Logged!</h2>
        <p className="text-white/60">Redirecting to your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-8 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Dashboard
      </Link>

      <div className="glass-card p-8 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-yellow-300">
              <Dumbbell className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-black italic text-white">Log <span className="text-accent italic">Activity</span></h1>
              <p className="text-sm text-white/60">Track your workouts and calorie burn.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-white/50">Exercise Type</label>
                <select
                  value={formData.exercise_type}
                  onChange={(e) => setFormData({ ...formData, exercise_type: e.target.value })}
                  className="w-full bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent transition-colors appearance-none"
                >
                  {EXERCISE_TYPES.map(type => (
                    <option key={type} value={type} className="bg-green-800 text-white">{type}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-white/50">Date</label>
                <input
                  type="date"
                  value={formData.logged_at}
                  onChange={(e) => setFormData({ ...formData, logged_at: e.target.value })}
                  className="w-full bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent transition-colors"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-white/50 flex items-center gap-2">
                  <Clock className="w-3 h-3 text-accent" /> Duration (min)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 45"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                  className="w-full bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-accent transition-colors"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-white/50 flex items-center gap-2">
                  <Flame className="w-3 h-3 text-orange-400" /> Est. Burn (kcal)
                </label>
                <input
                  type="number"
                  placeholder="Optional"
                  value={formData.calories_burned}
                  onChange={(e) => setFormData({ ...formData, calories_burned: e.target.value })}
                  className="w-full bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-accent transition-colors"
                />
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-200 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-white text-green-800 font-black italic flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>Save Workout <CheckCircle2 className="w-5 h-5" /></>
              )}
            </button>
          </form>
        </div>

        <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/5 blur-[100px] rounded-full pointer-events-none" />
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4">
        {[
          { label: "Strength", sub: "Build muscle mass" },
          { label: "Cardio", sub: "Burn body fat" }
        ].map((item, i) => (
          <div key={i} className="glass-card p-6">
            <div className="text-lg font-bold mb-1 text-white">{item.label}</div>
            <div className="text-xs text-white/50 font-medium">{item.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
