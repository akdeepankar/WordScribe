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
        Analyze the transcript and return a JSON object with the following structure:
        {
            "summary": "A concise, markdown-formatted summary of the key points.",
            "timeline": [
                { "timestamp": "MM:SS", "title": "Section Title", "description": "Brief description of what happens." }
            ],
            "topics": [
                { "name": "Topic Name", "relevance": 85 }
            ]
        }
        Ensure the timeline captures the main flow of the video, and topics represent the key themes (relevance 0-100).`;

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini", // Cost effective
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Please analyze the following transcript:\n${instructions ? `Instructions: ${instructions}\n` : ''}\n${transcript.substring(0, 30000)}` }
            ],
            temperature: 0.7,
            response_format: { type: "json_object" }
        });

        const content = response.choices[0].message.content;
        if (!content) throw new Error("No content returned");

        const data = JSON.parse(content);

        return NextResponse.json(data);

    } catch (error: any) {
        console.error("Summarize Error:", error);
        return NextResponse.json({ error: error.message || "Failed to summarize" }, { status: 500 });
    }
}
