import { FileText, Search, ChevronDown, ChevronUp, X } from "lucide-react";
import { useState, useMemo, useRef, useEffect } from "react";
import { cn } from "../../lib/utils";

interface TranscriptTabProps {
    transcript: string;
    onSeek: (time: number) => void;
}

export default function TranscriptTab({ transcript, onSeek }: TranscriptTabProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
    const [matches, setMatches] = useState<number[]>([]);
    const transcriptRef = useRef<HTMLDivElement>(null);

    // Compute segments and matches
    const segments = useMemo(() => {
        if (!searchQuery) return [{ text: transcript, isMatch: false }];

        const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        const parts = transcript.split(regex);

        return parts.map(part => ({
            text: part,
            isMatch: part.toLowerCase() === searchQuery.toLowerCase()
        }));
    }, [transcript, searchQuery]);

    // Count matches effect
    useEffect(() => {
        if (!searchQuery) {
            setMatches([]);
            setCurrentMatchIndex(0);
            return;
        }

        const count = (transcript.match(new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || []).length;
        setMatches(Array.from({ length: count }, (_, i) => i));
        setCurrentMatchIndex(0);
    }, [searchQuery, transcript]);

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
            <div ref={transcriptRef} className="prose max-w-none text-gray-900 leading-relaxed text-base whitespace-pre-wrap flex-1 overflow-auto p-4 bg-white rounded-lg border border-gray-200 shadow-inner">
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
            </div>
        </div >
    );
}
