"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { User as UserIcon, Settings, Shield, Bell, Save, Chrome, Sparkles, Loader2, CheckCircle2 } from "lucide-react";
import { UserProfile } from "@/lib/types";

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function getProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data, error } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (!error && data) {
          setProfile(data);
        } else {
          // Create initial profile if it doesn't exist
          const initialProfile = {
            user_id: user.id,
            full_name: user.email?.split("@")[0] || "",
            age: 25,
            gender: "male" as const,
            height_cm: 175,
            current_weight_kg: 70,
            target_weight_kg: 70,
            activity_level: "moderate" as const,
            goal: "maintain" as const,
          };
          const { data: newData } = await supabase
            .from("user_profiles")
            .insert(initialProfile)
            .select()
            .single();
          if (newData) setProfile(newData);
        }
      }
      setIsLoading(false);
    }

    getProfile();
  }, [supabase]);

  const handleSave = async () => {
    if (!profile || !user) return;
    setIsSaving(true);
    setSaveSuccess(false);

    const { error } = await supabase
      .from("user_profiles")
      .update({
        age: profile.age,
        gender: profile.gender,
        height_cm: profile.height_cm,
        current_weight_kg: profile.current_weight_kg,
        target_weight_kg: profile.target_weight_kg,
        activity_level: profile.activity_level,
        goal: profile.goal,
        full_name: profile.full_name,
      })
      .eq("user_id", user.id);

    if (!error) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
    setIsSaving(false);
  };

  if (isLoading || !user || !profile) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/5">
        <div>
          <h1 className="text-4xl font-black italic mb-2">User <span className="text-primary">Profile</span></h1>
          <p className="text-gray-500">Manage your physical data and application preferences.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="px-8 py-4 rounded-2xl bg-white text-black font-black italic flex items-center gap-2 hover:scale-105 transition-all shadow-xl disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : saveSuccess ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <Save className="w-5 h-5" />}
          {isSaving ? "Saving..." : saveSuccess ? "Saved!" : "Save Changes"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-1 space-y-8">
          <div className="glass-card p-10 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 premium-gradient" />
            <div className="w-32 h-32 rounded-full bg-secondary mx-auto mb-6 flex items-center justify-center text-4xl font-black shadow-2xl border-4 border-background">
              {user.email?.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-2xl font-black mb-1">{profile.full_name || user.email?.split("@")[0]}</h2>
            <p className="text-gray-500 text-sm mb-6">{user.email}</p>
            <div className="flex justify-center gap-2">
              <span className="px-3 py-1 rounded-full bg-white/5 text-[10px] font-black uppercase tracking-widest text-primary border border-primary/20">Pro Member</span>
            </div>
          </div>

          <div className="glass-card p-6 border-white/5 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-4">Account</h3>
            {[
              { icon: <Settings className="w-4 h-4" />, label: "Settings" },
              { icon: <Shield className="w-4 h-4" />, label: "Privacy & Security" },
              { icon: <Bell className="w-4 h-4" />, label: "Notifications" },
            ].map((item, i) => (
              <button key={i} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-sm font-bold text-gray-400 hover:text-white group">
                <span className="group-hover:text-primary transition-colors">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <div className="glass-card p-8 border-white/5">
            <h3 className="text-xl font-black italic mb-8 flex items-center gap-2">
              <UserIcon className="w-6 h-6 text-primary" />
              Physical Information
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-gray-500 ml-1">Full Name</label>
                <input 
                  type="text" 
                  value={profile.full_name || ""} 
                  onChange={(e) => setProfile({...profile, full_name: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 font-bold focus:outline-none focus:border-primary/50 transition-colors" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-gray-500 ml-1">Gender</label>
                <select 
                  value={profile.gender || "male"}
                  onChange={(e) => setProfile({...profile, gender: e.target.value as any})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 font-bold focus:outline-none focus:border-primary/50 appearance-none transition-colors"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-gray-500 ml-1">Current Weight (kg)</label>
                <input 
                  type="number" 
                  value={profile.current_weight_kg || 0} 
                  onChange={(e) => setProfile({...profile, current_weight_kg: parseFloat(e.target.value)})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 font-bold focus:outline-none focus:border-primary/50 transition-colors" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-gray-500 ml-1">Target Weight (kg)</label>
                <input 
                  type="number" 
                  value={profile.target_weight_kg || 0} 
                  onChange={(e) => setProfile({...profile, target_weight_kg: parseFloat(e.target.value)})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 font-bold focus:outline-none focus:border-primary/50 transition-colors" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-gray-500 ml-1">Height (cm)</label>
                <input 
                  type="number" 
                  value={profile.height_cm || 0} 
                  onChange={(e) => setProfile({...profile, height_cm: parseFloat(e.target.value)})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 font-bold focus:outline-none focus:border-primary/50 transition-colors" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-gray-500 ml-1">Age</label>
                <input 
                  type="number" 
                  value={profile.age || 0} 
                  onChange={(e) => setProfile({...profile, age: parseInt(e.target.value)})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 font-bold focus:outline-none focus:border-primary/50 transition-colors" 
                />
              </div>
            </div>
          </div>

          <div className="glass-card p-8 border-white/5">
            <h3 className="text-xl font-black italic mb-8 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-secondary" />
              Activity & Goals
            </h3>
            
            <div className="space-y-8">
              <div className="space-y-4">
                <label className="text-xs font-black uppercase tracking-widest text-gray-500 ml-1">Goal</label>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { id: 'lose_weight', label: 'Lose Weight' },
                    { id: 'maintain', label: 'Maintain' },
                    { id: 'gain_muscle', label: 'Gain Muscle' }
                  ].map((goal) => (
                    <button 
                      key={goal.id} 
                      onClick={() => setProfile({...profile, goal: goal.id as any})}
                      className={`py-4 rounded-2xl font-black text-xs uppercase tracking-tight border transition-all ${profile.goal === goal.id ? 'bg-primary text-black border-primary' : 'bg-white/5 border-white/10 text-gray-500 hover:border-white/20'}`}
                    >
                      {goal.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-gray-500 ml-1">Activity Level</label>
                <select 
                  value={profile.activity_level || "moderate"}
                  onChange={(e) => setProfile({...profile, activity_level: e.target.value as any})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 font-bold focus:outline-none focus:border-primary/50 appearance-none transition-colors"
                >
                  <option value="sedentary">Sedentary (Office job)</option>
                  <option value="light">Lightly Active (Workout 1-2 days/week)</option>
                  <option value="moderate">Moderately Active (Workout 3-5 days/week)</option>
                  <option value="active">Active (Daily intense workouts)</option>
                  <option value="very_active">Very Active (Professional athlete/Heavy labor)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="p-8 rounded-3xl bg-secondary/10 border border-secondary/20 flex flex-col sm:flex-row items-center gap-6 justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-secondary/20 flex items-center justify-center text-secondary">
                <Chrome className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold">Google Connection</h4>
                <p className="text-xs text-gray-500">Your account is linked to Google Auth</p>
              </div>
            </div>
            <span className="px-4 py-2 rounded-xl bg-green-500/10 text-green-500 text-xs font-black uppercase tracking-widest">Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
