import { BrainCircuit, Loader2, Sparkles, RefreshCw } from "lucide-react";
import { useState } from "react";
import { cn } from "../../lib/utils";

interface FlashcardsTabProps {
    transcript: string;
    apiKey: string;
}

export default function FlashcardsTab({ transcript, apiKey }: FlashcardsTabProps) {
    const [flashcards, setFlashcards] = useState<{ question: string; answer: string }[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());

    const handleGenerate = async () => {
        if (!apiKey && !localStorage.getItem("protube_openai_key")) {
            alert("Please set your OpenAI API Key in Settings first.");
            return;
        }

        setIsGenerating(true);
        setFlashcards([]);
        setFlippedCards(new Set());

        try {
            const savedKey = localStorage.getItem("protube_openai_key") || "";
            const res = await fetch("/api/generate-flashcards", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    transcript,
                    apiKey: apiKey || savedKey
                })
            });
            const data = await res.json();
            if (data.flashcards) {
                setFlashcards(data.flashcards);
            }
        } catch (error) {
            console.error("Flashcard generation failed", error);
        } finally {
            setIsGenerating(false);
        }
    };

    const toggleFlip = (index: number) => {
        setFlippedCards(prev => {
            const next = new Set(prev);
            if (next.has(index)) {
                next.delete(index);
            } else {
                next.add(index);
            }
            return next;
        });
    };
    return (
        <div className="w-full h-full flex flex-col bg-slate-50 relative rounded-xl overflow-hidden border border-slate-200">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                        <BrainCircuit className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-900">Flashcards</h3>
                        <p className="text-xs text-gray-500">{flashcards.length > 0 ? `${flashcards.length} cards` : "Study mode"}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white shadow-sm border rounded-lg text-xs font-medium hover:bg-gray-50 text-gray-700 disabled:opacity-50"
                    >
                        {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                        {flashcards.length > 0 ? "Regenerate" : "Generate Cards"}
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                {flashcards.length === 0 ? (
                    <div className="text-center py-20 flex flex-col items-center justify-center h-full">
                        <BrainCircuit className="w-16 h-16 text-gray-300 mb-4 opacity-50" />
                        <h3 className="text-lg font-medium text-gray-500 mb-2">No Flashcards Yet</h3>
                        <p className="text-sm text-gray-400 max-w-xs mx-auto">
                            Click "Generate Cards" in the top right to create study materials from the transcript.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {flashcards.map((card, idx) => (
                            <div
                                key={idx}
                                onClick={() => toggleFlip(idx)}
                                className="group h-64 cursor-pointer" // Increased height for better readability
                                style={{ perspective: "1000px" }}
                            >
                                <div
                                    className="relative w-full h-full transition-all duration-500 shadow-sm hover:shadow-md rounded-xl"
                                    style={{
                                        transformStyle: "preserve-3d",
                                        transform: flippedCards.has(idx) ? "rotateY(180deg)" : "rotateY(0deg)"
                                    }}
                                >
                                    {/* Front: Question */}
                                    <div
                                        className="absolute inset-0 bg-white border border-gray-200 p-6 flex flex-col justify-between rounded-xl group-hover:border-blue-300 transition-colors"
                                        style={{ backfaceVisibility: "hidden" }}
                                    >
                                        <div className="flex-1 flex flex-col justify-center text-center">
                                            <span className="text-xs uppercase tracking-wider text-blue-500 font-bold mb-3 block">Question</span>
                                            <p className="text-gray-900 font-medium text-lg leading-relaxed">{card.question}</p>
                                        </div>
                                        <div className="text-center mt-4">
                                            <span className="text-xs text-gray-400">Click to flip</span>
                                        </div>
                                    </div>

                                    {/* Back: Answer */}
                                    <div
                                        className="absolute inset-0 bg-slate-900 border border-slate-800 p-6 flex flex-col justify-between rounded-xl"
                                        style={{
                                            backfaceVisibility: "hidden",
                                            transform: "rotateY(180deg)"
                                        }}
                                    >
                                        <div className="flex-1 flex flex-col justify-center text-center">
                                            <span className="text-xs uppercase tracking-wider text-green-400 font-bold mb-3 block">Answer</span>
                                            <p className="text-gray-100 leading-relaxed font-medium">{card.answer}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
