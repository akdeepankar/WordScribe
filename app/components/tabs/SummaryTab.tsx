'use client';

import { Loader2, Sparkles, X, PlayCircle, BarChart2, Calendar, Maximize2 } from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';
import { cn } from "../../lib/utils";

interface TimelineItem {
    timestamp: string;
    title: string;
    description: string;
}

interface Topic {
    name: string;
    relevance: number;
}

interface SummaryData {
    summary: string;
    timeline: TimelineItem[];
    topics: Topic[];
}

interface SummaryTabProps {
    transcript: string;
    apiKey: string;
    onSeek?: (time: number) => void;
}

export default function SummaryTab({ transcript, apiKey, onSeek }: SummaryTabProps) {
    const [data, setData] = useState<SummaryData | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isRefineModalOpen, setIsRefineModalOpen] = useState(false);
    const [isMaximized, setIsMaximized] = useState(false);
    const [refineInstructions, setRefineInstructions] = useState("");

    const handleGenerate = async () => {
        if (!apiKey && !localStorage.getItem("protube_openai_key")) {
            alert("Please set your OpenAI API Key in Settings first.");
            return;
        }

        setIsGenerating(true);
        setIsRefineModalOpen(false);

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

            const json = await res.json();

            if (json.error) throw new Error(json.error);

            // Handle legacy or plain text response just in case
            if (typeof json.summary === 'string' && !json.timeline) {
                setData({
                    summary: json.summary,
                    timeline: [],
                    topics: []
                });
            } else {
                setData(json);
            }

        } catch (error) {
            console.error(error);
            alert("Failed to generate summary");
        } finally {
            setIsGenerating(false);
        }
    };

    const parseTime = (timeStr: string) => {
        const parts = timeStr.split(':').map(Number);
        if (parts.length === 2) return parts[0] * 60 + parts[1];
        if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
        return 0;
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
                        <h3 className="text-sm font-bold text-gray-900">Visual Summary</h3>
                        <p className="text-xs text-gray-500">{data ? "AI Analysis Completed" : "Ready to analyze"}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => data ? setIsRefineModalOpen(true) : handleGenerate()}
                        disabled={isGenerating}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white shadow-sm border rounded-lg text-xs font-medium hover:bg-gray-50 text-gray-700 disabled:opacity-50 transition-colors"
                    >
                        {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                        {data ? "Refine Analysis" : "Generate Analysis"}
                    </button>
                    {data && (
                        <button
                            onClick={() => setIsMaximized(true)}
                            className="p-1.5 text-gray-400 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
                            title="Maximize View"
                        >
                            <Maximize2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                {!data ? (
                    <div className="text-center py-20 flex flex-col items-center justify-center h-full">
                        <Sparkles className="w-16 h-16 text-gray-300 mb-4 opacity-50" />
                        <h3 className="text-lg font-medium text-gray-500 mb-2">No Analysis Yet</h3>
                        <p className="text-sm text-gray-400 max-w-xs mx-auto">
                            Click "Generate Analysis" to get a visual breakdown of the content.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6 max-w-5xl mx-auto">
                        {/* Executive Summary */}
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4 flex items-center gap-2">
                                <FileTextIcon /> Executive Summary
                            </h4>
                            <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
                                {data.summary}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Topic Distribution Chart */}
                            {data.topics && data.topics.length > 0 && (
                                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col min-h-[300px]">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-6 flex items-center gap-2">
                                        <BarChart2 className="w-4 h-4" /> Key Topics
                                    </h4>
                                    <div className="flex-1 w-full min-h-[250px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={data.topics} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E5E7EB" />
                                                <XAxis type="number" hide />
                                                <YAxis
                                                    dataKey="name"
                                                    type="category"
                                                    width={100}
                                                    tick={{ fontSize: 11, fill: '#6B7280' }}
                                                    tickLine={false}
                                                    axisLine={false}
                                                />
                                                <Tooltip
                                                    cursor={{ fill: 'transparent' }}
                                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                />
                                                <Bar dataKey="relevance" radius={[0, 4, 4, 0]} barSize={20}>
                                                    {data.topics.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            )}

                            {/* Timeline */}
                            {data.timeline && data.timeline.length > 0 && (
                                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-6 flex items-center gap-2">
                                        <Calendar className="w-4 h-4" /> Key Moments
                                    </h4>
                                    <div className="space-y-4 relative pl-4 border-l-2 border-gray-100 ml-2">
                                        {data.timeline.map((item, idx) => (
                                            <div key={idx} className="relative pl-6 pb-2 group">
                                                {/* Timeline Dot */}
                                                <div
                                                    className="absolute -left-[25px] top-0 w-3 h-3 rounded-full border-2 border-white ring-1 ring-gray-200 bg-white group-hover:bg-blue-500 group-hover:ring-blue-500 transition-all cursor-pointer"
                                                    onClick={() => onSeek && onSeek(parseTime(item.timestamp))}
                                                ></div>

                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono text-xs font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                                                            {item.timestamp}
                                                        </span>
                                                        <h5 className="text-sm font-semibold text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors cursor-pointer" onClick={() => onSeek && onSeek(parseTime(item.timestamp))}>
                                                            {item.title}
                                                        </h5>
                                                    </div>
                                                    <p className="text-xs text-gray-500 leading-relaxed text-justify">
                                                        {item.description}
                                                    </p>

                                                    {onSeek && (
                                                        <button
                                                            onClick={() => onSeek(parseTime(item.timestamp))}
                                                            className="flex items-center gap-1 text-[10px] font-medium text-gray-400 hover:text-blue-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity w-fit"
                                                        >
                                                            <PlayCircle className="w-3 h-3" /> Jump to section
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Refine Modal Overlay */}
            {isRefineModalOpen && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white border border-gray-200 p-6 rounded-xl w-full max-w-md shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center">
                            <h3 className="text-gray-900 font-bold">Refine Analysis</h3>
                            <button onClick={() => setIsRefineModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                        </div>
                        <p className="text-xs text-gray-500">Provide specific instructions on what to focus on or how to structure the analysis.</p>
                        <textarea
                            value={refineInstructions}
                            onChange={(e) => setRefineInstructions(e.target.value)}
                            placeholder="E.g. Focus on the marketing strategies discussed..."
                            className="w-full h-32 bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-900 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none resize-none placeholder:text-gray-400"
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
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm transition-colors"
                            >
                                {isGenerating ? <Loader2 className="animate-spin w-4 h-4" /> : "Regenerate"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Maximize Modal */}
            {isMaximized && data && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="w-full max-w-6xl h-[90vh] bg-white dark:bg-zinc-900 rounded-2xl border border-white/10 shadow-2xl flex flex-col overflow-hidden relative animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="p-4 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                                    <Sparkles className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Visual Summary Analysis</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Detailed Full Screen View</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsMaximized(false)}
                                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-8">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
                                {/* Left Column: Summary and Topics */}
                                <div className="lg:col-span-2 space-y-8">
                                    <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
                                        <h4 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4 flex items-center gap-2">
                                            <FileTextIcon /> Executive Summary
                                        </h4>
                                        <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
                                            {data.summary}
                                        </div>
                                    </div>

                                    {data.topics && data.topics.length > 0 && (
                                        <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm flex flex-col h-[400px]">
                                            <h4 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-6 flex items-center gap-2">
                                                <BarChart2 className="w-5 h-5" /> Key Topics
                                            </h4>
                                            <div className="flex-1 w-full">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={data.topics} layout="vertical" margin={{ top: 0, right: 30, left: 60, bottom: 0 }}>
                                                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E5E7EB" />
                                                        <XAxis type="number" hide />
                                                        <YAxis
                                                            dataKey="name"
                                                            type="category"
                                                            width={120}
                                                            tick={{ fontSize: 13, fill: '#6B7280', fontWeight: 500 }}
                                                            tickLine={false}
                                                            axisLine={false}
                                                        />
                                                        <Tooltip
                                                            cursor={{ fill: 'transparent' }}
                                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                                        />
                                                        <Bar dataKey="relevance" radius={[0, 4, 4, 0]} barSize={28}>
                                                            {data.topics.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                            ))}
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Right Column: Heightened Timeline */}
                                <div className="h-full">
                                    {data.timeline && data.timeline.length > 0 && (
                                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-full overflow-y-auto">
                                            <h4 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-6 flex items-center gap-2 sticky top-0 bg-white pb-4 z-10 border-b border-gray-100">
                                                <Calendar className="w-5 h-5" /> Key Moments Timeline
                                            </h4>
                                            <div className="space-y-6 relative pl-4 border-l-2 border-gray-100 ml-2">
                                                {data.timeline.map((item, idx) => (
                                                    <div key={idx} className="relative pl-8 pb-4 group">
                                                        {/* Timeline Dot */}
                                                        <div
                                                            className="absolute -left-[27px] top-0 w-4 h-4 rounded-full border-2 border-white ring-2 ring-gray-100 bg-white group-hover:bg-blue-500 group-hover:ring-blue-500 transition-all cursor-pointer"
                                                            onClick={() => onSeek && onSeek(parseTime(item.timestamp))}
                                                        ></div>

                                                        <div className="flex flex-col gap-2">
                                                            <div className="flex items-center gap-3">
                                                                <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                                                                    {item.timestamp}
                                                                </span>
                                                                <h5 className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors cursor-pointer" onClick={() => onSeek && onSeek(parseTime(item.timestamp))}>
                                                                    {item.title}
                                                                </h5>
                                                            </div>
                                                            <p className="text-sm text-gray-600 leading-relaxed text-justify">
                                                                {item.description}
                                                            </p>

                                                            {onSeek && (
                                                                <button
                                                                    onClick={() => onSeek(parseTime(item.timestamp))}
                                                                    className="flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-blue-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity w-fit"
                                                                >
                                                                    <PlayCircle className="w-4 h-4" /> Jump to section
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>, document.body
            )}
        </div>
    );
}

const FileTextIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
);

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1'];
