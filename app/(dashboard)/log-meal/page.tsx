"use client";

import { useState, useRef } from "react";
import { Camera, Upload, Loader2, CheckCircle2, AlertCircle, Sparkles, X, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LogMealPage() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setResult(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async () => {
    if (!imagePreview) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const base64Content = imagePreview.split(",")[1];
      const mimeType = imagePreview.split(",")[0].split(":")[1].split(";")[0];

      const response = await fetch("/api/analyze-food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Content, mimeType }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to analyze image");
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const saveMeal = async () => {
    if (!result) return;
    setIsSaving(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let imageUrl = null;

      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('meal-images')
          .upload(fileName, selectedFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('meal-images')
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
      }

      const { error: insertError } = await supabase.from("meal_logs").insert({
        user_id: user.id,
        meal_type: mealType,
        meal_name: result.meal_name,
        calories: result.calories,
        protein_g: result.protein_g,
        carbs_g: result.carbs_g,
        fat_g: result.fat_g,
        fiber_g: result.fiber_g,
        notes: result.suggestions,
        image_url: imageUrl,
      });

      if (insertError) throw insertError;
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black italic mb-2 text-white">Log <span className="text-accent">Meal</span></h1>
          <p className="text-white/60">Capture or upload a photo of your food for instant AI analysis.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Upload Section */}
        <div className="space-y-6">
          <div className="flex flex-col gap-4">
            <label className="text-xs font-black uppercase tracking-widest text-white/50 ml-1">Meal Type</label>
            <div className="flex gap-2 p-1 bg-white/10 rounded-2xl border border-white/15">
              {['breakfast', 'lunch', 'dinner', 'snack'].map((type) => (
                <button
                  key={type}
                  onClick={() => setMealType(type as any)}
                  className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${mealType === type ? 'bg-white text-green-800 shadow-md' : 'text-white/60 hover:text-white'}`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div
            onClick={() => fileInputRef.current?.click()}
            className={`
              aspect-square glass-card border-dashed border-2 flex flex-col items-center justify-center cursor-pointer overflow-hidden group transition-all
              ${imagePreview ? "border-accent/50" : "border-white/20 hover:border-white/40"}
            `}
          >
            {imagePreview ? (
              <img src={imagePreview} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
            ) : (
              <div className="text-center p-10">
                <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-accent mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Camera className="w-8 h-8" />
                </div>
                <div className="font-bold text-lg mb-1 text-white">Take a Photo</div>
                <p className="text-sm text-white/50">or click to upload from files</p>
              </div>
            )}
          </div>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="flex gap-4">
            <button
              disabled={!imagePreview || isAnalyzing || isSaving}
              onClick={analyzeImage}
              className="flex-1 py-4 px-6 rounded-2xl bg-white text-green-800 font-black italic disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:scale-105 transition-all shadow-lg"
            >
              {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              {isAnalyzing ? "Analyzing..." : "Analyze with AI"}
            </button>
            {imagePreview && !isAnalyzing && !isSaving && (
              <button
                onClick={() => { setImagePreview(null); setSelectedFile(null); setResult(null); }}
                className="p-4 rounded-2xl bg-white/10 border border-white/15 text-white/60 hover:text-red-300 transition-colors"
                title="Discard"
              >
                <X className="w-6 h-6" />
              </button>
            )}
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-200 flex items-center gap-3 text-sm">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {result ? (
            <div className="glass-card p-8 space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-xs text-accent font-bold uppercase tracking-widest mb-1">AI Detected</div>
                  <h2 className="text-3xl font-black text-white">{result.meal_name}</h2>
                </div>
                <div className="text-right">
                  <div className="text-xs text-white/50 font-bold uppercase tracking-widest mb-1">Confidence</div>
                  <div className={`text-sm font-bold flex items-center gap-1 ${result.confidence === 'high' ? 'text-accent' : 'text-yellow-300'}`}>
                    <CheckCircle2 className="w-4 h-4" />
                    {result.confidence.toUpperCase()}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center">
                  <div className="text-4xl font-black italic text-accent">{result.calories}</div>
                  <div className="text-xs text-white/50 font-bold uppercase mt-2">Total Kcal</div>
                </div>
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-center">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-white/60">Protein</span>
                    <span className="font-bold text-white">{result.protein_g}g</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-white/60">Carbs</span>
                    <span className="font-bold text-white">{result.carbs_g}g</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Fat</span>
                    <span className="font-bold text-white">{result.fat_g}g</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-xs text-white/50 font-bold uppercase tracking-widest mb-3">Key Ingredients</div>
                <div className="flex flex-wrap gap-2">
                  {result.ingredients.map((ing: string, i: number) => (
                    <span key={i} className="px-3 py-1.5 rounded-lg bg-white/10 text-xs font-bold text-white">{ing}</span>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="text-xs text-accent font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Sparkles className="w-3 h-3" /> AI Suggestion
                </div>
                <p className="text-sm text-white/70 italic leading-relaxed">
                  &quot;{result.suggestions}&quot;
                </p>
              </div>

              <button
                onClick={saveMeal}
                disabled={isSaving}
                className="w-full py-4 rounded-2xl bg-white text-green-800 font-black italic hover:scale-105 transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSaving && <Loader2 className="w-5 h-5 animate-spin" />}
                {isSaving ? "Saving to Log..." : "Log This Meal"}
              </button>
            </div>
          ) : (
            <div className={`h-[500px] flex flex-col items-center justify-center p-10 text-center glass-card transition-all ${isAnalyzing ? "opacity-50" : ""}`}>
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-12 h-12 text-accent animate-spin mb-6" />
                  <h3 className="text-xl font-bold italic mb-2 text-white">Gemini is Thinking...</h3>
                  <p className="text-white/50 text-sm max-w-[250px]">Analyzing macros, portion sizes, and ingredients. Just a moment.</p>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mb-6">
                    <Upload className="w-8 h-8 text-white/40" />
                  </div>
                  <h3 className="text-xl font-bold italic mb-2 text-white">Ready to Analyze</h3>
                  <p className="text-white/50 text-sm max-w-[200px]">Upload a photo to see your nutritional breakdown here.</p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
