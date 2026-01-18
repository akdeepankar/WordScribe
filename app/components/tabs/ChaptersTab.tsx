import { BookOpen, Check, Clock, Copy, Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";

interface CheckChapter {
    timestamp: string;
    title: string;
    summary: string;
}

interface ChaptersTabProps {
    chapters: CheckChapter[];
    onSeek: (timestamp: string) => void;
    onCopy: () => void;
    copied: boolean;
}

export default function ChaptersTab({ chapters, onSeek, onCopy, copied }: ChaptersTabProps) {
    return (
        <div className="w-full h-full flex flex-col bg-slate-50 relative rounded-xl overflow-hidden border border-slate-200">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                        <Clock className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-900">Chapters</h3>
                        <p className="text-xs text-gray-500">{chapters.length} segments found</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">

                    <button
                        onClick={onCopy}
                        className="flex items-center gap-2 text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors bg-white hover:bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm"
                    >
                        {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied ? "Copied!" : "Copy List"}
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="relative space-y-0 pl-4">
                    {/* Vertical Timeline Line */}
                    <div className="absolute left-[27px] top-4 bottom-4 w-0.5 bg-gray-200" />

                    {chapters.map((chapter, idx) => (
                        <div
                            key={idx}
                            /* Removed onClick from card */
                            className="group relative flex gap-6 p-4 rounded-xl bg-white border border-gray-200 mb-3 last:mb-0"
                        >
                            {/* Timeline Dot */}
                            <div className="absolute left-[19px] top-8 w-4 h-4 rounded-full bg-white border-2 border-gray-300 z-10 flex items-center justify-center">
                                <div className="w-1.5 h-1.5 rounded-full bg-gray-300 transition-colors" />
                            </div>

                            {/* Timestamp - Clickable */}
                            <div className="shrink-0 w-16 pt-3 text-right">
                                <button
                                    onClick={() => onSeek(chapter.timestamp)}
                                    className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md hover:bg-blue-100 transition-colors cursor-pointer"
                                >
                                    {chapter.timestamp}
                                </button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 pt-1">
                                <h4 className="font-bold text-base text-gray-900 flex items-center gap-2">
                                    {chapter.title}
                                </h4>
                                <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                                    {chapter.summary}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
