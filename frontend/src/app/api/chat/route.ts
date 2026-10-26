import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const prompt = body?.prompt;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Backend target: checks BACKEND_API_URL or NEXT_PUBLIC_API_URL
    const backendUrl =
      process.env.BACKEND_API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      'http://127.0.0.1:5000/api/chat';

    try {
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
        signal: AbortSignal.timeout(60000), // 60s timeout for RAG chain
      });

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json({
          response: data.response || 'No response generated.',
          source: 'rag-backend',
        });
      }
    } catch (backendErr) {
      console.warn('Flask backend fetch failed, attempting Groq fallback if configured:', backendErr);
    }

    // Optional direct Groq fallback if user sets GROQ_API_KEY in Vercel environment variables
    const groqKey = process.env.GROQ_API_KEY;
    if (groqKey) {
      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model: process.env.GROQ_MODEL_NAME || 'openai/gpt-oss-20b',
          messages: [
            {
              role: 'system',
              content:
                'You are an intelligent, empathetic medical assistant. Answer the medical question thoroughly, structured with clear paragraphs and actionable advice. Include standard medical disclaimers.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.3,
          max_tokens: 650,
        }),
      });

      if (groqRes.ok) {
        const groqData = await groqRes.json();
        const text = groqData.choices?.[0]?.message?.content || 'No answer available.';
        return NextResponse.json({ response: text, source: 'groq-direct' });
      }
    }

    return NextResponse.json(
      {
        error:
          'Backend is currently offline. Please ensure your Python Flask server is running at http://127.0.0.1:5000 or configure NEXT_PUBLIC_API_URL on Vercel.',
      },
      { status: 503 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
