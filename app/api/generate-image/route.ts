import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export const maxDuration = 60; // Allow 60 seconds

export async function POST(req: Request) {
    try {
        const { prompt, apiKey } = await req.json();

        if (!prompt) {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
        }

        if (!apiKey) {
            return NextResponse.json({ error: 'API key is required for DALL-E generation' }, { status: 401 });
        }

        const openai = new OpenAI({ apiKey });

        const response = await openai.images.generate({
            model: "dall-e-3",
            prompt: prompt,
            n: 1,
            size: "1024x1024",
            quality: "standard",
        });

        if (!response.data || !response.data[0] || !response.data[0].url) {
            throw new Error("No image generated");
        }

        const imageUrl = response.data[0].url;

        return NextResponse.json({ url: imageUrl });

    } catch (error) {
        console.error('Error generating image:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to generate image' },
            { status: 500 }
        );
    }
}
