import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: NextRequest) {
    try {
        const { transcript, apiKey, instructions } = await req.json();

        if (!transcript || !apiKey) {
            return NextResponse.json({ error: "Missing transcript or API key" }, { status: 400 });
        }

        const openai = new OpenAI({ apiKey });

        const systemPrompt = `You are a helpful assistant that summarizes video transcripts. 
        Create a concise, bulleted summary of the key points discussed. 
        Focus on the main ideas and actionable takeaways.`;

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini", // Cost effective
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Please summarize the following transcript:\n${instructions ? `Instructions: ${instructions}\n` : ''}\n${transcript.substring(0, 30000)}` }
            ],
            temperature: 0.7,
        });

        const summary = response.choices[0].message.content;

        return NextResponse.json({ summary });

    } catch (error: any) {
        console.error("Summarize Error:", error);
        return NextResponse.json({ error: error.message || "Failed to customize" }, { status: 500 });
    }
}
