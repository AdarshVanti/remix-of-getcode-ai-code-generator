import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: NextRequest) {
  try {
    const { prompt, language, simpleMode } = await request.json();

    if (!prompt || !prompt.trim()) return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });

    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API Key Missing' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // 🎯 HARDCODED CORRECT MODEL
    // This model is free and fast. No more guessing.
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    let instruction = "";
    if (simpleMode) {
      instruction = `
      CRITICAL: Write a SIMPLE, LINEAR program.
      - NO loops, NO menus, NO "try again".
      - Ask for input ONCE at the start.
      - Output ONLY raw code.
      `;
    } else {
      instruction = `Write a professional program. Output ONLY raw code.`;
    }

    const result = await model.generateContent(`Generate ${language} code for: "${prompt}". ${instruction}`);
    const response = await result.response;
    let generatedCode = response.text();

    generatedCode = generatedCode.replace(/```[\w]*\n?/g, '').replace(/```/g, '').trim();

    return NextResponse.json({ code: generatedCode, language: language.toLowerCase() });

  } catch (error: any) {
    console.error("Gemini Error:", error);
    
    // If we hit the rate limit, tell the user clearly
    if (error.message.includes("429")) {
       return NextResponse.json({ error: "Quota Exceeded. Please wait 1 minute and try again." }, { status: 429 });
    }

    return NextResponse.json({ error: error.message || 'Unknown Error' }, { status: 500 });
  }
}
