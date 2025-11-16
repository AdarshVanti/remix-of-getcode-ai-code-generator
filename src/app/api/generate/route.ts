import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

/**
 * POST /api/generate
 * Generates code based on prompt and selected language
 * Provider-agnostic architecture - easy to swap AI providers
 */
export async function POST(request: NextRequest) {
  try {
    const { prompt, language } = await request.json();

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
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API configuration error' },
        { status: 500 }
      );
    }

    // Initialize AI client (currently Gemini, easily swappable)
    const client = new GoogleGenAI({ apiKey });

    // Construct the AI prompt
    const aiPrompt = `Generate ${language} code for the following request. 
Return ONLY the code without any explanations, markdown formatting, or code block markers.
Do not include \`\`\` or language tags.

Request: ${prompt}

Language: ${language}`;

    // Generate code using new SDK
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: aiPrompt,
            },
          ],
        },
      ],
    });

    // Extract generated code from response
    const textContent = response.candidates?.[0]?.content?.parts?.find(
      (part: any) => part.text
    );
    
    let generatedCode = textContent?.text || '';

    // Clean up response - remove markdown code blocks if present
    generatedCode = generatedCode.replace(/```[\w]*\n?/g, '').trim();

    return NextResponse.json({
      code: generatedCode,
      language: language.toLowerCase(),
    });

  } catch (error) {
    console.error('Code generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate code. Please try again.' },
      { status: 500 }
    );
  }
}