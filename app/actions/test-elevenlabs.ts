"use server";

import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

export async function testElevenLabs() {
    try {
        const elevenlabs = new ElevenLabsClient({
            apiKey: 'sk_e67a82e518448b0d9235e4c9dfdb017e91d68268cfcda70c',
        });

        const response = await fetch(
            'https://storage.googleapis.com/eleven-public-cdn/documentation_assets/audio/stt-entity-detection-pii.mp3'
        );
        const audioBlob = new Blob([await response.arrayBuffer()], { type: 'audio/mp3' });

        const transcription = await elevenlabs.speechToText.convert({
            file: audioBlob,
            modelId: 'scribe_v2', // Model to use
            // Entity types to detect, accepts a list of specific entity types or categories.
            // To detect all entity types, use the "all" category.
            entityDetection: ['pii'],
        });

        const data = transcription as any;
        console.log('Entities detected:', data.entities);
        console.log('First 10 words:', (data.words || []).slice(0, 10)); // Inspect words structure
        return { success: true, entities: data.entities, words: data.words };
    } catch (error: any) {
        console.error("Test Error:", error);
        return { success: false, error: error.message || String(error) };
    }
}
