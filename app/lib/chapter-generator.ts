interface ScribeWord {
    text: string;
    start: number;
    end: number;
}

interface Chapter {
    timestamp: string;
    title: string;
    summary: string;
}

function formatTimestamp(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function generateChapters(words: ScribeWord[]): Chapter[] {
    // Simple heuristic: Create a new chapter every ~3-5 minutes or if there is a significant pause?
    // Since we don't have "semantic" segmentation without an LLM, we will use time-based + pause detection.
    // Actually, Scribe v2 usually provides good punctuation.

    if (!words || words.length === 0) return [];

    const chapters: Chapter[] = [];
    let lastChapterStart = 0;
    const MIN_CHAPTER_DURATION = 180; // 3 minutes

    // Always start with Intro
    chapters.push({
        timestamp: "00:00",
        title: "Introduction",
        summary: "Video introduction",
    });

    // Iterate to find split points
    for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const prevWord = words[i - 1];

        // Check gaps for potential pauses (if Scribe returns precise timings)
        // Or just check accumulating time
        if (word.start - lastChapterStart > MIN_CHAPTER_DURATION) {
            // Look for a sentence break (period) in the previous few words?
            // For simplicity, just break here.

            // Try to find a "Topic" from the first few words of the new section
            const titleSnippet = words.slice(i, i + 5).map(w => w.text).join(" ");
            // Clean up punctuation
            const title = titleSnippet.replace(/^[.,\s]+/, "") + "...";

            chapters.push({
                timestamp: formatTimestamp(word.start),
                title: `Topic: ${title}`,
                summary: "Segment discussion",
            });
            lastChapterStart = word.start;
        }
    }

    return chapters;
}
