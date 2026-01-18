
import { NextResponse } from 'next/server';
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

export async function POST(req: Request) {
    try {
        const { text, apiKey } = await req.json();

        if (!apiKey) {
            return NextResponse.json({ error: 'ElevenLabs API Key is required' }, { status: 400 });
        }

        if (!text) {
            return NextResponse.json({ error: 'Text content is required' }, { status: 400 });
        }

        const client = new ElevenLabsClient({ apiKey });

        // Generate audio stream
        const audioStream = await client.textToSpeech.convert("JBFqnCBsd6RMkjVDRZzb", { // "George" voice ID
            text: text,
            modelId: "eleven_turbo_v2",
            outputFormat: "mp3_44100_128",
        });

        // Collect stream into a buffer
        const chunks: any[] = [];
        for await (const chunk of (audioStream as any)) {
            chunks.push(chunk);
        }
        const audioBuffer = Buffer.concat(chunks);

        // Convert to base64 to send to client (simpler than streaming for this use case)
        // Alternatively, we could return a direct stream, but base64 is easier to handle in frontend state for now
        const base64Audio = audioBuffer.toString('base64');
        const dataUrl = `data:audio/mp3;base64,${base64Audio}`;

        return NextResponse.json({ audioUrl: dataUrl });

    } catch (error: any) {
        console.error('Audio Generation Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
