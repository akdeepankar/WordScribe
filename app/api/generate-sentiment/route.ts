
import { NextResponse } from "next/server";
import { OpenAI } from "openai";

export async function POST(req: Request) {
    try {
        const { transcript, apiKey } = await req.json();

        if (!apiKey) {
            return NextResponse.json({ error: "Missing API Key" }, { status: 400 });
        }

        const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });

        const systemPrompt = `
You are an expert sentiment analyst. 
Analyze the emotional arc of the provided transcript over time.
Break the content into 10-20 key segments based on the narrative flow.
For each segment, provide:
- timestamp: string (approximate start time in MM:SS format, assuming the transcript starts at 00:00 and flows linearly. Estimate based on word count: approx 150 words per minute).
- score: number (from -10 (Extremely Negative) to 10 (Extremely Positive)).
- mood: string (a 1-2 word adjective description, e.g., "Tense", "Joyful", "Neutral").
- snippet: string (a short 5-10 word quote from that segment).

Return the data as a JSON object with a key "timeline" containing the array of segments.
`;

        const completion = await client.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Transcript:\n${transcript.substring(0, 50000)}` } // Truncate to safe limit if huge
            ],
            response_format: { type: "json_object" }
        });

        const result = completion.choices[0].message.content;
        if (!result) throw new Error("No content generated");

        const data = JSON.parse(result);
        return NextResponse.json(data);

    } catch (error) {
        console.error("Sentiment Error:", error);
        return NextResponse.json({ error: "Failed to generate sentiment" }, { status: 500 });
    }
}
