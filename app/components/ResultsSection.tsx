
import { Copy, Check, Clock, FileText, User, Sparkles, DollarSign, HelpCircle, Search, Download, FileJson, Table, Plus, X, Trash2, Bot, Loader2, PanelRightOpen, PanelRightClose, PlusCircle, ArrowDownToLine, MoreHorizontal, Maximize2, Edit2, PenLine, Save, FileAudio, ChevronUp, ChevronDown, GraduationCap, BookOpen, Bookmark, BrainCircuit, RefreshCw, Share2, Activity, Puzzle, MessageSquare, Shield, ShieldCheck } from "lucide-react";
import NotesPanel from "./NotesPanel";
import ChatPanel from "./ChatPanel";
import { downloadFile, generateShowNotes, getYouTubeId, cleanEntityText } from "../lib/utils";
import { cn } from "../lib/utils";
import type { ProcessedItem, TableItem, BookmarkItem } from "../page"; // Import types
import SourceTab from "./tabs/SourceTab";
import ChaptersTab from "./tabs/ChaptersTab";
import FlashcardsTab from "./tabs/FlashcardsTab";
import EntitiesTab from "./tabs/EntitiesTab";
import TranscriptTab from "./tabs/TranscriptTab";
import SummaryTab from "./tabs/SummaryTab";
import MindMapTab from "./tabs/MindMapTab";
import SentimentTab from "./tabs/SentimentTab";
import QuizTab from "./tabs/QuizTab";
import CourseTab, { CourseData } from "./tabs/CourseTab";
import { useState, useEffect, useMemo } from "react";

interface Chapter {
    timestamp: string;
    title: string;
    summary: string;
}

interface Highlight {
    text: string;
    sentiment: "positive" | "negative" | "neutral";
}

interface SponsorSegment {
    brand?: string;
    text: string;
}

interface QAPair {
    question: string;
    answer: string;
}

interface ResultsSectionProps {
    videoUrl: string; // URL for the player
    thumbnail: string;
    title: string;
    chapters: Chapter[];
    transcript: string;
    entities: any[];
    highlights: Highlight[];
    sponsors: SponsorSegment[];
    qa: QAPair[];
    debugData?: any;
    words?: any[];
    languageCode?: string;
    languageProbability?: number;
    onSeek?: (time: number) => void;
    openAIKey: string;
    elevenLabsKey: string;
    showResultsPanel: boolean;
    setShowResultsPanel: (show: boolean) => void;
    activeRightPanel: "table" | "notes" | "chat" | null;
    setActiveRightPanel: (panel: "table" | "notes" | "chat" | null) => void;
    notesContent: string;
    setNotesContent: (content: string) => void;
    canvasItems: any[];
    setCanvasItems: any;

    // Global Table Props
    tableColumns: string[];
    setTableColumns: (cols: string[]) => void;
    tableItems: TableItem[];
    setTableItems: (items: TableItem[]) => void;
    allProcessedItems: ProcessedItem[];

    // Bookmarks
    bookmarks: BookmarkItem[];
    onToggleBookmark: (item: BookmarkItem) => void;
    onEducationModeToggle?: (enabled: boolean) => void;
}


