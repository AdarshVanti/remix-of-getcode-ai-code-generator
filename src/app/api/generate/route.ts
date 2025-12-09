import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { prompt, language, simpleMode } = await request.json();

    if (!prompt || !prompt.trim()) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Server Error: Groq API Key Missing' }, { status: 500 });
    }

    // 1. Prepare Instructions based on "Simple Mode"
    let systemInstruction = "";
    if (simpleMode) {
      systemInstruction = `
      CRITICAL INSTRUCTIONS:
      1. Write a SIMPLE, LINEAR program.
      2. NO loops, NO functions, NO menus, NO "try again".
      3. Ask for all inputs ONCE at the start.
      4. Output ONLY the raw code. Do NOT use markdown backticks (e.g. \`\`\`).
      `;
    } else {
      systemInstruction = `
      Write a professional, robust program.
      Output ONLY the raw code. Do NOT use markdown backticks.
      `;
    }

    // 2. Call Groq API (Using the OpenAI-compatible endpoint)
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile", // The best free model currently available
        messages: [
          { 
            role: "system", 
            content: `You are an expert coding assistant for ${language}. ${systemInstruction}` 
          },
          { 
            role: "user", 
            content: prompt 
          }
        ],
        temperature: 0.1, // Low temp = precise code
        max_tokens: 1024
      })
    });

    const data = await response.json();

    if (data.error) {
      console.error("Groq API Error:", data.error);
      throw new Error(data.error.message);
    }

    // 3. Extract and Clean Code
    let generatedCode = data.choices[0].message.content;
    
    // Remove markdown if the AI added it anyway
    generatedCode = generatedCode.replace(/```[\w]*\n?/g, '').replace(/```/g, '').trim();

    return NextResponse.json({ 
      code: generatedCode, 
      language: language.toLowerCase() 
    });

  } catch (error: any) {
    console.error("Generation Error:", error);
    return NextResponse.json({ error: error.message || 'Unknown Error' }, { status: 500 });
  }
}
