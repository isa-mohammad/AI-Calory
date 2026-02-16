"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Utensils, Droplets, Dumbbell, Trophy, ArrowUpRight, TrendingUp, Loader2, Plus } from "lucide-react";
import { Bar } from "react-chartjs-2";
import Link from "next/link";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { useRouter } from "next/navigation";
import { MealLog, UserProfile } from "@/lib/types";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function DashboardOverview() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [meals, setMeals] = useState<MealLog[]>([]);
  const [waterAmount, setWaterAmount] = useState(0);
  const [exerciseTime, setExerciseTime] = useState(0);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const isoToday = today.toISOString();

      // Fetch Profile
      const { data: profileData } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      
      if (profileData) setProfile(profileData);

      // Fetch Today's Meals
      const { data: mealsData } = await supabase
        .from("meal_logs")
        .select("*")
        .eq("user_id", user.id)
        .gte("logged_at", isoToday)
        .order("logged_at", { ascending: false });
      
      if (mealsData) setMeals(mealsData);

      // Fetch Today's Water
      const { data: waterData } = await supabase
        .from("water_logs")
        .select("amount_ml")
        .eq("user_id", user.id)
        .gte("logged_at", isoToday);
      
      const totalWater = waterData?.reduce((acc, curr) => acc + curr.amount_ml, 0) || 0;
      setWaterAmount(totalWater);

      // Fetch Today's Exercise
      const { data: exerciseData } = await supabase
        .from("exercise_logs")
        .select("duration_minutes")
        .eq("user_id", user.id)
        .gte("logged_at", isoToday);
      
      const totalExercise = exerciseData?.reduce((acc, curr) => acc + curr.duration_minutes, 0) || 0;
      setExerciseTime(totalExercise);

      setLoading(false);
    }

    fetchData();
  }, [supabase]);

  const stats = {
    calories: meals.reduce((acc, curr) => acc + curr.calories, 0),
    target: profile?.daily_calorie_target || 2000,
    protein: Math.round(meals.reduce((acc, curr) => acc + (Number(curr.protein_g) || 0), 0)),
    carbs: Math.round(meals.reduce((acc, curr) => acc + (Number(curr.carbs_g) || 0), 0)),
    fat: Math.round(meals.reduce((acc, curr) => acc + (Number(curr.fat_g) || 0), 0)),
    water: waterAmount,
    waterTarget: 2500,
    exercise: exerciseTime,
  };

  const addWater = async (amount: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("water_logs").insert({
      user_id: user.id,
      amount_ml: amount,
    });

    if (!error) setWaterAmount(prev => prev + amount);
  };

  const caloriePercentage = Math.min((stats.calories / stats.target) * 100, 100);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10">
      {/* Welcome & Highlights */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black mb-2">Morning, {profile?.full_name?.split(" ")[0] || "User"}!</h1>
          <p className="text-gray-500 text-lg">You're <span className="text-primary font-bold">{Math.round(caloriePercentage)}%</span> towards your daily calorie goal.</p>
        </div>
        <div className="flex gap-4">
          <div className="glass-card px-6 py-4 border-primary/20 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase font-black">Goal</div>
              <div className="text-2xl font-black italic">{profile?.goal?.replace("_", " ") || "Maintain"}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calorie Progress */}
        <div className="lg:col-span-2 glass-card p-8 border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
          
          <div className="flex justify-between items-start mb-10">
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Calorie Intake
              </h3>
              <p className="text-sm text-gray-500">Tracked vs Daily Target</p>
            </div>
            <div className="text-right">
              <span className="text-4xl font-black">{stats.calories}</span>
              <span className="text-gray-500 font-bold ml-2">/ {stats.target} kcal</span>
            </div>
          </div>

          <div className="relative h-4 bg-white/5 rounded-full overflow-hidden mb-8">
            <div 
              className="absolute top-0 left-0 h-full premium-gradient transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(var(--primary-rgb),0.5)]"
              style={{ width: `${caloriePercentage}%` }}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Protein", value: `${stats.protein}g`, color: "bg-primary" },
              { label: "Carbs", value: `${stats.carbs}g`, color: "bg-secondary" },
              { label: "Fat", value: `${stats.fat}g`, color: "bg-accent" },
            ].map((m, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${m.color}`} />
                  <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">{m.label}</span>
                </div>
                <div className="text-xl font-bold">{m.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions & Other Stats */}
        <div className="space-y-8">
          {/* Water Intake */}
          <div className="glass-card p-6 border-white/5 hover:border-secondary/30 transition-all">
            <div className="flex justify-between items-center mb-6">
              <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
                <Droplets className="w-5 h-5" />
              </div>
              <button 
                onClick={() => addWater(250)}
                className="text-xs text-secondary font-bold uppercase tracking-widest hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add 250ml
              </button>
            </div>
            <div className="mb-4">
              <div className="text-2xl font-black tracking-tight">{stats.water}ml</div>
              <div className="text-sm text-gray-500">of {stats.waterTarget}ml target</div>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-secondary transition-all duration-700"
                style={{ width: `${Math.min((stats.water / stats.waterTarget) * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* Exercise Card */}
          <div className="glass-card p-6 border-white/5 hover:border-accent/30 transition-all overflow-hidden relative group">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent mb-6">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div className="text-2xl font-black tracking-tight">{stats.exercise} min</div>
            <div className="text-sm text-gray-500 mb-2">Total exercise today</div>
            <Link href="/log-activity" className="text-xs text-accent font-bold flex items-center gap-1 group-hover:gap-2 transition-all cursor-pointer">
              Log Activity <ArrowUpRight className="w-3 h-3" />
            </Link>
            <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-accent/5 blur-[50px] rounded-full group-hover:scale-110 transition-transform" />
          </div>
        </div>
      </div>

      {/* Recent Meals Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black italic">Recent <span className="text-primary">Meals</span></h2>
          <button className="text-sm text-gray-500 font-bold uppercase tracking-widest hover:text-white">View All</button>
        </div>
        
        {meals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {meals.slice(0, 4).map((meal, i) => (
              <div key={i} className="glass-card hover:translate-y-[-5px] transition-all group cursor-pointer overflow-hidden p-0 border-white/5">
                <div className="relative h-48 overflow-hidden bg-white/5">
                  {meal.image_url ? (
                    <img src={meal.image_url} alt={meal.meal_name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600">
                      <Utensils className="w-12 h-12" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    <div className="text-xs text-primary font-bold uppercase tracking-widest">
                      {new Date(meal.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="text-lg font-bold">{meal.meal_name}</div>
                  </div>
                </div>
                <div className="p-4 flex justify-between items-center bg-white/5 group-hover:bg-white/10 transition-colors">
                  <span className="text-gray-400 text-sm font-medium">Calories</span>
                  <span className="font-black italic">{meal.calories} kcal</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card p-12 text-center border-white/5 bg-white/5">
            <Utensils className="w-12 h-12 text-gray-700 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2 text-gray-400">No meals logged today</h3>
            <p className="text-sm text-gray-600 mb-6">Start tracking your nutrition to see your progress here.</p>
            <button 
              onClick={() => router.push("/log-meal")}
              className="px-6 py-3 rounded-xl bg-primary/10 text-primary text-xs font-black uppercase tracking-widest hover:bg-primary/20 transition-all"
            >
              Log Your First Meal
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
