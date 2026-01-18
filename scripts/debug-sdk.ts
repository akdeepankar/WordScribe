import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
// import 'dotenv/config'; // Not needed since key is hardcoded

// Hardcode key for this debug script since we know it
const apiKey = 'sk_e67a82e518448b0d9235e4c9dfdb017e91d68268cfcda70c';

async function run() {
    const elevenlabs = new ElevenLabsClient({ apiKey });

    const response = await fetch(
        'https://storage.googleapis.com/eleven-public-cdn/documentation_assets/audio/stt-entity-detection-pii.mp3'
    );
    const audioBlob = new Blob([await response.arrayBuffer()], { type: 'audio/mp3' });

    const transcription = await elevenlabs.speechToText.convert({
        file: audioBlob as any,
        modelId: 'scribe_v2',
        entityDetection: ['pii'],
    });

    const data = transcription as any;
    const reconstructedText = (data.words || []).map((w: any) => w.text).join("");
    const exactMatch = reconstructedText === data.text;

    console.log("--- TEXT MATCH CHECK ---");
    console.log(`Match: ${exactMatch}`);
    console.log("Text len:", data.text.length);
    console.log("Rec. len:", reconstructedText.length);
    if (!exactMatch) {
        console.log("Sample Text:", data.text.slice(0, 50));
        console.log("Sample Rec.:", reconstructedText.slice(0, 50));
    }

    console.log("--- WORDS SAMPLE ---");
    console.log(JSON.stringify((data.words || []).slice(0, 5), null, 2));

    console.log("--- ENTITIES SAMPLE ---");
    console.log(JSON.stringify((data.entities || []).slice(0, 3), null, 2));
}

run().catch(console.error);
