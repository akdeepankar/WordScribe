import { useState } from "react";
import { AlertCircle, CheckCircle, Clock, FileAudio, Loader2, Play, ChevronLeft, ChevronRight, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "../lib/utils";

interface ProcessedItem {
    id: string;
    url: string;
    title: string;
    status: "pending" | "processing" | "completed" | "error";
    error?: string;
    thumbnail?: string;
}

interface FileSidebarProps {
    items: ProcessedItem[];
    activeId: string | null;
    onSelect: (id: string) => void;
    onRemove: (id: string) => void;
    isCollapsed: boolean;
    onToggle: () => void;
}

export default function FileSidebar({ items, activeId, onSelect, onRemove, isCollapsed, onToggle }: FileSidebarProps) {

    if (items.length === 0) return null;

    return (
        <div
            className={cn(
                "shrink-0 rounded-2xl border border-white/10 bg-zinc-900/50 overflow-hidden flex flex-col h-[calc(100vh-140px)] sticky top-24 transition-all duration-300 ease-in-out",
                isCollapsed ? "w-20" : "w-64"
            )}
        >
            <div className={cn(
                "p-4 border-b border-white/10 bg-white/5 flex items-center h-14",
                isCollapsed ? "justify-center" : "justify-between"
            )}>
                {!isCollapsed && (
                    <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2 truncate">
                        <FileAudio className="w-4 h-4 text-orange-500" />
                        Files ({items.length})
                    </h3>
                )}
                <button
                    onClick={onToggle}
                    className="text-gray-500 hover:text-white transition-colors"
                >
                    {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-hide">
                {items.map(item => (
                    <div
                        key={item.id}
                        className={cn(
                            "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all group border border-transparent relative",
                            activeId === item.id
                                ? "bg-white/10 border-white/10 shadow-lg"
                                : "hover:bg-white/5 hover:border-white/5",
                            isCollapsed && "justify-center px-0"
                        )}
                        title={isCollapsed ? item.title : undefined}
                    >
                        {/* Hit area for selection */}
                        <div
                            className="absolute inset-0 cursor-pointer z-0"
                            onClick={() => onSelect(item.id)}
                        />

                        {/* Status Icon */}
                        <div className="shrink-0 relative pointer-events-none z-10">
                            {item.thumbnail ? (
                                <img src={item.thumbnail} className="w-8 h-8 rounded object-cover opacity-80" alt="" />
                            ) : (
                                <div className="w-8 h-8 rounded bg-gray-800 flex items-center justify-center">
                                    <FileAudio className="w-4 h-4 text-gray-500" />
                                </div>
                            )}

                            <div className="absolute -bottom-1 -right-1 bg-zinc-900 rounded-full p-0.5 border border-zinc-900">
                                {item.status === 'processing' && <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />}
                                {item.status === 'completed' && <CheckCircle className="w-3 h-3 text-green-400" />}
                                {item.status === 'error' && <AlertCircle className="w-3 h-3 text-red-400" />}
                                {item.status === 'pending' && <Clock className="w-3 h-3 text-gray-400" />}
                            </div>
                        </div>

                        {!isCollapsed && (
                            <div className="min-w-0 flex-1 pointer-events-none z-10">
                                <p className={cn(
                                    "text-xs font-medium truncate",
                                    activeId === item.id ? "text-white" : "text-gray-400 group-hover:text-gray-300"
                                )}>
                                    {item.title || item.url}
                                </p>
                                <p className="text-[10px] text-gray-500 truncate mt-0.5 capitalize">
                                    {item.status}
                                </p>
                            </div>
                        )}

                        {activeId === item.id && !isCollapsed && <Play className="w-3 h-3 text-white fill-white shrink-0 pointer-events-none z-10" />}

                        {/* Delete Button - Only visible on hover or active */}
                        {!isCollapsed && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRemove(item.id);
                                }}
                                className="z-20 p-1.5 rounded-md hover:bg-red-500/20 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all absolute right-2 bg-zinc-900/80 backdrop-blur-sm"
                                title="Remove file"
                            >
                                <AlertCircle className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
