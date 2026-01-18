import { Bookmark, GraduationCap, Plus, User, X, Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";
import { BookmarkItem } from "../../page";
import { useState } from "react";

interface Entity {
    entity_type: string;
    formattedTimestamp: string;
    text: string;
    start_char: number;
}

interface EntitiesTabProps {
    entities: Entity[];
    isEducationMode: boolean;
    showTablePanel: boolean;
    onSeek: (seconds: number) => void;
    onAddToTable: (entity: Entity) => void;
    transcript: string;
    apiKey: string;

    // Bookmark Props
    bookmarks: BookmarkItem[];
    onToggleBookmark: (item: BookmarkItem) => void;
}

export default function EntitiesTab({
    entities,
    isEducationMode,
    showTablePanel,
    onSeek,
    onAddToTable,
    transcript,
    apiKey,
    bookmarks,
    onToggleBookmark
}: EntitiesTabProps) {
    const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
    const [explanation, setExplanation] = useState<string | null>(null);
    const [isExplaining, setIsExplaining] = useState(false);

    const handleExplain = async (entity: Entity) => {
        if (!apiKey && !localStorage.getItem("protube_openai_key")) {
            alert("Please add your OpenAI API Key in Settings to use Education Mode.");
            return;
        }

        setSelectedEntity(entity);
        setExplanation(null);
        setIsExplaining(true);

        const entityText = entity.text;

        try {
            const savedKey = localStorage.getItem("protube_openai_key") || "";
            const res = await fetch("/api/explain-entity", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    entityText,
                    context: transcript, // Pass full transcript, API route will truncate if needed
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
        setSelectedEntity(null);
        setExplanation(null);
    };

    return (
        <div className={cn("grid gap-4", showTablePanel ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3")}>
            {entities.map((entity, idx) => (
                <div
                    key={idx}
                    onClick={() => {
                        if (isEducationMode) {
                            handleExplain(entity);
                        }
                    }}
                    className={cn(
                        "group relative rounded-xl border p-4 transition-all pr-12",
                        isEducationMode
                            ? "bg-white/5 border-white/10 hover:border-green-500 hover:bg-green-500/5 cursor-pointer"
                            : "bg-gray-50 border-gray-100 dark:bg-white/5 dark:border-white/5 cursor-default"
                    )}
                >
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onAddToTable(entity);
                        }}
                        className="absolute top-2 right-2 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-gray-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                        title="Add to Data Table"
                    >
                        <Plus className="h-4 w-4" />
                    </button>
                    <div className="flex items-start justify-between">
                        <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 uppercase tracking-wide">
                            {entity.entity_type.replace(/_/g, ' ')}
                        </span>
                        <span className="font-mono text-xs text-gray-400 group-hover:text-gray-300">
                            {entity.formattedTimestamp}
                        </span>
                    </div>
                    <div className="mt-3 font-medium text-gray-900 dark:text-gray-200 break-all">
                        {entity.text}
                    </div>
                </div>
            ))}
            {entities.length === 0 && (
                <div className="col-span-full py-12 flex flex-col items-center text-gray-500 space-y-3">
                    <div className="p-3 bg-gray-100 dark:bg-white/5 rounded-full">
                        <User className="h-6 w-6 opacity-50" />
                    </div>
                    <p>No PII or specific entities detected.</p>
                </div>
            )}

            {/* Explanation Modal */}
            {selectedEntity && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-2xl p-4">
                    <div className="bg-zinc-900 border border-white/10 p-6 rounded-xl w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in duration-200">
                        <button
                            onClick={handleCloseExplanation}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white"
                        >
                            <X size={18} />
                        </button>

                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/10 rounded-lg">
                                    <GraduationCap className="w-6 h-6 text-blue-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-white">{selectedEntity.text}</h3>
                            </div>

                            {/* Bookmark Button */}
                            {explanation && (
                                <button
                                    onClick={() => onToggleBookmark({
                                        id: `${selectedEntity.text}-${Date.now()}`,
                                        text: selectedEntity.text,
                                        explanation: explanation,
                                        type: selectedEntity.entity_type.replace(/_/g, ' '),
                                        timestamp: selectedEntity.formattedTimestamp,
                                        sourceId: "", // Will be filled by parent
                                        videoTitle: "" // Will be filled by parent
                                    })}
                                    className={cn(
                                        "p-2 rounded-lg transition-all",
                                        bookmarks.some(b => b.text === selectedEntity.text)
                                            ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                                            : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                                    )}
                                    title={bookmarks.some(b => b.text === selectedEntity.text) ? "Remove Bookmark" : "Bookmark Insight"}
                                >
                                    <Bookmark className={cn("w-5 h-5", bookmarks.some(b => b.text === selectedEntity.text) && "fill-current")} />
                                </button>
                            )}
                        </div>

                        <div className="min-h-[100px]">
                            {isExplaining ? (
                                <div className="flex flex-col items-center justify-center py-8 text-gray-400 space-y-3">
                                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
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
            )}
        </div>
    );
}

