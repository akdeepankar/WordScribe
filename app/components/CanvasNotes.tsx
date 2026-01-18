"use client";

import { useState, useRef, useEffect } from 'react';
import { Download, Image as ImageIcon, Type, X, Maximize2, RotateCw, Paintbrush, Undo, Redo } from 'lucide-react';
import { toPng } from 'html-to-image';
import { cn } from '../lib/utils';

// Types
type CanvasItemType = 'text' | 'image' | 'path';

interface CanvasItem {
    id: string;
    type: CanvasItemType;
    content: string; // Text content or Image URL. For path, it can be drawing instructions if needed, or unused.
    x: number;
    y: number;
    width?: number;
    height?: number;
    rotation?: number;
    fontSize?: number;
    color?: string;
    backgroundColor?: string;
    isBold?: boolean;
    isItalic?: boolean;
    points?: { x: number, y: number }[]; // For drawings
}

interface CanvasNotesProps {
    items: CanvasItem[];
    setItems: React.Dispatch<React.SetStateAction<CanvasItem[]>>;
}

export default function CanvasNotes({ items, setItems }: CanvasNotesProps) {
    // const [items, setItems] = useState<CanvasItem[]>([]); // Lifted up
    const itemsRef = useRef(items);
    useEffect(() => { itemsRef.current = items; }, [items]);

    const [fontSize, setFontSize] = useState("14");
    const containerRef = useRef<HTMLDivElement>(null);
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [resizingId, setResizingId] = useState<string | null>(null);
    const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0, initialFontSize: 0 });
    const [rotatingId, setRotatingId] = useState<string | null>(null);
    const [rotateStart, setRotateStart] = useState({ x: 0, y: 0, angle: 0, centerX: 0, centerY: 0 });
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const [activeInput, setActiveInput] = useState<{ type: CanvasItemType, x: number, y: number } | null>(null);
    const [inputValue, setInputValue] = useState("");

    // Drawing & History
    const [isDrawingMode, setIsDrawingMode] = useState(false);
    const [currentPath, setCurrentPath] = useState<{ x: number, y: number }[]>([]);
    const [drawingColor, setDrawingColor] = useState('#000000');

    // History Stack
    const [history, setHistory] = useState<CanvasItem[][]>([[]]);
    const [historyStep, setHistoryStep] = useState(0);

    const saveHistory = (newItems: CanvasItem[]) => {
        const newHistory = history.slice(0, historyStep + 1);
        newHistory.push(newItems);
        setHistory(newHistory);
        setHistoryStep(newHistory.length - 1);
    };

    const undo = () => {
        if (historyStep > 0) {
            const prevStep = historyStep - 1;
            setItems(history[prevStep]);
            setHistoryStep(prevStep);
        }
    };

    const redo = () => {
        if (historyStep < history.length - 1) {
            const nextStep = historyStep + 1;
            setItems(history[nextStep]);
            setHistoryStep(nextStep);
        }
    };


    // --- Actions ---

    const startAddingText = () => {
        setActiveInput({ type: 'text', x: 200, y: 200 });
        setInputValue("");
    };

    const startAddingImage = () => {
        setActiveInput({ type: 'image', x: 200, y: 200 });
        setInputValue("");
    };

    // Listen for external add commands (e.g. from Sentiment Tab)
    useEffect(() => {
        const handleExternalAdd = (e: CustomEvent) => {
            const { type, content } = e.detail;
            if (!content) return;

            const newItem: CanvasItem = {
                id: Date.now().toString(),
                type: type || 'text',
                content: content,
                x: 100 + (Math.random() * 50),
                y: 100 + (Math.random() * 50), // Random offset to stack
                fontSize: 14,
                width: type === 'image' ? 200 : undefined
            };

            const currentItems = itemsRef.current || [];
            const updated = [...currentItems, newItem];
            setItems(updated);
            saveHistory(updated);
        };

        window.addEventListener('protube-canvas-add-item' as any, handleExternalAdd as any);
        return () => {
            window.removeEventListener('protube-canvas-add-item' as any, handleExternalAdd as any);
        };
    }, []);

    const handleInputSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeInput || !inputValue.trim()) {
            setActiveInput(null);
            return;
        }

        const newItem: CanvasItem = {
            id: Date.now().toString(),
            type: activeInput.type,
            content: inputValue,
            x: Math.random() * 100 + 100,
            y: Math.random() * 100 + 100,
            fontSize: activeInput.type === 'text' ? (parseInt(fontSize) || 14) : undefined,
            width: activeInput.type === 'image' ? 200 : undefined
        };

        const newItems = [...items, newItem];
        setItems(newItems);
        saveHistory(newItems);
        setActiveInput(null);
        setInputValue("");
    };

    const deleteItem = (id: string) => {
        const newItems = items.filter(i => i.id !== id);
        setItems(newItems);
        saveHistory(newItems);
    };

    const handleExport = async () => {
        if (!containerRef.current) return;
        try {
            // Wait a moment for any renders to settle
            await new Promise(resolve => setTimeout(resolve, 100));

            const dataUrl = await toPng(containerRef.current, {
                backgroundColor: '#f8fafc',
                cacheBust: true,
                includeQueryParams: true, // Helps with some CDNs
                // Attempt to handle CORS images
                fetchRequestInit: {
                    mode: 'cors',
                    cache: 'no-cache',
                },
                skipAutoScale: true,
                pixelRatio: 2, // Better quality
                filter: (node) => !node.classList?.contains('no-export')
            });

            const link = document.createElement('a');
            link.download = `canvas-note-${Date.now()}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error("Export failed", err);

            // Fallback: If it's a security/tainted canvas error, we might need to alert the user
            if (err instanceof Error && err.message.includes('tainted')) {
                alert("Failed to export: Some images on the canvas are protected (CORS). Try using local images or screenshots.");
            } else {
                alert("Failed to export image. Please try again.");
            }
        }
    };

    // --- Drag & Drop (Internal Items) ---

    const handleMouseDown = (e: React.MouseEvent, item: CanvasItem) => {
        if (isDrawingMode) return; // Don't drag if drawing
        e.stopPropagation();
        setDraggingId(item.id);
        setSelectedItemId(item.id);
        setDragOffset({
            x: e.clientX - item.x,
            y: e.clientY - item.y
        });
    };

    const handleResizeStart = (e: React.MouseEvent, item: CanvasItem) => {
        e.stopPropagation();
        setResizingId(item.id);
        setResizeStart({
            x: e.clientX,
            y: e.clientY,
            width: item.width || (item.type === 'text' ? 200 : 200), // Default widths if undefined
            height: item.height || 0, // Height often auto, but we can track for images
            initialFontSize: item.fontSize || 14
        });
    };

    const handleRotateStart = (e: React.MouseEvent, item: CanvasItem) => {
        e.stopPropagation();
        setRotatingId(item.id);

        // Calculate center of item approx (width/2, height/2)
        // Since we don't track height perfectly for text, we estimate or use offsetWidth if we had refs
        // We will assume 100x50 for center rough calc or just use the item's x,y as top-left
        // Ideally we need the center.
        // Let's use the event clientX/Y and the item's current known width/height or better, get the bounding rect of the target's parent
        const target = (e.target as HTMLElement).parentElement;
        const rect = target?.getBoundingClientRect();

        if (rect) {
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);

            setRotateStart({
                x: e.clientX,
                y: e.clientY,
                angle: item.rotation || 0,
                centerX,
                centerY
            });
        }
    };

    const handleContainerMouseDown = (e: React.MouseEvent) => {
        if (!isDrawingMode || !containerRef.current) return;
        e.preventDefault(); // Optional, might block other default behaviors but good for canvas

        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setCurrentPath([{ x, y }]);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDrawingMode && currentPath.length > 0 && containerRef.current) {
            e.preventDefault();
            const rect = containerRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            setCurrentPath(prev => [...prev, { x, y }]);
            return;
        }

        if (draggingId) {
            setItems((prev: CanvasItem[]) => prev.map(item => {
                if (item.id === draggingId) {
                    return {
                        ...item,
                        x: e.clientX - dragOffset.x,
                        y: e.clientY - dragOffset.y
                    };
                }
                return item;
            }));
        } else if (resizingId) {
            setItems((prev: CanvasItem[]) => prev.map(item => {
                if (item.id === resizingId) {
                    const deltaX = e.clientX - resizeStart.x;

                    if (item.type === 'text') {
                        // Scale font size based on horizontal drag distance directly
                        const sensitivity = 0.5; // Pixel drag per font-pixel change
                        let newFontSize = resizeStart.initialFontSize + (deltaX * sensitivity);
                        newFontSize = Math.max(8, newFontSize); // Min size

                        return {
                            ...item,
                            fontSize: newFontSize
                            // Do not update width for text, let it be auto
                        };
                    } else {
                        // Images: standard width resize
                        const newWidth = Math.max(50, resizeStart.width + deltaX);
                        return {
                            ...item,
                            width: newWidth
                        };
                    }
                }
                return item;
            }));
        } else if (rotatingId) {
            setItems((prev: CanvasItem[]) => prev.map(item => {
                if (item.id === rotatingId) {
                    // Calculate new angle
                    // We need the initial mouse angle stored in state.
                    // Let's use rotateStart.x/y to calculate initialMouseAngle (oops I already did atan2 logic in start, let's store it)

                    const initialMouseAngle = Math.atan2(rotateStart.y - rotateStart.centerY, rotateStart.x - rotateStart.centerX) * (180 / Math.PI);
                    const currentMouseAngle = Math.atan2(e.clientY - rotateStart.centerY, e.clientX - rotateStart.centerX) * (180 / Math.PI);

                    const delta = currentMouseAngle - initialMouseAngle;

                    return {
                        ...item,
                        rotation: (rotateStart.angle + delta)
                    };
                }
                return item;
            }));
        }
    };

    const handleMouseUp = () => {
        let hasChanges = false;
        let newItems = [...items];

        if (isDrawingMode && currentPath.length > 5) { // Ignore single clicks / dots (< 2 points)
            // Finalize drawing
            const newItem: CanvasItem = {
                id: Date.now().toString(),
                type: 'path',
                content: 'drawing',
                x: 0,
                y: 0,
                points: currentPath,
                color: drawingColor,
                width: 0, // Path width/height computed from bounding box if needed, or ignored
                height: 0
            };
            newItems = [...items, newItem];
            setItems(newItems);
            hasChanges = true;
        }

        setCurrentPath([]); // Always clear path

        if (!hasChanges && (draggingId || resizingId || rotatingId)) {
            // If we were dragging/resizing/rotating, we assume something changed.
            // In a pro app we diff, but here we can just save.
            hasChanges = true;
        }

        if (hasChanges) {
            saveHistory(newItems);
        }

        setDraggingId(null);
        setResizingId(null);
        setRotatingId(null);
    };



    // --- Drag & Drop (External Files) ---

    const [isDraggingOver, setIsDraggingOver] = useState(false);

    // --- Drag & Drop (External Files & URLs) ---

    const onDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(true);
    };

    const onDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        // Only set false if we are actually leaving the container (not entering a child)
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;

        setIsDraggingOver(false);
    };

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = "copy";
        if (!isDraggingOver) setIsDraggingOver(true);
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(false);

        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // 1. Handle Files (Local Images)
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];

            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    const result = ev.target?.result as string;
                    if (result) {
                        const newItem: CanvasItem = {
                            id: Date.now().toString(),
                            type: 'image',
                            content: result,
                            x: x - 100,
                            y: y - 100,
                            width: 200
                        };
                        setItems(prev => [...prev, newItem]);
                    }
                };
                reader.readAsDataURL(file);
            } else {
                alert('Only image files are supported');
            }
            return;
        }

        // 2. Handle Text/URLs (Dragged from web/other tabs)
        // Try getting URL or Text
        const urlOrText = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain');

        if (urlOrText) {
            // Simple heuristic to check if it's an image URL
            const isImage = /\.(jpeg|jpg|gif|png|webp|bmp|svg)/i.test(urlOrText) || urlOrText.startsWith('http');

            if (isImage) {
                const newItem: CanvasItem = {
                    id: Date.now().toString(),
                    type: 'image',
                    content: urlOrText,
                    x: x - 100,
                    y: y - 100,
                    width: 200
                };
                setItems(prev => [...prev, newItem]);
            } else {
                // Treat as text note
                const newItem: CanvasItem = {
                    id: Date.now().toString(),
                    type: 'text',
                    content: urlOrText,
                    x: x,
                    y: y,
                    fontSize: parseInt(fontSize) || 14
                };
                setItems(prev => [...prev, newItem]);
            }
        }
    };

    return (
        <div
            className={cn(
                "w-full h-full bg-slate-50 relative overflow-hidden select-none transition-colors",
                isDraggingOver ? "bg-blue-50/50 ring-4 ring-inset ring-blue-400/30" : ""
            )}
            ref={containerRef}
            onMouseDown={handleContainerMouseDown} // For path drawing
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp} // Stop dragging existing items if leaving
            onClick={() => setSelectedItemId(null)}

            // External Drag Events (Dropzone)
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
            onDragOver={onDragOver}
            onDrop={onDrop}
        >
            {/* Toolbar */}
            <div
                className="no-export absolute top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2"
                onMouseDown={(e) => e.stopPropagation()}
            >
                <div className="flex items-center gap-2 p-1.5 bg-white/90 backdrop-blur rounded-full border border-gray-200 shadow-xl text-gray-700">
                    <button onClick={undo} className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-30" disabled={historyStep === 0} title="Undo">
                        <Undo className="w-4 h-4" />
                    </button>
                    <button onClick={redo} className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-30" disabled={historyStep === history.length - 1} title="Redo">
                        <Redo className="w-4 h-4" />
                    </button>

                    <div className="w-px h-4 bg-gray-200" />

                    <button onClick={startAddingText} className="p-2 hover:bg-gray-100 rounded-full transition-colors" title="Add Text">
                        <Type className="w-5 h-5" />
                    </button>

                    <div className="w-px h-4 bg-gray-200" />

                    <button
                        onClick={() => setIsDrawingMode(!isDrawingMode)}
                        className={cn(
                            "p-2 rounded-full transition-colors",
                            isDrawingMode ? "bg-blue-100 text-blue-600" : "hover:bg-gray-100"
                        )}
                        title="Draw (Paintbrush)"
                    >
                        <Paintbrush className="w-5 h-5" />
                    </button>

                    <button onClick={startAddingImage} className="p-2 hover:bg-gray-100 rounded-full transition-colors" title="Add Image URL">
                        <ImageIcon className="w-5 h-5" />
                    </button>
                    <div className="w-px h-4 bg-gray-200" />
                    <button onClick={handleExport} className="p-2 hover:bg-gray-100 rounded-full text-blue-600 hover:text-blue-700 transition-colors" title="Export">
                        <Download className="w-5 h-5" />
                    </button>
                </div>

                {/* Paint Color Palette */}
                {isDrawingMode && (
                    <div className="bg-white/90 backdrop-blur border border-gray-200 shadow-lg rounded-full p-1.5 flex gap-1.5 animate-in slide-in-from-top-2 duration-200">
                        {['#000000', '#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'].map(color => (
                            <button
                                key={color}
                                className={cn(
                                    "w-5 h-5 rounded-full border border-gray-200 transition-transform hover:scale-110",
                                    drawingColor === color ? "ring-2 ring-blue-500 ring-offset-1 scale-110" : ""
                                )}
                                style={{ backgroundColor: color }}
                                onClick={() => setDrawingColor(color)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Instruction / Empty State */}
            {items.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400 pointer-events-none">
                    <p className="text-sm">Drag & drop images here or use the toolbar</p>
                </div>
            )}

            {/* Canvas Items */}
            {/* Canvas Items */}
            {items.map(item => (
                <div
                    key={item.id}
                    className={cn(
                        "absolute group transition-shadow",
                        item.type !== 'path' && "cursor-move hover:ring-2 hover:ring-blue-400/50 rounded-lg",
                        item.type === 'path' && "pointer-events-none", // Paths are static for now
                        selectedItemId === item.id && item.type !== 'path' && "ring-2 ring-blue-500 shadow-md"
                    )}
                    style={{
                        left: item.x,
                        top: item.y,
                        maxWidth: item.type === 'text' ? '300px' : undefined,
                        transform: `rotate(${item.rotation || 0}deg)`,
                        transformOrigin: 'center center',
                        zIndex: item.type === 'path' ? 0 : 10
                    }}
                    onMouseDown={(e) => item.type !== 'path' && handleMouseDown(e, item)}
                    onClick={(e) => e.stopPropagation()}
                >
                    {item.type === 'path' && item.points && (
                        <svg className="overflow-visible" style={{ width: 1, height: 1 }}>
                            <path
                                d={`M ${item.points.map(p => `${p.x} ${p.y}`).join(' L ')}`}
                                stroke={item.color || "black"}
                                strokeWidth="3"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    )}

                    {item.type !== 'path' && (
                        <>
                            {/* Delete Toggle (Visible on Hover) */}
                            <button
                                onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }}
                                className="absolute -top-2 -right-2 bg-red-500 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-sm"
                                title="Delete"
                            >
                                <X className="w-3 h-3" />
                            </button>

                            {/* Rotate Handle */}
                            <div
                                onMouseDown={(e) => handleRotateStart(e, item)}
                                className="absolute -top-4 -left-4 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-sm text-gray-500 hover:text-blue-500"
                                title="Rotate"
                            >
                                <RotateCw className="w-3 h-3" />
                            </div>

                            {item.type === 'text' ? (
                                <div
                                    className={cn(
                                        "px-4 py-2 rounded-lg transition-colors select-none",
                                        item.isBold && "font-bold",
                                        item.isItalic && "italic",
                                        !item.backgroundColor && "hover:bg-gray-100/50 border border-transparent hover:border-gray-200/50" // Subtle hover effect when transparent
                                    )}
                                    style={{
                                        fontSize: `${item.fontSize}px`,
                                        color: item.color || '#000000',
                                        backgroundColor: item.backgroundColor || 'transparent',
                                        lineHeight: 1.2
                                    }}
                                >
                                    {item.content}
                                </div>
                            ) : (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={item.content.startsWith('http')
                                        ? `/api/proxy-image?url=${encodeURIComponent(item.content)}`
                                        : item.content
                                    }
                                    crossOrigin="anonymous"
                                    alt="canvas-item"
                                    className="rounded-lg shadow-sm border border-gray-200 bg-white pointer-events-none"
                                    style={{
                                        width: item.width ? `${item.width}px` : '200px', // Default to 200px or resized width
                                        height: 'auto', // Maintain aspect ratio
                                        maxHeight: '600px',
                                        objectFit: 'contain'
                                    }}
                                />
                            )}

                            {/* Resize Handle */}
                            <div
                                onMouseDown={(e) => handleResizeStart(e, item)}
                                className="absolute -bottom-2 -right-2 w-4 h-4 bg-white border-2 border-blue-400 rounded-full cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:scale-125"
                                title="Resize"
                            />
                        </>
                    )}
                </div>
            ))}

            {/* Active Drawing Layer */}
            {isDrawingMode && currentPath.length > 0 && (
                <svg className="absolute inset-0 pointer-events-none z-50">
                    <path
                        d={`M ${currentPath.map(p => `${p.x} ${p.y}`).join(' L ')}`}
                        stroke={drawingColor}
                        strokeWidth="3"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            )}

            {/* Input Modal */}
            {activeInput && (
                <div className="absolute inset-0 z-50 flex items-start justify-center pt-32 bg-black/5" onClick={() => setActiveInput(null)}>
                    <div
                        className="bg-white p-4 rounded-xl shadow-2xl border border-gray-200 w-80 animate-in fade-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <form onSubmit={handleInputSubmit} className="flex flex-col gap-3">
                            <h3 className="text-sm font-semibold text-gray-700">
                                {activeInput.type === 'text' ? 'Add Note' : 'Add Image URL'}
                            </h3>
                            <input
                                autoFocus
                                type="text"
                                placeholder={activeInput.type === 'text' ? "Type something..." : "https://..."}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-black placeholder:text-gray-400"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                            />
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setActiveInput(null)}
                                    className="px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 rounded-md"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
                                >
                                    Add
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Properties Panel (Right Sidebar) */}
            {selectedItemId && items.find(i => i.id === selectedItemId)?.type === 'text' && (
                <div
                    className="absolute top-0 right-0 w-28 h-full bg-white border-l border-gray-200 shadow-xl p-3 z-40 flex flex-col gap-4 animate-in slide-in-from-right duration-300"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                        <span className="text-xs font-bold text-gray-800">Props</span>
                        <button onClick={() => setSelectedItemId(null)} className="text-gray-400 hover:text-gray-600">
                            <X className="w-3 h-3" />
                        </button>
                    </div>

                    {/* Text Color Picker */}
                    <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Text</span>
                        <div className="grid grid-cols-2 gap-1.5">
                            {['#000000', '#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#FFFFFF', '#6B7280'].map(color => (
                                <button
                                    key={color}
                                    className={cn(
                                        "w-6 h-6 rounded-full border border-gray-200 transition-all hover:scale-110",
                                        items.find(i => i.id === selectedItemId)?.color === color ? "ring-2 ring-blue-500 ring-offset-1" : ""
                                    )}
                                    style={{ backgroundColor: color }}
                                    onClick={() => {
                                        setItems(prev => prev.map(i => i.id === selectedItemId ? { ...i, color } : i));
                                    }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Background Color Picker */}
                    <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Background</span>
                        <div className="grid grid-cols-2 gap-1.5">
                            {/* Transparent Option */}
                            <button
                                className={cn(
                                    "w-6 h-6 rounded-full border border-gray-200 relative overflow-hidden transition-all hover:scale-110",
                                    !items.find(i => i.id === selectedItemId)?.backgroundColor ? "ring-2 ring-blue-500 ring-offset-1" : ""
                                )}
                                onClick={() => {
                                    setItems(prev => prev.map(i => i.id === selectedItemId ? { ...i, backgroundColor: undefined } : i));
                                }}
                            >
                                <div className="absolute inset-0 bg-white" />
                                <div className="absolute inset-0 border-r border-red-500 transform rotate-45 scale-150 origin-center" />
                            </button>

                            {['#FFFFFF', '#FEF3C7', '#DBEAFE', '#D1FAE5', '#FEE2E2', '#E5E7EB'].map(color => (
                                <button
                                    key={color}
                                    className={cn(
                                        "w-6 h-6 rounded-full border border-gray-200 transition-all hover:scale-110",
                                        items.find(i => i.id === selectedItemId)?.backgroundColor === color ? "ring-2 ring-blue-500 ring-offset-1" : ""
                                    )}
                                    style={{ backgroundColor: color }}
                                    onClick={() => {
                                        setItems(prev => prev.map(i => i.id === selectedItemId ? { ...i, backgroundColor: color } : i));
                                    }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Style Toggles */}
                    <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Style</span>
                        <div className="flex flex-col gap-1.5">
                            <button
                                className={cn(
                                    "flex items-center justify-center py-1.5 px-2 rounded border text-xs font-bold transition-all",
                                    items.find(i => i.id === selectedItemId)?.isBold
                                        ? "bg-blue-50 border-blue-500 text-blue-600 shadow-sm"
                                        : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                                )}
                                onClick={() => {
                                    setItems(prev => prev.map(i => i.id === selectedItemId ? { ...i, isBold: !i.isBold } : i));
                                }}
                            >
                                B
                            </button>
                            <button
                                className={cn(
                                    "flex items-center justify-center py-1.5 px-2 rounded border text-xs italic transition-all",
                                    items.find(i => i.id === selectedItemId)?.isItalic
                                        ? "bg-blue-50 border-blue-500 text-blue-600 shadow-sm"
                                        : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                                )}
                                onClick={() => {
                                    setItems(prev => prev.map(i => i.id === selectedItemId ? { ...i, isItalic: !i.isItalic } : i));
                                }}
                            >
                                I
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