export default function ResultsSection({
    videoUrl,
    thumbnail,
    title,
    chapters,
    transcript,
    entities,
    highlights,
    sponsors,
    qa,
    debugData,
    words,
    languageCode,
    languageProbability,
    onSeek,
    openAIKey,
    elevenLabsKey,

    showResultsPanel,
    setShowResultsPanel,
    activeRightPanel,
    setActiveRightPanel,
    notesContent,
    setNotesContent,
    canvasItems,
    setCanvasItems,
    tableColumns: columns, // Alias for local convenience
    setTableColumns: setColumns,
    tableItems,
    setTableItems,
    allProcessedItems,
    bookmarks,
    onToggleBookmark,
    onEducationModeToggle
}: ResultsSectionProps) {
    const [activeTab, setActiveTab] = useState<string>("source");
    const [copied, setCopied] = useState(false);

    const isYoutube = videoUrl?.toLowerCase().includes("youtube") || videoUrl?.includes("youtu.be");
    // Education Mode State
    const [isEducationMode, setIsEducationMode] = useState(false);
    const [isSafeMode, setIsSafeMode] = useState(true);
    const [seekToTime, setSeekToTime] = useState<number | null>(null);
    const [isAddColumnOpen, setIsAddColumnOpen] = useState(false);
    const [newColumnName, setNewColumnName] = useState("");
    const [isRefining, setIsRefining] = useState(false);
    const [isTableExpanded, setIsTableExpanded] = useState(false);
    const [isGeneratingCourse, setIsGeneratingCourse] = useState(false);
    const [courseData, setCourseData] = useState<CourseData | null>(null);

    // Manual Add State
    const [editingColumn, setEditingColumn] = useState<string | null>(null);
    const [tempColumnName, setTempColumnName] = useState("");
    const [editingRowId, setEditingRowId] = useState<string | null>(null);
    const [tempRowData, setTempRowData] = useState<TableItem | null>(null);

    // Add to Table State
    const [previewEntity, setPreviewEntity] = useState<any | null>(null);
    const [targetColumn, setTargetColumn] = useState("");
    const [refinedValue, setRefinedValue] = useState("");
    const [targetRowId, setTargetRowId] = useState("new");

    const toggleBookmark = onToggleBookmark;

    const addToTable = (entity: any) => {
        setPreviewEntity(entity);
        setRefinedValue(entity.text);

        // Guess column
        const typeNorm = entity.entity_type.toLowerCase().replace(/_/g, ' ');
        // If columns is undefined or empty handle it
        if (columns && columns.length > 0) {
            const match = columns.find(c => typeNorm.includes(c.toLowerCase()) || c.toLowerCase().includes(typeNorm));
            if (match) setTargetColumn(match);
            else setTargetColumn(columns[0]);
        }

        setActiveRightPanel("table");
    };

    const handleSeek = (time: number) => {
        setSeekToTime(time);
    };

    const handleSummarySeek = (time: number) => {
        setSeekToTime(time);
        setActiveTab("source");
    };

    const handleGenerateCourse = async () => {
        setIsGeneratingCourse(true);
        try {
            const response = await fetch('/api/generate-course', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transcript, apiKey: openAIKey })
            });

            if (!response.ok) throw new Error('Failed to generate course');

            const data = await response.json();
            setCourseData(data);
            setActiveTab("course");
        } catch (error) {
            console.error(error);
            alert("Failed to generate course. Please ensure you have a valid API key.");
        } finally {
            setIsGeneratingCourse(false);
        }
    };

    const handleCopyChapters = () => {
        const text = chapters.map((c) => `${c.timestamp} ${c.title}`).join("\n");
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExport = (type: 'markdown' | 'txt') => {
        const data = { chapters, highlights, sponsors, qa };
        if (type === 'markdown') {
            const content = generateShowNotes(title, data);
            downloadFile(content, `${title.slice(0, 20)}_shownotes.md`, 'text/markdown');
        } else {
            downloadFile(transcript, `${title.slice(0, 20)}_transcript.txt`, 'text/plain');
        }
    };

    const handleExportCSV = () => {
        if (columns.length === 0 || tableItems.length === 0) return;

        const headers = ["Timestamp", ...columns].join(",");
        const rows = tableItems.map(item => {
            const values = columns.map(col => {
                const val = item[col] || "";
                return `"${val.replace(/"/g, '""')}"`; // Escape quotes
            });
            return [`"${item.timestamp}"`, ...values].join(",");
        });

        const csvContent = [headers, ...rows].join("\n");
        downloadFile(csvContent, `${title.slice(0, 20)}_data.csv`, 'text/csv');
    };

    const parseTimestampToSeconds = (timestamp: string): number => {
        const parts = timestamp.split(":").map(Number);
        if (parts.length === 3) {
            return parts[0] * 3600 + parts[1] * 60 + parts[2];
        }
        if (parts.length === 2) {
            return parts[0] * 60 + parts[1];
        }
        return 0;
    };

    const handleChapterClick = (timestamp: string) => {
        const seconds = parseTimestampToSeconds(timestamp);
        setSeekToTime(seconds);
        // If we want to auto-switch to player:
        // setActiveTab("audio");
    };





    // Refinement Logic
    useEffect(() => {
        if (previewEntity) {
            setTargetColumn(columns.length > 0 ? columns[0] : "");
            setTargetRowId("new");

            if (openAIKey) {
                const type = previewEntity.entity_type.replace(/_/g, ' ');
                setIsRefining(true);

                fetch("/api/refine", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        text: previewEntity.text,
                        type: type,
                        apiKey: openAIKey
                    })
                })
                    .then(res => res.json())
                    .then(data => {
                        setRefinedValue(data.value || previewEntity.text);
                    })
                    .catch(err => {
                        console.error(err);
                        setRefinedValue(cleanEntityText(previewEntity.text));
                    })
                    .finally(() => setIsRefining(false));
            } else {
                setRefinedValue(cleanEntityText(previewEntity.text));
            }
        }
    }, [previewEntity, openAIKey, columns]);


    const handleAddColumn = (name?: string) => {
        const colName = name || newColumnName;
        if (!colName.trim()) return;
        if (!columns.includes(colName.trim())) {
            setColumns([...columns, colName.trim()]);
        }
        setNewColumnName("");
        setIsAddColumnOpen(false);
    };

    // Column Renaming Logic
    const startRenaming = (col: string) => {
        setEditingColumn(col);
        setTempColumnName(col);
    };

    const saveColumnRename = (oldName: string) => {
        if (!tempColumnName.trim() || tempColumnName === oldName) {
            setEditingColumn(null);
            return;
        }

        // Update columns list
        const newCols = columns.map(c => c === oldName ? tempColumnName : c);
        setColumns(newCols);

        // Update data in all rows
        const newItems = tableItems.map(item => {
            const val = item[oldName];
            const newItem = { ...item };
            delete newItem[oldName];
            newItem[tempColumnName] = val; // Rename key
            return newItem;
        });
        setTableItems(newItems);
        setEditingColumn(null);
    };

    // Row Editing Logic
    const startRowEditing = (item: TableItem) => {
        setEditingRowId(item.id);
        setTempRowData({ ...item });
    };

    const saveRowEditing = () => {
        if (tempRowData) {
            setTableItems(tableItems.map(item => item.id === tempRowData.id ? tempRowData : item));
        }
        setEditingRowId(null);
        setTempRowData(null);
    };

    const cancelRowEditing = () => {
        setEditingRowId(null);
        setTempRowData(null);
    };

    const updateTempRowData = (col: string, val: string) => {
        if (tempRowData) {
            setTempRowData({ ...tempRowData, [col]: val });
        }
    };

    // Global Auto Import Logic
    const SENSITIVE_TYPES_IMPORT = [
        "credit_card", "credit_card_number", "card_number",
        "dob", "date_of_birth", "birth_date",
        "phone_number", "phone",
        "ssn", "social_security_number",
        "passport_number", "passport",
        "email", "email_address",
        "address", "location_address"
    ];

    const handleAutoImport = () => {
        if (columns.length === 0) return;

        // Helper: Normalize text (words to digits, dash to hyphen)
        const normalizeText = (text: string) => {
            let str = text;

            // 1. Convert "dash" to "-"
            str = str.replace(/\bdash\b/gi, "-");
            str = str.replace(/\s*-\s*/g, "-"); // Collapse spaces around hyphens

            // 2. Convert number words to digits
            const numMap: { [key: string]: string } = {
                'zero': '0', 'one': '1', 'two': '2', 'three': '3', 'four': '4',
                'five': '5', 'six': '6', 'seven': '7', 'eight': '8', 'nine': '9'
            };
            Object.keys(numMap).forEach(key => {
                const regex = new RegExp(`\\b${key}\\b`, 'gi');
                str = str.replace(regex, numMap[key]);
            });

            return str.trim();
        };

        let newItems: TableItem[] = [...tableItems];
        const norm = (s: string) => s.toLowerCase().replace(/_/g, ' ').replace(/\s+/g, '').trim();

        // Alias Map
        const aliases: { [key: string]: string[] } = {
            'dob': ['date of birth', 'birth date'],
            'date': ['date of birth', 'dob'],
            'card': ['credit card', 'card number'],
            'name': ['person', 'full name']
        };

        // Iterate ALL processed files
        allProcessedItems.forEach(file => {
            if (file.status !== "completed" || !file.data) return;

            // Enforce 1 Row Per File -> Initialize the row if it doesn't exist.
            // We use a fixed ID suffixed with _main to identify the primary row for this file.
            const rowId = `${file.id}_main`;

            // Allow updating existing row if it's already in the table (e.g. from previous import)
            let fileRow: TableItem = newItems.find(i => i.sourceId === file.id) || {
                id: rowId,
                sourceId: file.id,
                timestamp: "00:00" // Default timestamp
            };

            columns.forEach(col => {
                const colNorm = norm(col);
                const colAliases = aliases[col.toLowerCase()] || [];

                // 1. Gather all raw matching entities
                const matchingEntities = file.data!.entities.filter(e => {
                    const typeNorm = norm(e.entity_type);
                    return typeNorm.includes(colNorm) ||
                        colNorm.includes(typeNorm) ||
                        colAliases.some(alias => typeNorm.includes(norm(alias)));
                });

                // 2. Clean, Dedup, and Filter Substrings
                let uniqueValues: { text: string, timestamp: string }[] = [];

                // Map to cleaned values first
                // Map to cleaned and normalized values first
                const tempValues = matchingEntities.map(e => {
                    const isSensitive = SENSITIVE_TYPES_IMPORT.includes(e.entity_type?.toLowerCase());
                    const shouldRedact = isSafeMode && isSensitive;
                    return {
                        original: e.text,
                        cleaned: shouldRedact ? "********" : normalizeText(cleanEntityText(e.text)),
                        timestamp: e.formattedTimestamp
                    };
                });

                // Deduplicate by cleaned text (keep first occurrence)
                const seen = new Set();
                tempValues.forEach(v => {
                    if (!seen.has(v.cleaned)) {
                        seen.add(v.cleaned);
                        uniqueValues.push({ text: v.cleaned, timestamp: v.timestamp });
                    }
                });

                // Remove substrings (e.g. remove "Randall" if "Randall Thomas" exists)
                // Filter V if V is a substring of any Other V (CASE INSENSITIVE)
                uniqueValues = uniqueValues.filter((v, i, all) => {
                    const isSubstring = all.some(other =>
                        other.text !== v.text && other.text.toLowerCase().includes(v.text.toLowerCase())
                    );
                    // Keep if NOT a substring of someone else
                    return !isSubstring;
                });


                // 3. Assign to the single file row (comma separated)
                if (uniqueValues.length > 0) {
                    fileRow[col] = uniqueValues.map(v => v.text).join(", ");
                }
            });

            // Update or Push
            const existingIndex = newItems.findIndex(i => i.id === fileRow.id);
            if (existingIndex !== -1) {
                newItems[existingIndex] = fileRow;
            } else {
                newItems.push(fileRow);
            }
        });

        setTableItems(newItems);
    };

    const handleManualAdd = () => {
        if (!previewEntity || !targetColumn) return;

        let items = [...tableItems];
        let rowIndex = -1;

        if (targetRowId === "new") {
            const newItem: TableItem = {
                id: Date.now().toString(),
                timestamp: previewEntity.formattedTimestamp
            };
            items.push(newItem);
            rowIndex = items.length - 1;
        } else {
            rowIndex = items.findIndex(i => i.id === targetRowId);
        }

        if (rowIndex !== -1) {
            items[rowIndex] = { ...items[rowIndex], [targetColumn]: refinedValue };
            setTableItems(items);
        }

        setActiveRightPanel("table");
        setPreviewEntity(null);
        setRefinedValue("");
    };

    const removeFromTable = (id: string) => {
        setTableItems(tableItems.filter(item => item.id !== id));
    };

    const removeColumn = (col: string) => {
        setColumns(columns.filter(c => c !== col));
    };



    // Smart Column Suggestions
    const suggestedColumns = useMemo(() => {
        if (!entities.length) return [];
        const types = new Set(entities.map(e => e.entity_type));
        const suggestions: string[] = [];

        types.forEach(t => {
            const formatted = t.replace(/_/g, ' ').split(' ').map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
            if (!columns.includes(formatted)) {
                suggestions.push(formatted);
            }
        });

        return suggestions.slice(0, 5); // Limit to 5 suggestions
    }, [entities, columns]);

    const tabs = [
        { id: "source", label: "Source", icon: FileAudio },
        ...(isEducationMode ? [
            { id: "chapters", label: "Chapters", icon: Clock },
            { id: "flashcards", label: "Flashcards", icon: BrainCircuit },
            { id: "mindmap", label: "Mindmap", icon: Share2 },
            { id: "course", label: "Course", icon: BookOpen },
            { id: "quiz", label: "Quiz", icon: Puzzle }
        ] : []),
        { id: "transcript", label: "Transcript", icon: FileText },
        { id: "entities", label: "Entities", icon: User },
        { id: "summary", label: "Summary", icon: Sparkles },
        { id: "sentiment", label: "Sentiment", icon: Activity },
    ];

    // Effect: Switch away from "chapters" if Education Mode is disabled while active
    useEffect(() => {
        if ((activeTab === "chapters" || activeTab === "flashcards") && !isEducationMode) {
            setActiveTab("source");
        }
    }, [isEducationMode, activeTab]);

    // Shared Table Render (for both Panel and Modal)
    const renderTable = () => (
        <div className="w-full">
            {columns.length === 0 ? (
                <div className="text-center py-20 text-gray-500 border-2 border-dashed border-white/5 m-4 rounded-xl">
                    <Table className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">No columns defined.</p>
                    <p className="text-xs text-gray-600 mt-1">Click &quot;Add Column&quot; to start building your table.</p>
                </div>
            ) : (
                <table className="w-full text-left text-sm text-gray-400 border-collapse">
                    <thead className="bg-white/5 text-gray-200 font-medium whitespace-nowrap sticky top-0 z-10 transition-colors">
                        <tr>
                            <th className="p-3 border-b border-white/10 w-10">#</th>
                            {columns.map(col => (
                                <th key={col} className="p-3 border-b border-white/10 group relative min-w-[150px]">
                                    {editingColumn === col ? (
                                        <div className="flex gap-1">
                                            <input
                                                value={tempColumnName}
                                                onChange={e => setTempColumnName(e.target.value)}
                                                autoFocus
                                                className="bg-black border border-blue-500 rounded px-1 py-0.5 text-xs text-white w-full"
                                                onKeyDown={e => e.key === 'Enter' && saveColumnRename(col)}
                                            />
                                            <button onClick={() => saveColumnRename(col)}><Check className="w-3 h-3 text-green-400" /></button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between">
                                            <span>{col}</span>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => startRenaming(col)}
                                                    className="p-1 hover:text-blue-400"
                                                    title="Rename"
                                                >
                                                    <Edit2 className="w-3 h-3" />
                                                </button>
                                                <button
                                                    onClick={() => removeColumn(col)}
                                                    className="p-1 hover:text-red-400"
                                                    title="Remove"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </th>
                            ))}
                            <th className="p-3 border-b border-white/10 w-24">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {tableItems.map((item, idx) => {
                            const isEditing = editingRowId === item.id;
                            return (
                                <tr key={item.id} className={cn("transition-colors", isEditing ? "bg-white/5" : "hover:bg-white/5")}>
                                    <td className="p-3 font-mono text-xs opacity-50">{idx + 1}</td>
                                    {columns.map(col => (
                                        <td key={col} className="p-3 text-white border-r border-white/5 last:border-0 relative">
                                            {isEditing ? (
                                                <input
                                                    value={tempRowData?.[col] || ""}
                                                    onChange={e => updateTempRowData(col, e.target.value)}
                                                    className="w-full bg-black/50 border border-blue-500/50 rounded px-2 py-1 text-sm text-white focus:border-blue-500 outline-none"
                                                />
                                            ) : (
                                                <span className="block truncate">{item[col] || <span className="opacity-10">-</span>}</span>
                                            )}
                                        </td>
                                    ))}
                                    <td className="p-3 text-right whitespace-nowrap">
                                        {isEditing ? (
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={saveRowEditing}
                                                    className="text-green-400 hover:text-green-300 p-1 bg-green-900/20 rounded"
                                                    title="Save"
                                                >
                                                    <Check className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={cancelRowEditing}
                                                    className="text-gray-400 hover:text-gray-300 p-1 bg-white/5 rounded"
                                                    title="Cancel"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => startRowEditing(item)}
                                                    className="text-gray-400 hover:text-blue-400 transition-colors p-1"
                                                    title="Edit Row"
                                                >
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => removeFromTable(item.id)}
                                                    className="text-gray-600 hover:text-red-400 transition-colors p-1"
                                                    title="Delete Row"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            )}
        </div>
    );

    return (
        <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            {/* Header / Actions */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-2">
                <h3 className="text-xl font-semibold text-white">Results</h3>
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            const newState = !isEducationMode;
                            setIsEducationMode(newState);
                            if (onEducationModeToggle) onEducationModeToggle(newState);
                        }}
                        className={cn(
                            "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
                            isEducationMode
                                ? "bg-green-600 text-white border-green-500 hover:bg-green-700"
                                : "bg-white/5 text-gray-300 border-white/10 hover:bg-white/10"
                        )}
                        title="Toggle Education Mode"
                    >
                        <GraduationCap className="h-4 w-4" />
                        Education
                    </button>
                    <button
                        onClick={() => setIsSafeMode(!isSafeMode)}
                        className={cn(
                            "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
                            isSafeMode
                                ? "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800"
                                : "bg-white/5 text-gray-300 border-white/10 hover:bg-white/10"
                        )}
                        title="Toggle Safe Mode (Hides PII)"
                    >
                        {isSafeMode ? <ShieldCheck className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                        Safe Mode
                    </button>
                    <button
                        onClick={() => {
                            if (showResultsPanel && !activeRightPanel) return;
                            setShowResultsPanel(!showResultsPanel);
                        }}
                        className={cn(
                            "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
                            showResultsPanel
                                ? "bg-white text-black border-white hover:bg-white/90"
                                : "bg-white/5 text-gray-300 border-white/10 hover:bg-white/10",
                            (showResultsPanel && !activeRightPanel) && "opacity-50 cursor-not-allowed"
                        )}
                        title={showResultsPanel && !activeRightPanel ? "Cannot hide last panel" : "Toggle Results View"}
                    >
                        {showResultsPanel ? <PanelRightClose className="h-4 w-4 rotate-180" /> : <PanelRightOpen className="h-4 w-4 rotate-180" />}
                        {showResultsPanel ? "Hide Results" : "Show Results"}
                    </button>
                    <button
                        onClick={() => {
                            if (activeRightPanel === "table" && !showResultsPanel) return;
                            setActiveRightPanel(activeRightPanel === "table" ? null : "table");
                        }}
                        className={cn(
                            "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
                            activeRightPanel === "table"
                                ? "bg-white text-black border-white hover:bg-white/90"
                                : "bg-white/5 text-gray-300 border-white/10 hover:bg-white/10",
                            (activeRightPanel === "table" && !showResultsPanel) && "opacity-50 cursor-not-allowed"
                        )}
                        title={activeRightPanel === "table" && !showResultsPanel ? "Cannot hide last panel" : "Toggle Data Table"}
                    >
                        {activeRightPanel === "table" ? <PanelRightClose className="h-4 w-4" /> : <Table className="h-4 w-4" />}
                        {activeRightPanel === "table" ? "Hide Table" : "Show Table"}
                    </button>
                    <button
                        onClick={() => {
                            if (activeRightPanel === "chat" && !showResultsPanel) return;
                            setActiveRightPanel(activeRightPanel === "chat" ? null : "chat");
                        }}
                        className={cn(
                            "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
                            activeRightPanel === "chat"
                                ? "bg-white text-black border-white hover:bg-white/90"
                                : "bg-white/5 text-gray-300 border-white/10 hover:bg-white/10",
                            (activeRightPanel === "chat" && !showResultsPanel) && "opacity-50 cursor-not-allowed"
                        )}
                        title={activeRightPanel === "chat" && !showResultsPanel ? "Cannot hide last panel" : "Toggle Chat"}
                    >
                        {activeRightPanel === "chat" ? <PanelRightClose className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
                        {activeRightPanel === "chat" ? "Hide Chat" : "AI Chat"}
                    </button>
                    <button
                        onClick={() => {
                            if (activeRightPanel === "notes" && !showResultsPanel) return;
                            setActiveRightPanel(activeRightPanel === "notes" ? null : "notes");
                        }}
                        className={cn(
                            "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
                            activeRightPanel === "notes"
                                ? "bg-white text-black border-white hover:bg-white/90"
                                : "bg-white/5 text-gray-300 border-white/10 hover:bg-white/10",
                            (activeRightPanel === "notes" && !showResultsPanel) && "opacity-50 cursor-not-allowed"
                        )}
                        title={activeRightPanel === "notes" && !showResultsPanel ? "Cannot hide last panel" : "Toggle Notes"}
                    >
                        {activeRightPanel === "notes" ? <PanelRightClose className="h-4 w-4" /> : <PenLine className="h-4 w-4" />}
                        {activeRightPanel === "notes" ? "Hide Notes" : "Show Notes"}
                    </button>

                </div>
            </div>

            {/* Split View Container */}
            <div className="flex gap-6 items-start transition-all duration-500">

                {/* Left Panel */}
                {showResultsPanel && (
                    <div className={cn(
                        "rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-white/10 dark:bg-white/5 transition-all duration-500 flex flex-col sticky top-24 h-[calc(100vh-200px)] overflow-hidden",
                        activeRightPanel ? "w-1/2" : "w-full"
                    )}>
                        <div className="border-b border-gray-200 px-2 dark:border-white/10 overflow-x-auto">
                            <div className="flex gap-2 p-2">
                                {tabs.map((tab) => {
                                    const Icon = tab.icon;
                                    const isEducationTab = ["chapters", "flashcards", "mindmap", "course", "quiz"].includes(tab.id);

                                    let activeClass = "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400";
                                    let hoverClass = "hover:text-gray-900 dark:hover:text-gray-200";

                                    if (isEducationTab) {
                                        activeClass = "bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400";
                                        hoverClass = "hover:text-green-600 dark:hover:text-green-300";
                                    }

                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${activeTab === tab.id
                                                ? activeClass
                                                : `text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/5 ${hoverClass}`
                                                }`}
                                        >
                                            <Icon className={cn("h-4 w-4", !activeTab && isEducationTab && "text-green-500/70")} />
                                            <span>{tab.label}</span>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 relative">
                            {/* Persistent Source Player (Hidden when not active, but mounted) */}
                            <div className={cn("w-full h-full", activeTab === "source" ? "block" : "hidden")}>
                                <SourceTab
                                    videoUrl={videoUrl}
                                    isYoutube={isYoutube}
                                    seekToTime={seekToTime}
                                    languageCode={languageCode}
                                    languageProbability={languageProbability}
                                />
                            </div>

                            {/* Persistent Summary */}
                            <div className={cn("w-full h-full", activeTab === "summary" ? "block" : "hidden")}>
                                <SummaryTab
                                    transcript={transcript}
                                    apiKey={openAIKey}
                                    onSeek={handleSummarySeek}
                                />
                            </div>
                            {/* Persistent Transcript */}
                            <div className={cn("w-full h-full", activeTab === "transcript" ? "block" : "hidden")}>
                                <TranscriptTab
                                    transcript={transcript}
                                    words={words}
                                    onSeek={handleSeek}
                                    apiKey={openAIKey}
                                    bookmarks={bookmarks}
                                    onToggleBookmark={toggleBookmark}
                                    isSafeMode={isSafeMode}
                                    onToggleSafeMode={() => setIsSafeMode(!isSafeMode)}
                                    entities={entities}
                                />
                            </div>
                            {/* Persistent Entities */}
                            <div className={cn("w-full h-full", activeTab === "entities" ? "block" : "hidden")}>
                                <EntitiesTab
                                    entities={entities}
                                    isEducationMode={isEducationMode}
                                    showTablePanel={activeRightPanel === "table"}
                                    onSeek={handleSeek}
                                    onAddToTable={addToTable}
                                    transcript={transcript}
                                    apiKey={openAIKey}
                                    bookmarks={bookmarks}
                                    onToggleBookmark={toggleBookmark}
                                    isSafeMode={isSafeMode}
                                />
                            </div>
                            {/* Persistent Flashcards */}
                            <div className={cn("w-full h-full", activeTab === "flashcards" ? "block" : "hidden")}>
                                <FlashcardsTab
                                    transcript={transcript}
                                    apiKey={openAIKey}
                                />
                            </div>
                            {/* Persistent Mind Map */}
                            <div className={cn("w-full h-full", activeTab === "mindmap" ? "block" : "hidden")}>
                                <MindMapTab
                                    entities={entities}
                                    transcript={transcript}
                                    apiKey={openAIKey}
                                />
                            </div>
                            {/* Persistent Sentiment */}
                            <div className={cn("w-full h-full", activeTab === "sentiment" ? "block" : "hidden")}>
                                <SentimentTab
                                    transcript={transcript}
                                    apiKey={openAIKey}
                                    onSeek={onSeek}
                                    onOpenCanvas={() => setActiveRightPanel("notes")}
                                />
                            </div>

                            {/* Persistent Course Tab */}
                            <div className={cn("w-full h-full", activeTab === "course" ? "block" : "hidden")}>
                                <CourseTab
                                    courseData={courseData}
                                    onGenerateCourse={handleGenerateCourse}
                                    isGeneratingCourse={isGeneratingCourse}
                                    apiKey={openAIKey}
                                    elevenLabsKey={elevenLabsKey}
                                />
                            </div>

                            {/* Persistent Quiz */}
                            <div className={cn("w-full h-full", activeTab === "quiz" ? "block" : "hidden")}>
                                <QuizTab
                                    transcript={transcript}
                                    apiKey={openAIKey}
                                />
                            </div>
                            {/* Tab Content */}
                            {activeTab === "chapters" && (
                                <ChaptersTab
                                    chapters={chapters}
                                    onSeek={handleChapterClick}
                                    onCopy={handleCopyChapters}
                                    copied={copied}
                                />
                            )}
                            {/* Highlights, Sponsors, QA, Transcript ... (Same structure) */}
                            {activeTab === "highlights" && (
                                <div className="space-y-4">
                                    {highlights.map((h, i) => (
                                        <div key={i} className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900/50 dark:bg-yellow-900/10">
                                            <div className="flex gap-3">
                                                <Sparkles className="h-5 w-5 shrink-0 text-yellow-600 dark:text-yellow-500" />
                                                <p className="font-medium text-gray-800 dark:text-gray-200">&quot;{h.text}&quot;</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {activeTab === "sponsors" && (
                                <div className="space-y-4">
                                    {sponsors.map((s, i) => (
                                        <div key={i} className="rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-900/50 dark:bg-green-900/10">
                                            <div className="flex gap-3">
                                                <DollarSign className="h-5 w-5 shrink-0 text-green-600 dark:text-green-500" />
                                                <div>
                                                    {s.brand && <p className="font-bold text-green-800 dark:text-green-300 mb-1">{s.brand}</p>}
                                                    <p className="text-sm text-gray-700 dark:text-gray-300">{s.text}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {activeTab === "qa" && (
                                <div className="space-y-4">
                                    {qa.map((item, i) => (
                                        <div key={i} className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/50 dark:bg-blue-900/10">
                                            <div className="flex flex-col gap-2">
                                                <div className="flex gap-2 font-semibold text-blue-900 dark:text-blue-200">
                                                    <span className="shrink-0 rounded bg-blue-200 px-1.5 py-0.5 text-xs text-blue-800 dark:bg-blue-800 dark:text-blue-100">Q</span>
                                                    {item.question}
                                                </div>
                                                <div className="flex gap-2 text-gray-700 dark:text-gray-300 ml-8">
                                                    <span className="shrink-0 rounded bg-gray-200 px-1.5 py-0.5 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-300">A</span>
                                                    {item.answer}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Right Panel: Data Table or Notes */}
                {activeRightPanel && (
                    <div className={cn(
                        "rounded-2xl border border-white/10 bg-zinc-900 shadow-xl overflow-hidden flex flex-col sticky top-24 self-start h-[calc(100vh-200px)] animate-in slide-in-from-right-4 bg-gray-900 transition-all duration-500",
                        showResultsPanel ? "w-1/2" : "w-full"
                    )}>
                        {activeRightPanel === "table" ? (
                            <>
                                <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-white/5 shrink-0">
                                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                        <Table className="w-5 h-5 text-blue-400" />
                                        Data Table
                                    </h2>
                                    <div className="flex gap-2 items-center">
                                        {/* Add Column */}
                                        <div className="relative">
                                            <button
                                                onClick={() => setIsAddColumnOpen(!isAddColumnOpen)}
                                                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                                            >
                                                <PlusCircle className="h-3.5 w-3.5" />
                                                Add Column
                                            </button>
                                            {isAddColumnOpen && (
                                                <div className="absolute top-full right-0 mt-2 p-3 bg-zinc-800 border border-white/10 rounded-xl shadow-xl w-64 z-50">
                                                    <h4 className="text-xs font-medium text-gray-400 mb-2">New Column Name</h4>

                                                    {/* Smart Suggestions */}
                                                    {suggestedColumns.length > 0 && (
                                                        <div className="mb-3 flex flex-wrap gap-1">
                                                            {suggestedColumns.map(sg => (
                                                                <button
                                                                    key={sg}
                                                                    onClick={() => handleAddColumn(sg)}
                                                                    className="text-[10px] bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/30 px-2 py-1 rounded-full transition-colors"
                                                                >
                                                                    + {sg}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}

                                                    <div className="flex gap-2">
                                                        <input
                                                            autoFocus
                                                            value={newColumnName}
                                                            onChange={(e) => setNewColumnName(e.target.value)}
                                                            className="flex-1 bg-zinc-900 border border-white/10 rounded px-2 py-1 text-xs text-white"
                                                            placeholder="Custom Name..."
                                                            onKeyDown={(e) => e.key === 'Enter' && handleAddColumn()}
                                                        />
                                                        <button onClick={() => handleAddColumn()} className="bg-blue-600 text-white px-2 rounded text-xs">OK</button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            onClick={handleAutoImport}
                                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                                        >
                                            <ArrowDownToLine className="h-3.5 w-3.5" />
                                            Auto Import
                                        </button>
                                        <button
                                            onClick={handleExportCSV}
                                            className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors ml-1"
                                            title="Export CSV"
                                        >
                                            <Download className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => setIsTableExpanded(true)}
                                            className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors ml-1"
                                            title="Expand View"
                                        >
                                            <Maximize2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="p-0 overflow-auto flex-1 bg-zinc-950 px-6">
                                    {renderTable()}
                                </div>
                            </>
                        ) : activeRightPanel === "chat" ? (
                            <ChatPanel transcript={transcript} apiKey={openAIKey} />
                        ) : (
                            <NotesPanel content={notesContent} onChange={setNotesContent} canvasItems={canvasItems} setCanvasItems={setCanvasItems} />
                        )}
                    </div>
                )}


                {/* Expanded Table Modal (High Z-Index) */}
                {
                    isTableExpanded && (
                        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in">
                            <div className="w-[95vw] h-[80vh] bg-zinc-900 rounded-2xl border border-white/10 flex flex-col overflow-hidden shadow-2xl relative">
                                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
                                    <div className="flex items-center gap-3">
                                        <Table className="w-5 h-5 text-blue-400" />
                                        <h2 className="text-xl font-semibold text-white">Full Data Table</h2>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={handleExportCSV}
                                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                        >
                                            <Download className="h-4 w-4" />
                                            Export CSV
                                        </button>
                                        <button
                                            onClick={() => setIsTableExpanded(false)}
                                            className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white"
                                        >
                                            <X className="h-6 w-6" />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-auto p-6 bg-zinc-950">
                                    {renderTable()}
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Entity Card Modal (Manual Add) */}
                {
                    previewEntity && (
                        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                            <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl p-6 relative">
                                <button
                                    onClick={() => { setPreviewEntity(null); setRefinedValue(""); }}
                                    className="absolute top-4 right-4 text-gray-500 hover:text-white"
                                >
                                    <X size={20} />
                                </button>

                                <div className="flex items-center gap-2 mb-4">
                                    <Bot className="w-5 h-5 text-green-400" />
                                    <h4 className="text-lg font-semibold text-white">Manual Add</h4>
                                </div>

                                <div className="space-y-4">
                                    <div className="p-3 bg-white/5 rounded-lg border border-white/5 text-sm">
                                        <span className="block text-gray-400 text-xs uppercase mb-1">Source Text</span>
                                        {previewEntity.text}
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-gray-400 uppercase">Refined Value ({openAIKey ? 'AI' : 'Local'})</label>
                                        <div className="text-white font-bold bg-black/40 p-2 rounded border border-white/10">
                                            {isRefining ? <Loader2 className="animate-spin w-4 h-4 text-center" /> : refinedValue}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-gray-400 uppercase">Target Column</label>
                                            <select
                                                value={targetColumn}
                                                onChange={(e) => setTargetColumn(e.target.value)}
                                                className="w-full bg-zinc-800 border border-white/10 rounded p-2 text-sm text-white"
                                            >
                                                <option value="" disabled>Select Column</option>
                                                {columns.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                            {columns.length === 0 && <p className="text-[10px] text-red-400">Create columns in table first</p>}
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-gray-400 uppercase">Target Row</label>
                                            <select
                                                value={targetRowId}
                                                onChange={(e) => setTargetRowId(e.target.value)}
                                                className="w-full bg-zinc-800 border border-white/10 rounded p-2 text-sm text-white"
                                            >
                                                <option value="new">New Row</option>
                                                {tableItems.map((item, idx) => (
                                                    <option key={item.id} value={item.id}>Row {idx + 1}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleManualAdd}
                                        disabled={isRefining || !targetColumn}
                                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-xl transition-colors mt-2"
                                    >
                                        Add to Table
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
            </div>
        </div >
    );
}

