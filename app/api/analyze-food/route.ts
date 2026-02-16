import { createClient } from '@/lib/supabase/server'
import { analyzeFoodImage } from '@/lib/gemini/analyzer'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        // Verify authentication
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { image, mimeType } = await request.json()

        if (!image || !mimeType) {
            return NextResponse.json(
                { error: 'Image data and mimeType are required' },
                { status: 400 }
            )
        }

        // Analyze the food image with Gemini
        const analysis = await analyzeFoodImage(image, mimeType)

        return NextResponse.json(analysis)
    } catch (error: any) {
        console.error('Food analysis error:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to analyze food image' },
            { status: 500 }
        )
    }
}
