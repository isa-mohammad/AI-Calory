import { createClient } from '@/lib/supabase/server'
import { getRecipeSuggestions } from '@/lib/gemini/analyzer'
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

        const { ingredients, preferences } = await request.json()

        if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
            return NextResponse.json(
                { error: 'Ingredients are required' },
                { status: 400 }
            )
        }

        const recipes = await getRecipeSuggestions(ingredients, preferences)

        return NextResponse.json(recipes)
    } catch (error: any) {
        console.error('Recipe suggestions error:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to get recipe suggestions' },
            { status: 500 }
        )
    }
}
