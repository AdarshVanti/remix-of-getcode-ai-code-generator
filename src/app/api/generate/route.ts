import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: NextRequest) {
  const { prompt, language, simpleMode } = await request.json();
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'API Key Missing in Vercel' }, { status: 500 });
  }

  // 🕵️ DIAGNOSTIC: Check what models are available to this Key
  try {
    const listResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const listData = await listResponse.json();

    if (listData.error) {
      console.error("API Key Error:", listData.error);
      return NextResponse.json({ error: `Google Refused Key: ${listData.error.message}` }, { status: 500 });
    }

    // Filter for models that support "generateContent"
    const availableModels = listData.models
      ?.filter((m: any) => m.supportedGenerationMethods?.includes("generateContent"))
      .map((m: any) => m.name.replace("models/", "")) || [];

    console.log("AVAILABLE MODELS:", availableModels);

    if (availableModels.length === 0) {
      return NextResponse.json({ error: "Your API Key is valid, but has NO access to any Gemini models. Please create a new Google Cloud Project." }, { status: 500 });
    }

    // 🚀 AUTO-FIX: Pick the best available model automatically
    const bestModel = availableModels.find((m: string) => m.includes("1.5-flash")) || 
                      availableModels.find((m: string) => m.includes("gemini-pro")) || 
                      availableModels[0];

    console.log(`Using auto-detected model: ${bestModel}`);

    // Generate Code using the valid model
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: bestModel });

    let instruction = simpleMode 
      ? "CRITICAL: Write SIMPLE, LINEAR code. No loops/menus. Input once." 
      : "Write professional code.";

    const result = await model.generateContent(`Generate ${language} code for: "${prompt}". ${instruction}`);
    const response = await result.response;
    let generatedCode = response.text().replace(/```[\w]*\n?/g, '').replace(/```/g, '').trim();

    return NextResponse.json({ code: generatedCode, language: language.toLowerCase() });

  } catch (error: any) {
    return NextResponse.json({ error: `Diagnostic Failed: ${error.message}` }, { status: 500 });
  }
}
