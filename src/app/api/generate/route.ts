import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: NextRequest) {
  try {
    // 1. Get the inputs (including the Simple Mode switch)
    const { prompt, language, simpleMode } = await request.json();

    if (!prompt || !prompt.trim()) return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });

    // 2. robust API Key Check (Checks BOTH possible names)
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ error: 'Server Error: API Key missing in Vercel Settings' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // 3. LOGIC: Simple Mode vs Complex Mode
    let instruction = "";
    if (simpleMode) {
      instruction = `
      CRITICAL INSTRUCTIONS:
      1. Write a SIMPLE, LINEAR program.
      2. NO loops, NO menus, NO "try again".
      3. Ask for input ONCE at the start.
      4. Output ONLY raw code.
      `;
    } else {
      instruction = `Write a professional, robust program. You MAY use loops/menus. Output ONLY raw code.`;
    }

    const finalPrompt = `Generate ${language} code for: "${prompt}". ${instruction}`;

    // 4. AUTO-FIX: Try 'flash', then 'pro', then '1.0' until one works
    const modelsToTry = ["gemini-1.5-flash", "gemini-pro", "gemini-1.0-pro"];
    let generatedCode = "";
    let lastError = "";

    for (const modelName of modelsToTry) {
      try {
        console.log(`Attempting with model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(finalPrompt);
        const response = await result.response;
        generatedCode = response.text();
        break; // It worked! Stop the loop.
      } catch (e: any) {
        console.error(`Model ${modelName} failed:`, e.message);
        lastError = e.message;
      }
    }

    if (!generatedCode) {
      throw new Error(`All models failed. Last error: ${lastError}`);
    }

    // 5. Clean up the code (remove markdown)
    generatedCode = generatedCode.replace(/```[\w]*\n?/g, '').replace(/```/g, '').trim();

    return NextResponse.json({ code: generatedCode, language: language.toLowerCase() });

  } catch (error: any) {
    console.error('Final Generation Error:', error);
    return NextResponse.json({ error: error.message || 'Unknown Error' }, { status: 500 });
  }
}
