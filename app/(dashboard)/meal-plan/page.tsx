"use client";

import { useEffect, useState } from "react";
import { Sparkles, Calendar, Plus, ChevronRight, BookOpen, Loader2, Utensils, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { MealPlan, MealPlanItem, UserProfile } from "@/lib/types";

export default function MealPlanPage() {
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activePlan, setActivePlan] = useState<MealPlan | null>(null);
  const [planItems, setPlanItems] = useState<MealPlanItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const [schemaToday, setSchemaToday] = useState(1);
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
    const todayNum = new Date().getDay();
    setSchemaToday(todayNum === 0 ? 7 : todayNum);
  }, []);

  const getDayName = (dayNumber: number) => {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    return days[dayNumber - 1] || `Day ${dayNumber}`;
  };

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (profileData) setProfile(profileData);

      const { data: planData } = await supabase
        .from("meal_plans")
        .select("*, meal_plan_items(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (planData) {
        setActivePlan(planData);
        setPlanItems(planData.meal_plan_items || []);
      }

      setLoading(false);
    }

    fetchData();
  }, [supabase]);

  const generateNewPlan = async () => {
    if (!profile) return;
    setIsGenerating(true);

    try {
      const response = await fetch("/api/generate-meal-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          age: profile.age,
          gender: profile.gender,
          weight_kg: profile.current_weight_kg,
          height_cm: profile.height_cm,
          activity_level: profile.activity_level,
          goal: profile.goal,
          days: 7
        }),
      });

      if (!response.ok) throw new Error("Failed to generate plan");
      const plan = await response.json();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + 7);

      const { data: newPlan, error: planError } = await supabase
        .from("meal_plans")
        .insert({
          user_id: user.id,
          plan_name: plan.plan_name,
          start_date: startDate.toISOString().split("T")[0],
          end_date: endDate.toISOString().split("T")[0],
          total_calories: profile.daily_calorie_target
        })
        .select()
        .single();

      if (planError) throw planError;

      const itemsToInsert = plan.days.flatMap((day: any) =>
        day.meals.map((meal: any) => ({
          meal_plan_id: newPlan.id,
          day_of_week: day.day_number,
          meal_type: meal.meal_type,
          meal_name: meal.meal_name,
          calories: meal.calories,
          protein_g: meal.protein_g,
          carbs_g: meal.carbs_g,
          fat_g: meal.fat_g,
          ingredients: meal.ingredients,
          instructions: meal.instructions
        }))
      );

      const { error: itemsError } = await supabase
        .from("meal_plan_items")
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Failed to generate meal plan. Please check your profile data.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-10 h-10 text-white animate-spin" />
      </div>
    );
  }

  const todaysMeals = planItems.filter(item => item.day_of_week === schemaToday);

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black italic mb-2 text-white">Meal <span className="text-accent">Plans</span></h1>
          <p className="text-white/60">AI-generated nutritional strategies tailored for your goals.</p>
        </div>
        <button
          onClick={generateNewPlan}
          disabled={isGenerating}
          className="px-10 py-5 rounded-2xl bg-white text-green-800 font-black italic text-lg flex items-center gap-3 hover:scale-105 transition-all shadow-2xl disabled:opacity-50"
        >
          {isGenerating ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
          {isGenerating ? "Generating..." : "Generate New Plan"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-card p-8 relative overflow-hidden">
          {activePlan ? (
            <>
              <div className="absolute top-6 right-6">
                <div className="px-4 py-2 rounded-full bg-accent/20 text-accent text-xs font-bold uppercase tracking-widest border border-accent/30 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                  Active
                </div>
              </div>

              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-accent">
                  <Calendar className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-white">{activePlan.plan_name}</h2>
                  <p className="text-white/50 font-medium">Valid until {activePlan.end_date}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-xs text-white/50 font-bold uppercase mb-2">Daily Goal</div>
                  <div className="text-2xl font-black italic text-white">{activePlan.total_calories} kcal</div>
                </div>
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-xs text-white/50 font-bold uppercase mb-2">Macro Bias</div>
                  <div className="text-2xl font-black italic text-accent">{profile?.goal?.replace("_", " ")}</div>
                </div>
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-xs text-white/50 font-bold uppercase mb-2">Today</div>
                  <div className="text-2xl font-black italic text-white">{getDayName(schemaToday)}</div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2 text-white">
                  <BookOpen className="w-5 h-5 text-accent" />
                  Today&apos;s Schedule
                </h3>
                {todaysMeals.length > 0 ? todaysMeals.sort((a, b) => {
                  const order = { breakfast: 1, lunch: 2, dinner: 3, snack: 4 };
                  return (order[a.meal_type as keyof typeof order] || 5) - (order[b.meal_type as keyof typeof order] || 5);
                }).map((m, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <div className="w-2 h-2 rounded-full bg-accent" />
                      <div>
                        <div className="text-xs text-white/50 font-bold uppercase tracking-widest">{m.meal_type}</div>
                        <div className="font-bold text-white group-hover:text-accent transition-colors">{m.meal_name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black italic text-accent">{m.calories} kcal</div>
                    </div>
                  </div>
                )) : (
                  <div className="p-10 rounded-2xl bg-white/5 border border-white/10 text-center italic text-white/50">
                    No meals scheduled for today.
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="h-[400px] flex flex-col items-center justify-center text-center p-10">
              <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mb-6">
                <Sparkles className="w-10 h-10 text-accent" />
              </div>
              <h2 className="text-2xl font-black mb-2 text-white">No Active Plan</h2>
              <p className="text-white/60 mb-8 max-w-sm">Generating a personalized meal plan helps you stay on track with your fitness goals.</p>
              <button
                onClick={generateNewPlan}
                disabled={isGenerating}
                className="px-10 py-5 rounded-2xl bg-white text-green-800 font-black italic text-lg flex items-center gap-3 hover:scale-105 transition-all shadow-2xl disabled:opacity-50"
              >
                {isGenerating ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
                {isGenerating ? "Generating..." : "Generate My Plan"}
              </button>
            </div>
          )}
        </div>

        <div className="space-y-8">
          <div className="glass-card p-6">
            <h3 className="text-xl font-bold mb-6 text-white">Nutrition Focus</h3>
            <div className="space-y-4">
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 relative overflow-hidden">
                <div className="text-xs text-accent font-black uppercase tracking-widest mb-1">Focus</div>
                <div className="text-xl font-black italic text-white">{profile?.goal === 'lose_weight' ? 'Fat Loss' : profile?.goal === 'gain_muscle' ? 'Hypertrophy' : 'Health'}</div>
                <div className="absolute bottom-[-10%] right-[-5%] opacity-10 rotate-12">
                  <Utensils className="w-24 h-24 text-white" />
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 rounded-3xl premium-gradient text-white relative overflow-hidden group">
            <Sparkles className="absolute top-[-20%] right-[-10%] w-40 h-40 opacity-20 group-hover:rotate-12 transition-transform" />
            <h3 className="text-2xl font-black mb-4">Daily Target</h3>
            <p className="text-sm text-white/70 mb-6 leading-relaxed">
              Based on your {profile?.activity_level} activity level, your daily target is {profile?.daily_calorie_target} kcal.
            </p>
            <button
              onClick={() => window.location.href = "/profile"}
              className="w-full py-4 rounded-2xl bg-white text-green-800 font-black italic flex items-center justify-center gap-2 hover:translate-y-[-2px] transition-all shadow-xl"
            >
              Update Preferences <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
