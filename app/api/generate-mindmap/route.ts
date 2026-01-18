
import { NextResponse } from "next/server";
import { OpenAI } from "openai";

export async function POST(req: Request) {
    try {
        const { entities, context, apiKey } = await req.json();

        if (!apiKey) {
            return NextResponse.json({ error: "Missing API Key" }, { status: 400 });
        }

        const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });

        const systemPrompt = `
You are an expert knowledge graph generator.
Your task is to identify relationships between the provided entities based on the context.
Return a JSON object with a list of "edges".
Each edge must have:
- source: string (must be one of the provided entity names)
- target: string (must be one of the provided entity names)
- label: string (short description of relationship, e.g. "CEO of", "located in", "friends with")

Entities to connect: ${entities.map((e: any) => e.text).join(", ")}

Context:
${context.substring(0, 4000)}... (truncated)

Only return relationships that are explicitly supported by the text.
If no relationship exists, return an empty list.
Output JSON only.
`;

        const completion = await client.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: "Generate the knowledge graph edges." }
            ],
            response_format: { type: "json_object" }
        });

        const result = completion.choices[0].message.content;
        if (!result) throw new Error("No content generated");

        const data = JSON.parse(result);
        return NextResponse.json(data);

    } catch (error) {
        console.error("Mind Map Error:", error);
        return NextResponse.json({ error: "Failed to generate mind map" }, { status: 500 });
    }
}
