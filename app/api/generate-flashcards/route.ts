import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: NextRequest) {
    try {
        const { transcript, apiKey } = await req.json();

        if (!apiKey) {
            return NextResponse.json({ error: "Missing API Key" }, { status: 401 });
        }

        const openai = new OpenAI({ apiKey });

        const videoContext = transcript.substring(0, 15000); // Limit context to avoid token limits

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `You are an expert tutor. Your task is to generate 5-8 high-quality study flashcards based on the provided video transcript.
                    
                    Return a JSON object with a "flashcards" array. Each item should have:
                    - "question": A clear, concise question about a key concept.
                    - "answer": A brief, accurate answer.
                    
                    Focus on main ideas, definitions, and specific facts mentioned in the text.`
                },
                {
                    role: "user",
                    content: `Transcript:\n\n${videoContext}\n\nGenerate JSON flashcards.`
                }
            ],
            response_format: { type: "json_object" },
            temperature: 0.7,
        });

        const content = completion.choices[0].message.content;
        if (!content) throw new Error("No content generated");

        const result = JSON.parse(content);
        return NextResponse.json({ flashcards: result.flashcards });

    } catch (error: any) {
        console.error("Flashcard generation error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
