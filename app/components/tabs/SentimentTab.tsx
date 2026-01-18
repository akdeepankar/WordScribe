import { useState, useRef } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
    AreaChart,
    Area
} from 'recharts';
import { Loader2, TrendingUp, Activity, PlayCircle } from 'lucide-react';
import { toPng } from 'html-to-image';
import { cn } from '../../lib/utils';

interface SentimentPoint {
    timestamp: string;
    score: number;
    mood: string;
    snippet: string;
}

interface SentimentTabProps {
    transcript: string;
    apiKey: string;
    onSeek?: (time: number) => void;
    onOpenCanvas?: () => void;
}

export default function SentimentTab({ transcript, apiKey, onSeek, onOpenCanvas }: SentimentTabProps) {
    const [data, setData] = useState<SentimentPoint[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [hasGenerated, setHasGenerated] = useState(false);
    const chartRef = useRef<HTMLDivElement>(null);

    const handleGenerate = async () => {
        if (!apiKey) {
            alert("No API Key provided");
            return;
        }
        setIsGenerating(true);

        try {
            const res = await fetch('/api/generate-sentiment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transcript, apiKey })
            });

            if (!res.ok) throw new Error("Failed");
            const json = await res.json();
            setData(json.timeline || []);
            setHasGenerated(true);
        } catch (err) {
            console.error(err);
            alert("Failed to generate sentiment analysis");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleAddToCanvas = async () => {
        if (!chartRef.current || !data.length) return;

        try {
            // Capture chart as image
            const dataUrl = await toPng(chartRef.current, { backgroundColor: '#ffffff' }); // White bg for better legibility on canvas
            // Actually, let's just grab it as is.

            const event = new CustomEvent('protube-canvas-add-item', {
                detail: {
                    type: 'image',
                    content: dataUrl
                }
            });
            window.dispatchEvent(event);

            if (onOpenCanvas) onOpenCanvas();
        } catch (err) {
            console.error("Failed to capture chart", err);
            alert("Could not add chart to canvas");
        }
    };

    const parseTime = (timeStr: string) => {
        const parts = timeStr.split(':').map(Number);
        if (parts.length === 2) return parts[0] * 60 + parts[1];
        if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
        return 0;
    };

    const handlePointClick = (point: SentimentPoint) => {
        if (onSeek) {
            onSeek(parseTime(point.timestamp));
        }
    };

    // Custom Tooltip
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const pt = payload[0].payload as SentimentPoint;
            return (
                <div className="bg-black/90 backdrop-blur-md border border-white/10 p-3 rounded-lg text-xs shadow-xl max-w-[200px]">
                    <p className="font-bold text-white mb-1">{pt.timestamp} - {pt.mood}</p>
                    <p className="text-gray-300 italic">"{pt.snippet}"</p>
                    <div className="mt-2 flex items-center gap-1 text-blue-400">
                        <span className="font-mono text-[10px]">Score: {pt.score}</span>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="w-full h-full flex flex-col bg-white dark:bg-zinc-900 rounded-xl overflow-hidden relative border border-gray-200 dark:border-white/10">
            {/* Header / Controls */}
            <div className="p-4 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                        <Activity className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Emotional Arc</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Track the sentiment tone over time</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {hasGenerated && (
                        <button
                            onClick={handleAddToCanvas}
                            className="px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg text-xs font-medium hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                        >
                            Add Chart to Canvas
                        </button>
                    )}
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-white/10 shadow-sm border border-gray-200 dark:border-white/10 rounded-lg text-xs font-medium hover:bg-gray-50 dark:hover:bg-white/20 text-gray-700 dark:text-gray-200 disabled:opacity-50 transition-colors"
                    >
                        {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <TrendingUp className="w-3 h-3" />}
                        {hasGenerated ? "Re-Analyze" : "Analyze Sentiment"}
                    </button>
                </div>
            </div>

            {/* Capture Area (Chart + Legend) */}
            <div className="flex-1 flex flex-col min-h-0 relative" ref={chartRef}>
                {/* Content Area */}
                <div className="flex-1 min-h-0 relative p-4">
                    {!hasGenerated && !isGenerating && (
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-gray-400 bg-white/50 dark:bg-black/50 backdrop-blur-sm">
                            <Activity className="w-16 h-16 mb-4 opacity-20" />
                            <p className="text-sm font-medium">No Data Generated</p>
                            <p className="text-xs opacity-70">Click "Analyze Sentiment" to begin</p>
                        </div>
                    )}

                    {isGenerating && (
                        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-purple-500 bg-white/80 dark:bg-black/80 backdrop-blur-sm">
                            <Loader2 className="w-10 h-10 animate-spin mb-3" />
                            <p className="text-sm font-medium animate-pulse">Analyzing emotional tones...</p>
                        </div>
                    )}

                    {hasGenerated && (
                        <div className="w-full h-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }} onClick={(e: any) => e && e.activePayload && handlePointClick(e.activePayload[0].payload)}>
                                    <defs>
                                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} opacity={0.1} />
                                    <XAxis
                                        dataKey="timestamp"
                                        tick={{ fill: '#666', fontSize: 10 }}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        domain={[-10, 10]}
                                        tick={{ fill: '#666', fontSize: 10 }}
                                        tickLine={false}
                                        axisLine={false}
                                        width={30}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" opacity={0.5} />
                                    <Area
                                        type="monotone"
                                        dataKey="score"
                                        stroke="#8b5cf6"
                                        fillOpacity={1}
                                        fill="url(#colorScore)"
                                        strokeWidth={3}
                                        animationDuration={1500}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                {/* Legend / Info */}
                {hasGenerated && (
                    <div className="px-4 py-2 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 flex gap-4 text-[10px] text-gray-500 justify-center">
                        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-purple-500"></div> Positive</div>
                        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-gray-400"></div> Neutral</div>
                        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-indigo-900"></div> Negative</div>
                        <span className="opacity-50 ml-4">Click chart to seek</span>
                    </div>
                )}
            </div>
        </div>
    );
}
