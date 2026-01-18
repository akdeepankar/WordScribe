"use client";

import { Bold, Download, Highlighter, PenLine, Image as ImageIcon, Eraser } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toPng } from 'html-to-image';
import { cn } from "../lib/utils";
import CanvasNotes from "./CanvasNotes";

interface NotesPanelProps {
    content: string;
    onChange: (content: string) => void;
    canvasItems: any[];
    setCanvasItems: any;
}

export default function NotesPanel({ content, onChange, canvasItems, setCanvasItems }: NotesPanelProps) {
    const [activeTab, setActiveTab] = useState<'text' | 'canvas'>('text');
    const [isHighlighterActive, setIsHighlighterActive] = useState(false);
    const editorRef = useRef<HTMLDivElement>(null);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);

        const handleSwitch = () => setActiveTab('canvas');
        window.addEventListener('protube-canvas-add-item', handleSwitch);
        return () => window.removeEventListener('protube-canvas-add-item', handleSwitch);
    }, []);

    // Sync content downstream (only initial or if drastically changed)
    useEffect(() => {
        if (editorRef.current) {
            // If editor is empty but we have content (e.g. remount/tab switch), force populate
            if (content && editorRef.current.innerHTML === "") {
                editorRef.current.innerHTML = content;
            }
            // Optional: Handle external updates? 
            // Usually unnecessary for local typing as we control the state, 
            // but if we want to support external resets, we can check diff.
            // But valid typing shouldn't be overwritten.
            else if (content !== editorRef.current.innerHTML && document.activeElement !== editorRef.current) {
                editorRef.current.innerHTML = content;
            }
        }
    }, [content, activeTab]);

    const handleInput = () => {
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    };

    const executeCommand = (command: string, value?: string) => {
        document.execCommand(command, false, value);
        if (editorRef.current) {
            editorRef.current.focus();
            handleInput();
        }
    };

    const checkSelectionState = () => {
        if (!editorRef.current) return;
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
            setIsHighlighterActive(false);
            return;
        }

        const anchor = selection.anchorNode;
        if (!editorRef.current.contains(anchor)) {
            setIsHighlighterActive(false);
            return;
        }

        const isHilite = document.queryCommandValue('hiliteColor');
        const parent = anchor?.nodeType === 3 ? anchor.parentElement : anchor as HTMLElement;
        const bg = parent?.style?.backgroundColor || '';
        const hasBgStyle = bg && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'inherit';

        setIsHighlighterActive(!!isHilite && isHilite !== 'transparent' && isHilite !== 'rgba(0, 0, 0, 0)' || !!hasBgStyle);
    };

    const handleHighlight = () => {
        if (isHighlighterActive) {
            document.execCommand('hiliteColor', false, 'transparent');
            document.execCommand('foreColor', false, 'white');
        } else {
            document.execCommand('hiliteColor', false, '#facc15');
            document.execCommand('foreColor', false, 'black');
        }

        if (editorRef.current) {
            editorRef.current.focus();
            // state updates via selectionchange listener
        }
    };

    const handleClearFormatting = () => {
        document.execCommand('hiliteColor', false, 'transparent');
        document.execCommand('removeFormat', false, ''); // Also clears bold/italic etc if checking strictly, but let's just do color first
        document.execCommand('foreColor', false, 'white'); // Reset to white (default theme)

        if (editorRef.current) {
            editorRef.current.focus();
            handleInput();
        }
    };

    const handleExportTxt = () => {
        if (!editorRef.current) return;
        const text = editorRef.current.innerText;
        const blob = new Blob([text], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `notes-${new Date().toISOString().slice(0, 10)}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleExportImage = async () => {
        if (!editorRef.current) return;
        try {
            const dataUrl = await toPng(editorRef.current, {
                backgroundColor: '#18181b',
                quality: 0.95,
                cacheBust: true,
                style: {
                    overflow: 'visible',
                    height: 'auto',
                    maxHeight: 'none',
                    padding: '40px'
                }
            });
            const link = document.createElement('a');
            link.download = `notes-snapshot-${Date.now()}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error("Failed to export image", err);
        }
    };

    if (!isMounted) return null;

    return (
        <div className="flex flex-col h-full bg-zinc-900 overflow-hidden">
            {/* Tab Switcher */}
            <div className="flex items-center px-2 pt-2 border-b border-white/5 bg-zinc-900 shrink-0">
                <button
                    onClick={() => setActiveTab('text')}
                    className={cn(
                        "px-4 py-2 text-xs font-medium rounded-t-lg transition-colors border-b-2",
                        activeTab === 'text'
                            ? "text-blue-400 border-blue-500 bg-white/5"
                            : "text-gray-500 border-transparent hover:text-gray-300 hover:bg-white/5"
                    )}
                >
                    Text Notes
                </button>
                <button
                    onClick={() => setActiveTab('canvas')}
                    className={cn(
                        "px-4 py-2 text-xs font-medium rounded-t-lg transition-colors border-b-2",
                        activeTab === 'canvas'
                            ? "text-purple-400 border-purple-500 bg-white/5"
                            : "text-gray-500 border-transparent hover:text-gray-300 hover:bg-white/5"
                    )}
                >
                    Canvas
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative">
                {activeTab === 'text' ? (
                    <div className="flex flex-col h-full bg-zinc-900">
                        {/* Toolbar */}
                        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 bg-white/5 shrink-0">
                            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                <PenLine className="w-5 h-5 text-blue-400" />
                                Editor
                            </h2>

                            <div className="flex items-center gap-1">
                                <button
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => executeCommand('bold')}
                                    className="p-2 hover:bg-white/10 rounded-lg text-gray-300 hover:text-white transition-colors"
                                    title="Bold"
                                >
                                    <Bold className="w-4 h-4" />
                                </button>

                                <button
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={handleHighlight}
                                    className={cn(
                                        "p-2 rounded-lg transition-colors group",
                                        isHighlighterActive
                                            ? "bg-yellow-400 text-black hover:bg-yellow-500"
                                            : "hover:bg-white/10 text-gray-300 hover:text-yellow-400"
                                    )}
                                    title="Highlight"
                                >
                                    <Highlighter className="w-4 h-4 group-active:scale-95 transition-transform" />
                                </button>

                                <button
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={handleClearFormatting}
                                    className="p-2 hover:bg-white/10 text-gray-300 hover:text-red-400 rounded-lg transition-colors"
                                    title="Clear Formatting / Remove Highlight"
                                >
                                    <Eraser className="w-4 h-4" />
                                </button>

                                <div className="w-px h-4 bg-white/10 mx-1" />
                                <button
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={handleExportImage}
                                    className="p-2 hover:bg-white/10 rounded-lg text-gray-300 hover:text-purple-400 transition-colors"
                                    title="Export as Image"
                                >
                                    <ImageIcon className="w-4 h-4" />
                                </button>
                                <button
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={handleExportTxt}
                                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                                    title="Export as Text"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    Text
                                </button>
                            </div>
                        </div>

                        {/* Editor Area */}
                        <div className="flex-1 overflow-y-auto p-6 relative">
                            <div
                                ref={editorRef}
                                contentEditable
                                suppressContentEditableWarning={true}
                                onInput={handleInput}
                                className="w-full h-full min-h-[50vh] outline-none text-gray-200 leading-relaxed whitespace-pre-wrap focus:text-white transition-colors empty:before:content-['Start_typing_your_notes_here...'] empty:before:text-gray-600"
                            />
                        </div>

                        {/* Footer / Status */}
                        <div className="border-t border-white/10 px-4 py-2 bg-black/20 text-[10px] text-gray-500 flex justify-between">
                            <span>Supports rich text</span>
                            <span>{content.length} chars</span>
                        </div>
                    </div>
                ) : (
                    <CanvasNotes items={canvasItems} setItems={setCanvasItems} />
                )}
            </div>
        </div>
    );
}

// Add these styles to global CSS ideally, but inline might work for `mark` or specific styles
// Check how `hiliteColor` renders. Usually it wraps in <span style="background-color: ..."> or <font>.
// We might need to ensure those styles are visible in dark mode.
