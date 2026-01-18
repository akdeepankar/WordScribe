import { Loader2, Sparkles, X } from "lucide-react";
import { useState } from "react";

interface SummaryTabProps {
    transcript: string;
    apiKey: string;
}

export default function SummaryTab({ transcript, apiKey }: SummaryTabProps) {
    const [summary, setSummary] = useState<string>("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [isRefineModalOpen, setIsRefineModalOpen] = useState(false);
    const [refineInstructions, setRefineInstructions] = useState("");

    const handleGenerate = async () => {
        if (!apiKey && !localStorage.getItem("protube_openai_key")) {
            alert("Please set your OpenAI API Key in Settings first.");
            return;
        }

        setIsGenerating(true);
        setIsRefineModalOpen(false); // Close modal if open

        try {
            const savedKey = localStorage.getItem("protube_openai_key") || "";
            const res = await fetch("/api/summarize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    transcript,
                    apiKey: apiKey || savedKey,
                    instructions: refineInstructions
                })
            });
            const data = await res.json();
            if (data.summary) {
                setSummary(data.summary);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="w-full h-full flex flex-col bg-slate-50 relative rounded-xl overflow-hidden border border-slate-200">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                        <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-900">Summary</h3>
                        <p className="text-xs text-gray-500">{summary ? "AI Generated" : "Ready to generate"}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => summary ? setIsRefineModalOpen(true) : handleGenerate()}
                        disabled={isGenerating}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white shadow-sm border rounded-lg text-xs font-medium hover:bg-gray-50 text-gray-700 disabled:opacity-50"
                    >
                        {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                        {summary ? "Refine Summary" : "Generate"}
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                {!summary ? (
                    <div className="text-center py-20 flex flex-col items-center justify-center h-full">
                        <Sparkles className="w-16 h-16 text-gray-300 mb-4 opacity-50" />
                        <h3 className="text-lg font-medium text-gray-500 mb-2">No Summary Yet</h3>
                        <p className="text-sm text-gray-400 max-w-xs mx-auto">
                            Click "Generate" in the top right to get a concise summary of the transcript.
                        </p>
                    </div>
                ) : (
                    <div className="prose prose-lg max-w-none bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
                        <div className="whitespace-pre-wrap leading-relaxed text-gray-800 font-medium">
                            {summary}
                        </div>
                    </div>
                )}
            </div>

            {/* Refine Modal Overlay */}
            {isRefineModalOpen && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white border border-gray-200 p-6 rounded-xl w-full max-w-md shadow-2xl space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-gray-900 font-bold">Refine Summary</h3>
                            <button onClick={() => setIsRefineModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                        </div>
                        <textarea
                            value={refineInstructions}
                            onChange={(e) => setRefineInstructions(e.target.value)}
                            placeholder="E.g. Focus on the technical implementation details..."
                            className="w-full h-32 bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-900 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none resize-none"
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setIsRefineModalOpen(false)}
                                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleGenerate}
                                disabled={isGenerating}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm"
                            >
                                {isGenerating ? <Loader2 className="animate-spin w-4 h-4" /> : "Regenerate"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
