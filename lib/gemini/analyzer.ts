import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export interface FoodAnalysisResult {
    meal_name: string
    calories: number
    protein_g: number
    carbs_g: number
    fat_g: number
    fiber_g: number
    confidence: 'high' | 'medium' | 'low'
    ingredients: string[]
    suggestions: string
}

export async function analyzeFoodImage(
    imageBase64: string,
    mimeType: string
): Promise<FoodAnalysisResult> {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const prompt = `You are a nutrition expert. Analyze this food image and provide detailed nutritional information.

IMPORTANT: Respond ONLY with valid JSON in this exact format:
{
  "meal_name": "Name of the dish",
  "calories": 500,
  "protein_g": 25,
  "carbs_g": 60,
  "fat_g": 15,
  "fiber_g": 5,
  "confidence": "high",
  "ingredients": ["ingredient1", "ingredient2"],
  "suggestions": "Brief health tips or alternatives"
}

Rules:
- Be as accurate as possible based on visible portion sizes
- If you're unsure, use "medium" or "low" confidence
- Provide realistic nutritional values
- Include main ingredients you can identify
- NO markdown, NO code blocks, ONLY the JSON object`

    const result = await model.generateContent([
        prompt,
        {
            inlineData: {
                mimeType,
                data: imageBase64,
            },
        },
    ])

    const response = result.response.text()

    // Clean response to get only JSON
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
        throw new Error('Invalid response format from AI')
    }

    const analysis: FoodAnalysisResult = JSON.parse(jsonMatch[0])
    return analysis
}

export async function generateMealPlan(
    userProfile: {
        age: number
        gender: string
        weight_kg: number
        height_cm: number
        activity_level: string
        goal: string
        daily_calorie_target: number
        dietary_restrictions?: string[]
    },
    days: number = 7
): Promise<any> {
    const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: {
            temperature: 0.7,
        }
    })

    const prompt = `Create a ${days}-day personalized meal plan for:
- Age: ${userProfile.age}, Gender: ${userProfile.gender}
- Current weight: ${userProfile.weight_kg}kg, Height: ${userProfile.height_cm}cm
- Activity level: ${userProfile.activity_level}
- Goal: ${userProfile.goal}
- Daily calorie target: ${userProfile.daily_calorie_target} calories
${userProfile.dietary_restrictions ? `- Dietary restrictions: ${userProfile.dietary_restrictions.join(', ')}` : ''}

IMPORTANT: Respond ONLY with valid JSON in this exact format:
{
  "plan_name": "Descriptive name for this meal plan",
  "days": [
    {
      "day_number": 1,
      "meals": [
        {
          "meal_type": "breakfast",
          "meal_name": "Oatmeal with Berries",
          "calories": 350,
          "protein_g": 12,
          "carbs_g": 60,
          "fat_g": 8,
          "ingredients": ["1 cup oats", "1 cup berries", "1 tbsp honey"],
          "instructions": "Cook oats, top with berries and honey"
        }
      ]
    }
  ]
}

Requirements:
- Each day should have breakfast, lunch, dinner, and 1-2 snacks
- Total daily calories should be close to ${userProfile.daily_calorie_target}
- Include variety across days
- Provide realistic, achievable meals
- Include cooking instructions
- Balanced macronutrients
- NO markdown, NO code blocks, ONLY the JSON object`

    const result = await model.generateContent(prompt)
    const response = result.response.text()

    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
        throw new Error('Invalid meal plan format from AI')
    }

    return JSON.parse(jsonMatch[0])
}

export async function getRecipeSuggestions(
    ingredients: string[],
    preferences?: {
        cuisine?: string
        dietary_restrictions?: string[]
        max_calories?: number
        cooking_time?: number
    }
): Promise<any> {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const prompt = `Suggest 3 healthy recipes using these ingredients: ${ingredients.join(', ')}

${preferences?.cuisine ? `Cuisine preference: ${preferences.cuisine}` : ''}
${preferences?.dietary_restrictions ? `Dietary restrictions: ${preferences.dietary_restrictions.join(', ')}` : ''}
${preferences?.max_calories ? `Max calories per serving: ${preferences.max_calories}` : ''}
${preferences?.cooking_time ? `Max cooking time: ${preferences.cooking_time} minutes` : ''}

IMPORTANT: Respond ONLY with valid JSON in this exact format:
{
  "recipes": [
    {
      "name": "Recipe Name",
      "description": "Brief description",
      "prep_time_minutes": 15,
      "cook_time_minutes": 30,
      "servings": 4,
      "calories_per_serving": 400,
      "protein_g": 25,
      "carbs_g": 45,
      "fat_g": 12,
      "ingredients": ["ingredient with amount"],
      "instructions": ["Step 1", "Step 2"],
      "tips": "Optional cooking tips"
    }
  ]
}

NO markdown, NO code blocks, ONLY the JSON object`

    const result = await model.generateContent(prompt)
    const response = result.response.text()

    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
        throw new Error('Invalid recipe format from AI')
    }

    return JSON.parse(jsonMatch[0])
}
