import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: NextRequest) {
    try {
        const { entityText, context, apiKey } = await req.json();

        if (!entityText || !apiKey) {
            return NextResponse.json({ error: "Missing entity text or API key" }, { status: 400 });
        }

        const openai = new OpenAI({ apiKey });

        const systemPrompt = `You are a helpful tutor explaining concepts from a video transcript. 
        Provide a concise, easy-to-understand explanation of the term provided. 
        If context is provided, relate the definition back to how it's used in the video.
        Keep the explanation under 150 words.`;

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Explain the term: "${entityText}"\n\nContext from video:\n${context?.substring(0, 500) || "No context provided."}` }
            ],
            temperature: 0.7,
        });

        const explanation = response.choices[0].message.content;

        return NextResponse.json({ explanation });

    } catch (error: any) {
        console.error("Explain Entity Error:", error);
        return NextResponse.json({ error: error.message || "Failed to explain entity" }, { status: 500 });
    }
}
