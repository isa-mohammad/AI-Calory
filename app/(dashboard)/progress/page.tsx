"use client";

import { useEffect, useState } from "react";
import { TrendingUp, Award, Calendar, Loader2, Scale, BarChart3, Activity, ArrowUpRight } from "lucide-react";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { createClient } from "@/lib/supabase/client";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function ProgressPage() {
  const [loading, setLoading] = useState(true);
  const [weightData, setWeightData] = useState<any[]>([]);
  const [calorieData, setCalorieData] = useState<any[]>([]);
  const [stats, setStats] = useState({
    avgCalories: 0,
    currentWeight: 0,
    weightDiff: 0,
    streak: 0
  });
  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const isoThirty = thirtyDaysAgo.toISOString();

      // Fetch Weight Logs
      const { data: weights } = await supabase
        .from("weight_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("logged_at", { ascending: true });
      
      if (weights && weights.length > 0) {
        setWeightData(weights);
        const latest = Number(weights[weights.length - 1].weight_kg);
        const first = Number(weights[0].weight_kg);
        setStats(prev => ({ 
          ...prev, 
          currentWeight: latest, 
          weightDiff: latest - first 
        }));
      }

      // Fetch Meal Logs for Calories
      const { data: meals } = await supabase
        .from("meal_logs")
        .select("calories, logged_at")
        .eq("user_id", user.id)
        .gte("logged_at", isoThirty)
        .order("logged_at", { ascending: true });
      
      if (meals) {
        // Group by day
        const grouped = meals.reduce((acc: any, curr: any) => {
          const date = new Date(curr.logged_at).toLocaleDateString();
          acc[date] = (acc[date] || 0) + curr.calories;
          return acc;
        }, {});

        const chartData = Object.entries(grouped).map(([date, kcal]) => ({ date, kcal }));
        setCalorieData(chartData);

        const totalKcal = meals.reduce((acc, curr) => acc + curr.calories, 0);
        const avg = meals.length > 0 && Object.keys(grouped).length > 0 
          ? Math.round(totalKcal / Object.keys(grouped).length) 
          : 0;
        setStats(prev => ({ ...prev, avgCalories: avg }));
      }

      setLoading(false);
    }

    fetchData();
  }, [supabase]);

  const weightChart = {
    labels: weightData.map(d => new Date(d.logged_at).toLocaleDateString([], { month: 'short', day: 'numeric' })),
    datasets: [
      {
        label: "Weight (kg)",
        data: weightData.map(d => d.weight_kg),
        borderColor: "#a3e635",
        backgroundColor: "rgba(163, 230, 53, 0.1)",
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const caloriesChart = {
    labels: calorieData.map(d => d.date),
    datasets: [
      {
        label: "Calories",
        data: calorieData.map(d => d.kcal),
        backgroundColor: "rgba(56, 189, 248, 0.8)",
        borderRadius: 8,
      },
    ],
  };

  const handleExport = () => {
    // Combine data for export
    const headers = ["Date", "Weight (kg)", "Calories (kcal)"];
    
    // Create a map of dates to values
    const dateMap: { [key: string]: { weight?: number; kcal?: number } } = {};
    
    weightData.forEach(d => {
      const date = new Date(d.logged_at).toLocaleDateString();
      if (!dateMap[date]) dateMap[date] = {};
      dateMap[date].weight = d.weight_kg;
    });
    
    calorieData.forEach(d => {
      if (!dateMap[d.date]) dateMap[d.date] = {};
      dateMap[dateMap[d.date] ? d.date : d.date].kcal = d.kcal;
    });

    const rows = Object.entries(dateMap)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .map(([date, data]) => [
        date,
        data.weight || "",
        data.kcal || ""
      ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `AI-Cal-Progress-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black italic mb-2">Analytics <span className="text-primary italic">&</span> Progress</h1>
          <p className="text-gray-500">Visualize your journey and celebrate your consistency.</p>
        </div>
        <div className="flex gap-4">
          <div className="glass-card px-6 py-4 flex items-center gap-4 border-primary/20 bg-primary/5">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase font-black">Weight Change</div>
              <div className="text-2xl font-black italic">{stats.weightDiff > 0 ? '+' : ''}{stats.weightDiff.toFixed(1)} kg</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Current Weight", value: `${stats.currentWeight}kg`, icon: Scale, color: "text-primary" },
          { label: "Avg Calories", value: `${stats.avgCalories}kcal`, icon: Activity, color: "text-secondary" },
          { label: "Daily Streak", value: "5 Days", icon: Award, color: "text-accent" },
          { label: "Active Plan", value: "Week 2", icon: Calendar, color: "text-white" },
        ].map((s, i) => (
          <div key={i} className="glass-card p-6 border-white/5 hover:border-white/10 transition-all">
            <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${s.color} mb-4`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-black mb-1">{s.value}</div>
            <div className="text-xs text-gray-500 font-bold uppercase tracking-widest">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-card p-8 border-white/5">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Scale className="w-5 h-5 text-primary" />
                Weight Trend
              </h3>
              <p className="text-sm text-gray-500">Your weight tracking history</p>
            </div>
          </div>
          <div className="h-[300px]">
            {weightData.length > 0 ? (
              <Line data={weightChart} options={{ maintainAspectRatio: false, scales: { y: { grid: { color: 'rgba(255,255,255,0.05)' } }, x: { grid: { display: false } } } }} />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-600 italic">No weight data yet</div>
            )}
          </div>
        </div>

        <div className="glass-card p-8 border-white/5">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-secondary" />
                Calorie Intensity
              </h3>
              <p className="text-sm text-gray-500">Daily intake over last 30 days</p>
            </div>
          </div>
          <div className="h-[300px]">
             {calorieData.length > 0 ? (
              <Bar data={caloriesChart} options={{ maintainAspectRatio: false, scales: { y: { grid: { color: 'rgba(255,255,255,0.05)' } }, x: { grid: { display: false } } } }} />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-600 italic">No meal data yet</div>
            )}
          </div>
        </div>
      </div>

      <button 
        onClick={handleExport}
        className="w-full py-5 rounded-2xl bg-white text-black font-black italic flex items-center justify-center gap-2 hover:translate-y-[-2px] transition-all shadow-xl group"
      >
        Export Health Report <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
      </button>
    </div>
  );
}
