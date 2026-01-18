export interface AnalysisResult {
    highlights: Highlight[];
    sponsors: SponsorSegment[];
    qa: QAPair[];
}

export interface Highlight {
    text: string;
    sentiment: "positive" | "negative" | "neutral";
}

export interface SponsorSegment {
    brand?: string;
    text: string;
}

export interface QAPair {
    question: string;
    answer: string;
}

export function analyzeTranscript(text: string): AnalysisResult {
    return {
        highlights: extractHighlights(text),
        sponsors: extractSponsors(text),
        qa: extractQA(text),
    };
}

function extractHighlights(text: string): Highlight[] {
    const highlights: Highlight[] = [];
    // Look for emphatic phrases
    const patterns = [
        /the most important thing is ([^.]+)./gi,
        /key takeaway is ([^.]+)./gi,
        /I really believe that ([^.]+)./gi,
        /crucial point is ([^.]+)./gi,
    ];

    patterns.forEach((pattern) => {
        let match;
        while ((match = pattern.exec(text)) !== null) {
            if (match[1] && match[1].length > 10) {
                highlights.push({
                    text: match[0].trim(),
                    sentiment: "neutral", // Simplification
                });
            }
        }
    });

    // Fallback: If minimal highlights, pick sentences with "important", "critical", "essential"
    if (highlights.length < 2) {
        const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
        sentences.forEach(s => {
            if (/\b(important|critical|essential|must|always|never)\b/i.test(s)) {
                if (highlights.length < 5) {
                    highlights.push({ text: s.trim(), sentiment: "neutral" });
                }
            }
        })
    }

    return highlights;
}

function extractSponsors(text: string): SponsorSegment[] {
    const sponsors: SponsorSegment[] = [];
    const patterns = [
        /sponsored by ([^.,]+)/i,
        /thanks to ([^.,]+) for sponsoring/i,
        /shout out to ([^.,]+) for supporting/i,
        /partnered with ([^.,]+)/i
    ];

    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];

    sentences.forEach((sentence) => {
        // Check for patterns
        for (const pattern of patterns) {
            const match = sentence.match(pattern);
            if (match && match[1]) {
                sponsors.push({
                    brand: match[1].trim(),
                    text: sentence.trim()
                });
                return; // Move to next sentence
            }
        }

        // Check for "link in description" combined with "offer" or "code"
        if (/\blink in(?: the)? description\b/i.test(sentence) && /\b(code|offer|deal|discount)\b/i.test(sentence)) {
            sponsors.push({ text: sentence.trim() });
        }
    });

    return sponsors;
}

function extractQA(text: string): QAPair[] {
    const qa: QAPair[] = [];
    // Simple heuristic: Look for a sentence ending in "?" followed by a sentence.
    // Ideally relies on speaker changes, but with raw text we guess.

    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];

    for (let i = 0; i < sentences.length - 1; i++) {
        const current = sentences[i].trim();
        const next = sentences[i + 1].trim();

        if (current.endsWith("?") && current.length < 150) {
            // It's a question. Check if next is likely an answer (not another question)
            if (!next.endsWith("?")) {
                qa.push({
                    question: current,
                    answer: next
                });
            }
        }
    }

    return qa.slice(0, 10); // Limit to 10
}
