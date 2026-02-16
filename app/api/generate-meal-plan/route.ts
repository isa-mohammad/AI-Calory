import { createClient } from '@/lib/supabase/server'
import { generateMealPlan } from '@/lib/gemini/analyzer'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { age, gender, weight_kg, height_cm, activity_level, goal, dietary_restrictions, days } = await request.json()

        if (!age || !gender || !weight_kg || !height_cm || !activity_level || !goal) {
            return NextResponse.json(
                { error: 'Missing required profile data' },
                { status: 400 }
            )
        }

        const calorieTarget = await supabase
            .from('user_profiles')
            .select('daily_calorie_target')
            .eq('user_id', user.id)
            .single()

        const mealPlan = await generateMealPlan({
            age,
            gender,
            weight_kg,
            height_cm,
            activity_level,
            goal,
            daily_calorie_target: calorieTarget.data?.daily_calorie_target || 2000,
            dietary_restrictions
        }, days || 7)

        return NextResponse.json(mealPlan)
    } catch (error: any) {
        console.error('Meal plan generation error:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to generate meal plan' },
            { status: 500 }
        )
    }
}
