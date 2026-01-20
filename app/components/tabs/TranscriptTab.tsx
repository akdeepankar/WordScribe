import { FileText, Search, ChevronDown, ChevronUp, X, Sparkles, Loader2, GraduationCap, Bookmark, Clock, Shield, ShieldCheck } from "lucide-react";
import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { cn } from "../../lib/utils";

import { BookmarkItem } from "../../page";

interface TranscriptTabProps {
    transcript: string;
    onSeek: (time: number) => void;
    apiKey: string;
    bookmarks: BookmarkItem[];
    onToggleBookmark: (item: BookmarkItem) => void;
    words?: any[];
    isSafeMode?: boolean;
    entities?: any[];
    onToggleSafeMode?: () => void;
}



const SENSITIVE_TYPES = [
    "credit_card", "credit_card_number", "card_number",
    "dob", "date_of_birth", "birth_date",
    "phone_number", "phone",
    "ssn", "social_security_number",
    "passport_number", "passport",
    "email", "email_address",
    "address", "location_address"
];

export default function TranscriptTab({ transcript, onSeek, apiKey, bookmarks, onToggleBookmark, words, isSafeMode = false, entities = [], onToggleSafeMode }: TranscriptTabProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
    const [matches, setMatches] = useState<number[]>([]);
    const transcriptRef = useRef<HTMLDivElement>(null);
    const [isSmartSelectEnabled, setIsSmartSelectEnabled] = useState(false);
    const [selectedText, setSelectedText] = useState<string | null>(null);
    const [explanation, setExplanation] = useState<string | null>(null);
    const [isExplaining, setIsExplaining] = useState(false);
    const [selectionPosition, setSelectionPosition] = useState<{ x: number, y: number } | null>(null);
    const [isTimelineMode, setIsTimelineMode] = useState(false);

    // Compute segments and matches
    // Compute masked transcript
    const displayTranscript = useMemo(() => {
        if (!isSafeMode || !entities) return transcript;

        // Filter sensitive entities - allow even if indices are missing (for text fallback)
        const sensitive = entities.filter(e =>
            SENSITIVE_TYPES.includes(e.entity_type?.toLowerCase())
        );

        console.log("SafeMode Calc:", { sensitiveCount: sensitive.length });

        // Sort descending to replace from end to start to preserve indices
        sensitive.sort((a, b) => b.start_char - a.start_char);

        let masked = transcript;
        for (const ent of sensitive) {
            // Safety check indices
            if (typeof ent.start_char === 'number' && ent.end_char && ent.start_char >= 0 && ent.end_char <= masked.length) {
                const len = ent.end_char - ent.start_char;
                const mask = "•".repeat(len);
                masked = masked.substring(0, ent.start_char) + mask + masked.substring(ent.end_char);
            }
        }

        // Fallback: Text-based replacement with fuzzy matching
        for (const ent of sensitive) {
            if (ent.text && ent.text.length > 2) {
                try {
                    const escaped = ent.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    // Replace spaces with flexible whitespace/separator matcher
                    const pattern = escaped.replace(/\s+/g, '[\\s\\W]*');
                    const regex = new RegExp(pattern, 'gi');
                    masked = masked.replace(regex, "••••");
                } catch (e) {
                    masked = masked.split(ent.text).join("••••");
                }
            }
        }

        return masked;
    }, [transcript, isSafeMode, entities]);



    // Compute masked words for timeline view (heuristic)
    // Compute masked words for timeline view using char index mapping
    const displayWords = useMemo(() => {
        if (!isSafeMode || !words || !entities) return words;

        // Filter sensitive entities
        const sensitiveEntities = entities.filter(e =>
            SENSITIVE_TYPES.includes(e.entity_type?.toLowerCase())
        );

        if (sensitiveEntities.length === 0) return words;

        // Map words to character ranges assuming the transcript is constructed by joining words with spaces
        let currentChar = 0;
        return words.map(w => {
            if (w.type !== 'word') {
                return w;
            }

            const start = currentChar;
            const end = start + w.text.length;

            // Check if this word overlaps with any sensitive entity OR matches text
            const isSensitive = sensitiveEntities.some(e =>
                (typeof e.start_char === 'number' && (
                    (start >= e.start_char && start < e.end_char) ||
                    (end > e.start_char && end <= e.end_char) ||
                    (start <= e.start_char && end >= e.end_char)
                )) ||
                (e.text && w.text && e.text.toLowerCase().includes(w.text.toLowerCase()) && w.text.length > 2)
            );

            // Advance char counter (Note: This assumes single space separation which is standard for Scribe)
            currentChar += w.text.length + 1;

            return isSensitive ? { ...w, text: "••••" } : w;
        });
    }, [words, isSafeMode, entities]);

    // Compute segments and matches based on DISPLAY transcript
    const segments = useMemo(() => {
        if (!searchQuery) return [{ text: displayTranscript, isMatch: false }];

        const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        const parts = displayTranscript.split(regex);

        return parts.map(part => ({
            text: part,
            isMatch: part.toLowerCase() === searchQuery.toLowerCase()
        }));
    }, [displayTranscript, searchQuery]);

    // Count matches effect
    useEffect(() => {
        if (!searchQuery) {
            setMatches([]);
            setCurrentMatchIndex(0);
            return;
        }

        const count = (displayTranscript.match(new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || []).length;
        setMatches(Array.from({ length: count }, (_, i) => i));
        setCurrentMatchIndex(0);
    }, [searchQuery, displayTranscript]);

    const handleNextMatch = () => {
        if (matches.length === 0) return;
        const next = (currentMatchIndex + 1) % matches.length;
        setCurrentMatchIndex(next);
        scrollToMatch(next);
    };

    const handlePrevMatch = () => {
        if (matches.length === 0) return;
        const prev = (currentMatchIndex - 1 + matches.length) % matches.length;
        setCurrentMatchIndex(prev);
        scrollToMatch(prev);
    };

    const handleMouseUp = useCallback(() => {
        if (!isSmartSelectEnabled) return;

        const selection = window.getSelection();
        if (!selection || selection.isCollapsed) return;

        const text = selection.toString().trim();
        if (text.length > 0) {
            // Get selection coordinates for positioning (optional, or just centered modal)
            // simplified: we'll use a centered modal for now as per design
            setSelectedText(text);
            handleExplain(text);
            // Clear selection to avoid visual clutter
            selection.removeAllRanges();
        }
    }, [isSmartSelectEnabled]);

    const handleExplain = async (text: string) => {
        if (!apiKey && !localStorage.getItem("protube_openai_key")) {
            alert("Please set your OpenAI API Key in Settings first.");
            return;
        }

        setExplanation(null);
        setIsExplaining(true);

        try {
            const savedKey = localStorage.getItem("protube_openai_key") || "";
            const res = await fetch("/api/explain-entity", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    entityText: text,
                    context: transcript.substring(0, 5000), // Limit context
                    apiKey: apiKey || savedKey
                })
            });

            if (!res.ok) throw new Error("Failed to fetch explanation");
            const data = await res.json();
            setExplanation(data.explanation);
        } catch (error) {
            console.error(error);
            setExplanation("Sorry, I couldn't explain this term right now.");
        } finally {
            setIsExplaining(false);
        }
    };

    const handleCloseExplanation = () => {
        setSelectedText(null);
        setExplanation(null);
    };

    const scrollToMatch = (index: number) => {
        setTimeout(() => {
            const el = document.getElementById(`match-${index}`);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 10);
    };

    let matchCounter = 0;

    return (
        <div className="space-y-4 h-full flex flex-col">
            <div className="flex items-center gap-2 bg-zinc-950 p-3 rounded-xl border border-white/5 sticky top-0 z-10 backdrop-blur-xl shadow-lg">
                <div className="relative flex-1 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-blue-400 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search within transcript..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white/5 border border-white/5 rounded-lg pl-9 pr-9 py-2 text-sm text-gray-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:bg-white/10 transition-all"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery("")}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-full text-zinc-500 hover:text-gray-300 transition-colors"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    )}
                </div>

                {searchQuery && matches.length > 0 && (
                    <div className="flex items-center gap-2 pl-2 border-l border-white/10 animate-in fade-in slide-in-from-right-2 duration-200">
                        <span className="text-[10px] uppercase tracking-wider font-medium text-zinc-500 min-w-[60px] text-center">
                            {currentMatchIndex + 1} / {matches.length}
                        </span>
                        <div className="flex bg-white/5 rounded-lg p-0.5 border border-white/5">
                            <button
                                onClick={handlePrevMatch}
                                className="p-1.5 hover:bg-white/10 rounded-md text-zinc-400 hover:text-white transition-colors"
                                title="Previous match"
                            >
                                <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <div className="w-px bg-white/10 my-1" />
                            <button
                                onClick={handleNextMatch}
                                className="p-1.5 hover:bg-white/10 rounded-md text-zinc-400 hover:text-white transition-colors"
                                title="Next match"
                            >
                                <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                )}
                {searchQuery && matches.length === 0 && (
                    <div className="px-3 py-1.5 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg animate-in fade-in zoom-in-95 duration-200">
                        No matches
                    </div>
                )}
            </div>

            {/* Toggles */}
            <div className="flex justify-end px-1 gap-2">
                {words && words.length > 0 && (
                    <button
                        onClick={() => {
                            setIsTimelineMode(!isTimelineMode);
                            if (!isTimelineMode) setIsSmartSelectEnabled(false); // Mutually exclusive best practice
                        }}
                        className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                            isTimelineMode
                                ? "bg-blue-100 text-blue-700 border border-blue-200 shadow-sm"
                                : "bg-gray-100 text-gray-500 hover:bg-gray-200 border border-transparent"
                        )}
                    >
                        <Clock className={cn("w-3.5 h-3.5", isTimelineMode && "text-blue-500")} />
                        {isTimelineMode ? "Time View Active" : "Time View"}
                    </button>
                )}

                <button
                    onClick={onToggleSafeMode}
                    className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                        isSafeMode
                            ? "bg-green-100 text-green-700 border border-green-200 shadow-sm"
                            : "bg-gray-100 text-gray-500 hover:bg-gray-200 border border-transparent"
                    )}
                >
                    {isSafeMode ? <ShieldCheck className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                    {isSafeMode ? "Safe Mode On" : "Safe Mode Off"}
                </button>

                <button
                    onClick={() => {
                        setIsSmartSelectEnabled(!isSmartSelectEnabled);
                        if (!isSmartSelectEnabled) setIsTimelineMode(false);
                    }}
                    className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                        isSmartSelectEnabled
                            ? "bg-purple-100 text-purple-700 border border-purple-200 shadow-sm"
                            : "bg-gray-100 text-gray-500 hover:bg-gray-200 border border-transparent"
                    )}
                >
                    <Sparkles className={cn("w-3.5 h-3.5", isSmartSelectEnabled && "fill-purple-300")} />
                    {isSmartSelectEnabled ? "Smart Select" : "Smart Select"}
                </button>
            </div>

            <div
                ref={transcriptRef}
                onMouseUp={handleMouseUp}
                className={cn(
                    "prose max-w-none text-gray-900 leading-relaxed text-lg whitespace-pre-wrap flex-1 overflow-auto p-4 bg-white rounded-lg border border-gray-200 shadow-inner",
                    isSmartSelectEnabled ? "cursor-text selection:bg-purple-200 selection:text-purple-900" : ""
                )}
            >
                {isTimelineMode && displayWords && displayWords.length > 0 ? (
                    <div className="flex flex-wrap gap-x-1 gap-y-1 pt-4">
                        {displayWords.map((word, i) => (
                            <span
                                key={i}
                                className={cn(
                                    "px-0.5 rounded transition-colors cursor-default relative group",
                                    word.type === 'word' ? "hover:bg-blue-100 hover:text-blue-900" : ""
                                )}
                            >
                                {word.text}
                                {/* Timestamp Tooltip */}
                                {word.type === 'word' && (
                                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-black text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap z-10 pointer-events-none font-mono">
                                        {formatTime(word.start)} – {formatTime(word.end)}
                                    </span>
                                )}
                            </span>
                        ))}
                    </div>
                ) : (
                    <>
                        {segments.map((segment, i) => {
                            if (segment.isMatch) {
                                const id = `match-${matchCounter}`;
                                const isCurrent = matchCounter === currentMatchIndex;
                                matchCounter++;
                                return (
                                    <span
                                        key={i}
                                        id={id}
                                        className={cn(
                                            "bg-yellow-300 text-black rounded px-1 transition-all duration-300 shadow-sm",
                                            isCurrent && "bg-yellow-500 font-bold ring-2 ring-yellow-600 scale-105 inline-block"
                                        )}
                                    >
                                        {segment.text}
                                    </span>
                                );
                            }
                            return <span key={i}>{segment.text}</span>;
                        })}
                    </>
                )}
            </div>

            {/* Explanation Modal */}
            {
                selectedText && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-xl p-4 animate-in fade-in duration-200">
                        <div className="bg-zinc-900 border border-white/10 p-6 rounded-xl w-full max-w-md shadow-2xl relative animate-in zoom-in-95 duration-200">
                            <button
                                onClick={handleCloseExplanation}
                                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                            >
                                <X size={18} />
                            </button>

                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-500/20 rounded-lg">
                                        <GraduationCap className="w-6 h-6 text-purple-400" />
                                    </div>
                                    <h3 className="text-lg font-bold text-white line-clamp-1 pr-8">{selectedText}</h3>
                                </div>

                                {/* Bookmark Button */}
                                {explanation && (
                                    <button
                                        onClick={() => onToggleBookmark({
                                            id: `${selectedText}-${Date.now()}`,
                                            text: selectedText || "", // Fix nullability
                                            explanation: explanation || "", // Fix nullability
                                            type: "Term",
                                            timestamp: "00:00",
                                            sourceId: "", // Will be filled by parent
                                            videoTitle: "" // Will be filled by parent
                                        })}
                                        className={cn(
                                            "p-2 rounded-lg transition-all mr-8",
                                            bookmarks.some(b => b.text === selectedText)
                                                ? "bg-purple-500 text-white shadow-lg shadow-purple-500/20"
                                                : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                                        )}
                                        title={bookmarks.some(b => b.text === selectedText) ? "Remove Bookmark" : "Bookmark Insight"}
                                    >
                                        <Bookmark className={cn("w-5 h-5", bookmarks.some(b => b.text === selectedText) && "fill-current")} />
                                    </button>
                                )}
                            </div>

                            <div className="min-h-[100px]">
                                {isExplaining ? (
                                    <div className="flex flex-col items-center justify-center py-8 text-gray-400 space-y-3">
                                        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                                        <p className="text-sm">Consulting AI Tutor...</p>
                                    </div>
                                ) : (
                                    <div className="prose prose-invert prose-sm">
                                        <p className="leading-relaxed text-gray-300">
                                            {explanation}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}

function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}
