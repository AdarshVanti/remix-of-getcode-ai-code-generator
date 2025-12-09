import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { prompt, language, simpleMode } = await request.json();

    // 🔒 SAFE DEBUGGING: Check if Vercel sees the key
    const apiKey = process.env.GROQ_API_KEY;
    
    console.log("--- DEBUG START ---");
    if (!apiKey) {
        console.error("❌ ERROR: Vercel says GROQ_API_KEY is undefined/empty.");
    } else {
        // Only show the first 4 letters (Safe!)
        console.log(`✅ Key found! Starts with: ${apiKey.substring(0, 4)}...`);
        console.log(`📏 Key length: ${apiKey.length} characters`);
    }
    console.log("--- DEBUG END ---");

    if (!apiKey) {
      return NextResponse.json({ error: 'Server Error: Key not found in Vercel Variables' }, { status: 500 });
    }

    // Prepare Instructions
    let instruction = simpleMode 
      ? "CRITICAL: Write SIMPLE, LINEAR code. No loops/menus. Input once. Output ONLY code." 
      : "Write professional code. Output ONLY code.";

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`, // Key is injected here
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: `Expert coder in ${language}. ${instruction}` },
          { role: "user", content: prompt }
        ],
        temperature: 0.1
      })
    });

    const data = await response.json();

    if (data.error) {
      console.error("Groq API Error:", data.error);
      return NextResponse.json({ error: `Groq Said: ${data.error.message}` }, { status: 500 });
    }

    let generatedCode = data.choices[0].message.content;
    generatedCode = generatedCode.replace(/```[\w]*\n?/g, '').replace(/```/g, '').trim();

    return NextResponse.json({ code: generatedCode, language: language.toLowerCase() });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
