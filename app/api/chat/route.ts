
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export async function POST(req: Request) {
    try {
        const { messages, transcript, apiKey } = await req.json();

        if (!apiKey) {
            return NextResponse.json({ error: 'API Key is required' }, { status: 400 });
        }

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
        }

        const openai = new OpenAI({ apiKey: apiKey });

        // Construct the system message
        const systemMessage = {
            role: 'system',
            content: `You are a helpful AI assistant tasked with answering questions about a video based on its transcript. 
            
Context (Video Transcript):
${transcript ? transcript.slice(0, 50000) : "No transcript provided."} 
(Note: Transcript may be truncated if too long)

Instructions:
1. Answer the user's questions primarily using the information from the transcript.
2. If the answer is not in the transcript, state that clearly, but you may use general knowledge to helpfuly infer context if obvious (e.g. defining a term mentioned).
3. Be concise and direct.
4. If applicable, try to mention what part of the video (approximate context) the answer comes from.`
        };

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini", // Cost effective and fast
            messages: [systemMessage, ...messages],
            max_tokens: 500,
            temperature: 0.7,
        });

        const reply = completion.choices[0].message;

        return NextResponse.json({ message: reply });

    } catch (error: any) {
        console.error('Chat API Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
