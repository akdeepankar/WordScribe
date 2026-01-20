
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

For each segment in the "timeline" array, provide:
- timestamp: string (approximate start time in MM:SS format).
- score: number (-10 to 10).
- mood: string (1-2 word adjective).
- snippet: string (short quote).

Also provide a high-level "analysis" object containing:
- summary: string (a concise paragraph describing the overall emotional journey).
- dominant_mood: string (the single most prevailing mood).
- peaks: array of objects { "timestamp": string, "score": number, "reason": string } identifying the 3-5 most significant emotional highs or lows.

Return the data as a JSON object with keys "timeline" and "analysis".
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
