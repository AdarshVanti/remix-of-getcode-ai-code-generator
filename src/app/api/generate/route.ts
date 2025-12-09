import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * POST /api/generate
 * Generates code based on prompt, language, and complexity mode
 */
export async function POST(request: NextRequest) {
  try {
    const { prompt, language, simpleMode } = await request.json();

    // Validate input
    if (!prompt || !prompt.trim()) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    if (!language || !['C', 'Java', 'Python'].includes(language)) {
      return NextResponse.json(
        { error: 'Invalid language selection' },
        { status: 400 }
      );
    }

    // Get API key from environment
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API configuration error: Key not found' },
        { status: 500 }
      );
    }

    // Initialize AI client
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // UPDATED: Using "gemini-pro" because it is the most stable version
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // --- LOGIC FOR SIMPLE VS COMPLEX MODE ---
    let instruction = "";
    
    if (simpleMode) {
      instruction = `
      CRITICAL INSTRUCTIONS FOR SIMPLE MODE:
      1. Write a SIMPLE, LINEAR program.
      2. DO NOT use 'while True' loops, infinite menus, or "Try again" prompts.
      3. DO NOT ask "Do you want to continue?".
      4. If the program needs input, ask for it ONCE at the start, do the logic, and EXIT immediately.
      5. Output ONLY the raw code. No markdown formatting.
      `;
    } else {
      instruction = `
      Write a professional and robust program.
      You MAY use loops, menus, and functions if appropriate for the task.
      Output ONLY the raw code. No markdown formatting.
      `;
    }

    const aiPrompt = `Generate ${language} code for the following request: "${prompt}".
    
    ${instruction}
    
    Language: ${language}`;

    // Generate code
    const result = await model.generateContent(aiPrompt);
    const response = await result.response;
    let generatedCode = response.text();

    // Clean up response - remove markdown code blocks if present
    generatedCode = generatedCode.replace(/```[\w]*\n?/g, '').replace(/```/g, '').trim();

    return NextResponse.json({
      code: generatedCode,
      language: language.toLowerCase(),
    });

  } catch (error: any) {
    console.error('Code generation error:', error);
    
    // Send the specific error message back so we can see it in the browser if it fails
    return NextResponse.json(
      { error: `Failed to generate code: ${error.message}` },
      { status: 500 }
    );
  }
}
