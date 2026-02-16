export interface UserProfile {
    id: string
    user_id: string
    full_name: string | null
    age: number | null
    gender: 'male' | 'female' | 'other' | null
    height_cm: number | null
    current_weight_kg: number | null
    target_weight_kg: number | null
    activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' | null
    goal: 'lose_weight' | 'maintain' | 'gain_muscle' | null
    daily_calorie_target: number | null
    created_at: string
    updated_at: string
}

export interface MealLog {
    id: string
    user_id: string
    meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
    meal_name: string
    calories: number
    protein_g: number | null
    carbs_g: number | null
    fat_g: number | null
    fiber_g: number | null
    image_url: string | null
    notes: string | null
    logged_at: string
    created_at: string
}

export interface NutritionData {
    calories: number
    protein_g: number
    carbs_g: number
    fat_g: number
    fiber_g: number
}

export interface MealPlan {
    id: string
    user_id: string
    plan_name: string
    start_date: string
    end_date: string
    total_calories: number | null
    created_at: string
    items?: MealPlanItem[]
}

export interface MealPlanItem {
    id: string
    meal_plan_id: string
    day_of_week: number
    meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
    meal_name: string
    recipe: string | null
    calories: number
    protein_g: number | null
    carbs_g: number | null
    fat_g: number | null
    ingredients: any
    instructions: string | null
}

export interface DailySummary {
    date: string
    total_calories: number
    total_protein: number
    total_carbs: number
    total_fat: number
    meals_count: number
}
