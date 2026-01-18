import { NextResponse } from "next/server";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { getAudioStream } from "../../lib/youtube";
import { generateChapters } from "../../lib/chapter-generator";
import { analyzeTranscript } from "../../lib/analysis-engine";

// Client initialized in handler to avoid build-time env requirements

async function streamToBuffer(stream: any): Promise<Buffer> {
    const chunks: any[] = [];
    return new Promise((resolve, reject) => {
        stream.on("data", (chunk: any) => chunks.push(Buffer.from(chunk)));
        stream.on("error", (err: any) => reject(err));
        stream.on("end", () => resolve(Buffer.concat(chunks)));
    });
}

export async function POST(req: Request) {
    try {
        const { url, keyTerms, apiKey, entityTypes } = await req.json();

        if (!apiKey) {
            return NextResponse.json({ error: "Missing ElevenLabs API Key" }, { status: 400 });
        }

        const client = new ElevenLabsClient({ apiKey });

        // 1. Get Audio
        console.log("Fetching audio for:", url);
        const isYouTube = url.match(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/);
        let audioBuffer: Buffer;

        if (isYouTube) {
            const audioStream = await getAudioStream(url);
            audioBuffer = await streamToBuffer(audioStream);
        } else {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Failed to fetch audio file: ${response.statusText}`);
            audioBuffer = Buffer.from(await response.arrayBuffer());
        }

        // 2. Call ElevenLabs Scribe v2
        try {
            console.log("Sending to Scribe v2...", entityTypes);
            // Convert Buffer to Blob for the JS SDK
            const audioFile = new Blob([audioBuffer as any], { type: "audio/mp3" });

            const keytermsArray = keyTerms ? keyTerms.split(",").map((t: string) => t.trim()).filter((t: string) => t.length > 0) : [];

            const scribeConfig = {
                modelId: "scribe_v2",
                tagAudioEvents: true,
                diarize: true,
                languageCode: "eng",
                entityDetection: entityTypes && entityTypes.length > 0 ? entityTypes : ["all"],
                keyterms: keytermsArray.length > 0 ? keytermsArray : undefined,
            };

            const transcription = await client.speechToText.convert({
                file: audioFile,
                ...scribeConfig,
            } as any);

            console.log("Transcription complete");
            const data = transcription as any;
            const chapters = generateChapters(data.words || []);

            // 3. Analyze Content
            const analysis = analyzeTranscript(data.text);

            // ... Entity Logic ...
            // Map character offsets to timestamps using the words array

            // 1. Reconstruct text from words to detect index drift (e.g. prefix artifacts like "...")
            let runningCharCount = 0;
            const wordsWithOffsets = (data.words || []).map((w: any) => {
                const startChar = runningCharCount;
                runningCharCount += (w.text || "").length;
                return { ...w, startChar, endChar: runningCharCount };
            });

            const reconstructedText = wordsWithOffsets.map((w: any) => w.text).join("");
            let offset = 0;

            // Simple alignment check: find where data.text starts in reconstructedText
            if (data.text && reconstructedText) {
                const searchSnippet = data.text.slice(0, 30);
                // Only search if snippet is reasonably long to avoid false positives on short words
                if (searchSnippet.length > 5) {
                    const foundIndex = reconstructedText.indexOf(searchSnippet);
                    if (foundIndex !== -1) {
                        offset = foundIndex; // reconstructed has extra prefix (e.g. "...")
                    } else {
                        // Check if reconstructed starts later in data.text (missing prefix)
                        const revSearch = reconstructedText.slice(0, 30);
                        if (revSearch.length > 5) {
                            const revIndex = data.text.indexOf(revSearch);
                            if (revIndex !== -1) {
                                offset = -revIndex;
                            }
                        }
                    }
                }
            }

            console.log(`Entity mapping alignment: offset=${offset}`);

            const entities = (data.entities || []).map((entity: any) => {
                // Determine entity start char (handle different SDK versions if necessary)
                const rawStartChar = entity.startChar !== undefined ? entity.startChar : entity.start_char;
                const entityStartChar = rawStartChar + offset; // Adjust for drift

                // Find the word that contains the start_char
                const startWord = wordsWithOffsets.find((w: any) =>
                    w.startChar <= entityStartChar && w.endChar > entityStartChar
                ) || wordsWithOffsets.find((w: any) => w.startChar >= entityStartChar && w.startChar < entityStartChar + 20); // Fuzzy fallback

                const startTime = startWord ? startWord.start : 0;

                // Format timestamp (MM:SS.mmm)
                const minutes = Math.floor(startTime / 60);
                const seconds = Math.floor(startTime % 60);
                const milliseconds = Math.floor((startTime % 1) * 1000);
                const formattedTimestamp = `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;

                return {
                    ...entity,
                    entity_type: entity.entityType || entity.entity_type, // Normalize for frontend
                    timestamp: startTime,
                    formattedTimestamp: formattedTimestamp
                };
            });

            const detectedEntities: any[] = [...entities];
            if (keyTerms) {
                const terms = keyTerms.split(",").map((t: string) => t.trim());
                terms.forEach((term: string) => {
                    if (data.text.toLowerCase().includes(term.toLowerCase())) {
                        detectedEntities.push({
                            label: "Key Term",
                            text: term,
                            entity_type: "key_term",
                            timestamp: 0,
                            formattedTimestamp: "0:00"
                        });
                    }
                });
            }

            return NextResponse.json({
                transcript: data.text,
                chapters: chapters,
                entities: detectedEntities,
                words: data.words,
                highlights: analysis.highlights,
                sponsors: analysis.sponsors,
                qa: analysis.qa,
                raw: data, // Full raw response
                requestConfig: scribeConfig // Config sent to API
            });

        } catch (scribeError: any) {
            console.error("ElevenLabs Scribe Error:", scribeError);
            return NextResponse.json({
                error: `ElevenLabs API Error: ${scribeError.message || scribeError}`
            }, { status: 500 });
        }
    } catch (error) {
        console.error("Transcribe Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
