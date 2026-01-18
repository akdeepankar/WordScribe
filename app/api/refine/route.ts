import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { text, type, apiKey, context } = await req.json();

        if (!apiKey) {
            return NextResponse.json({ error: "Missing OpenAI API Key" }, { status: 400 });
        }

        if (!text || !type) {
            return NextResponse.json({ error: "Missing text or type" }, { status: 400 });
        }

        const prompt = `
        You are a data extraction assistant.
        Task: Extract a clean value for a table column named "${type}" from the provided text.
        
        Rules:
        1. Return ONLY the extracted value. No quotes, no explanations.
        2. If the text contains numbers as words (e.g. "four"), convert them to digits (e.g. "4").
        3. If the text is PII (like a credit card or generic name), format it clearly.
        4. If the text does not contain relevant info for "${type}", return "N/A".
        
        Input Text: "${text}"
        ${context ? `Context: ${context}` : ""}
        
        Extracted Value:
        `;

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-4o-mini", // Cost effective, fast
                messages: [
                    { role: "system", content: "You are a helpful data assistant." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.0,
                max_tokens: 50
            })
        });

        if (!response.ok) {
            const err = await response.json();
            console.error("OpenAI Error:", err);
            return NextResponse.json({ error: err.error?.message || "OpenAI API Error" }, { status: 500 });
        }

        const data = await response.json();
        const value = data.choices[0]?.message?.content?.trim() || "N/A";

        return NextResponse.json({ value });

    } catch (error: any) {
        console.error("Refine API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
