
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
You are an expert educational content generator.
Based on the provided transcript, generate a quiz with 5 multiple-choice questions to test the user's understanding of the key concepts.
Ensure the questions cover different parts of the content.

Return a JSON object with a key "questions" containing an array of objects.
Each object must have:
- question: string (The question text)
- options: string[] (Array of 4 possible answers)
- correctIndex: number (Index of the correct answer in the options array, 0-3)
- explanation: string (Brief explanation of why the answer is correct)

Output JSON only.
`;

        const completion = await client.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Transcript:\n${transcript.substring(0, 15000)}...` } // Truncate to safe limit
            ],
            response_format: { type: "json_object" }
        });

        const result = completion.choices[0].message.content;
        if (!result) throw new Error("No content generated");

        const data = JSON.parse(result);
        return NextResponse.json(data);

    } catch (error) {
        console.error("Quiz Generation Error:", error);
        return NextResponse.json({ error: "Failed to generate quiz" }, { status: 500 });
    }
}
