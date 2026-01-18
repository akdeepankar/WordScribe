
"use client";

import { useState, useEffect, useMemo } from "react";
import InputSection from "./components/InputSection";
import ResultsSection from "./components/ResultsSection";

import SettingsDialog from "./components/SettingsDialog";
import KeyTermsDialog from "./components/KeyTermsDialog";
import FileSidebar from "./components/FileSidebar";
import { AlertCircle, X, Sparkles, Youtube, Settings, History, Layers, Plus, Clock, Bookmark, Trash2, ArrowRight } from "lucide-react";
import { useHistory, HistoryItem } from "./hooks/useHistory";
import { cn } from "./lib/utils";


// Types
export interface ProcessedItem {
  id: string;
  url: string;
  title: string;
  thumbnail?: string;
  status: "pending" | "processing" | "completed" | "error";
  error?: string;
  data?: {
    chapters: any[];
    transcript: string;
    entities: any[];
    highlights: any[];
    sponsors: any[];
    qa: any[];
    debugData?: any;
  };
}

export interface TableItem {
  id: string;
  timestamp: string;
  // We add a source ID to track which file this row came from
  sourceId?: string;
  [key: string]: string | undefined;
}

export interface BookmarkItem {
  id: string;
  text: string;
  explanation: string;
  type: string;
  timestamp: string;
  sourceId: string;
  videoTitle: string;
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [keyTerms, setKeyTerms] = useState("");
  const [entityTypes, setEntityTypes] = useState<string[]>(["all"]);
  const [apiKey, setApiKey] = useState("");
  const [openAIKey, setOpenAIKey] = useState("");

  // Batch State
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchUrls, setBatchUrls] = useState("");
  const [processedItems, setProcessedItems] = useState<ProcessedItem[]>([]);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);

  // Global Table State
  const [tableColumns, setTableColumns] = useState<string[]>([]);
  const [tableItems, setTableItems] = useState<TableItem[]>([]);

  // Global Status (Derived)
  const isProcessingAny = processedItems.some(i => i.status === "processing");
  const hasItems = processedItems.length > 0;

  // History
  const { history, addToHistory } = useHistory();
  const [showHistory, setShowHistory] = useState(false);

  // Player State
  // const [seekToTime, setSeekToTime] = useState<number | null>(null);

  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [showKeyTerms, setShowKeyTerms] = useState(false);

  // Right Panel State
  const [activeRightPanel, setActiveRightPanel] = useState<"table" | "notes" | "chat" | null>(null);
  const [showResultsPanel, setShowResultsPanel] = useState(true);

  const [notesContent, setNotesContent] = useState("");
  const [canvasItems, setCanvasItems] = useState<any[]>([]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Bookmarks State
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [showBookmarksPanel, setShowBookmarksPanel] = useState(false);

  // Load bookmarks from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem("protube_bookmarks");
    if (saved) {
      try {
        setBookmarks(JSON.parse(saved));
      } catch (e) { console.error("Failed to load bookmarks", e); }
    }
  }, []);

  // Save bookmarks to local storage on change
  useEffect(() => {
    localStorage.setItem("protube_bookmarks", JSON.stringify(bookmarks));
  }, [bookmarks]);

  const handleToggleBookmark = (item: BookmarkItem) => {
    setBookmarks(prev => {
      const exists = prev.some(b => b.text === item.text && b.sourceId === item.sourceId);
      if (exists) {
        return prev.filter(b => !(b.text === item.text && b.sourceId === item.sourceId));
      } else {
        return [item, ...prev];
      }
    });
  };

  const deleteBookmark = (id: string) => {
    setBookmarks(prev => prev.filter(b => b.id !== id));
  };

  // Test State


  // Active Data (Derived)
  const activeItem = useMemo(() => processedItems.find(i => i.id === activeItemId), [processedItems, activeItemId]);

  const handleOpenAISave = (key: string) => {
    setOpenAIKey(key);
    localStorage.setItem("protube_openai_key", key);
  };



  useEffect(() => {
    const savedKey = localStorage.getItem("protube_api_key");
    if (savedKey) setApiKey(savedKey);
    const savedOpenAI = localStorage.getItem("protube_openai_key");
    if (savedOpenAI) setOpenAIKey(savedOpenAI);
  }, []);

  // Queue Processor
  useEffect(() => {
    const processQueue = async () => {
      const pendingItem = processedItems.find(i => i.status === "pending");
      if (!pendingItem || isProcessingAny) return;

      const currentKey = apiKey || localStorage.getItem("protube_api_key");
      if (!currentKey) {
        setShowSettings(true);
        return;
      }

      // Update status to processing
      setProcessedItems(prev => prev.map(i => i.id === pendingItem.id ? { ...i, status: "processing" } : i));

      // Auto-select if it's the first item or user hasn't selected anything
      if (!activeItemId) setActiveItemId(pendingItem.id);

      try {
        console.log(`Processing ${pendingItem.url}...`);

        // Step 1: Metadata
        const isYouTube = pendingItem.url.match(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/);
        let currentTitle = "Audio File";
        let currentThumbnail = "";

        if (isYouTube) {
          try {
            const metaRes = await fetch("/api/process-youtube", {
              method: "POST",
              body: JSON.stringify({ url: pendingItem.url }),
              headers: { "Content-Type": "application/json" }
            });
            if (metaRes.ok) {
              const metaData = await metaRes.json();
              currentTitle = metaData.title;
              currentThumbnail = metaData.thumbnail;

              // Update Title immediately
              setProcessedItems(prev => prev.map(i => i.id === pendingItem.id ? { ...i, title: currentTitle, thumbnail: currentThumbnail } : i));
            }
          } catch (e) { console.warn("Metadata fetch failed", e); }
        } else {
          currentTitle = pendingItem.url.split('/').pop() || "Audio File";
          setProcessedItems(prev => prev.map(i => i.id === pendingItem.id ? { ...i, title: currentTitle } : i));
        }

        // Step 2: Transcribe
        const transcribeRes = await fetch("/api/transcribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: pendingItem.url,
            keyTerms,
            apiKey: currentKey,
            entityTypes
          }),
        });

        if (!transcribeRes.ok) {
          const err = await transcribeRes.json();
          throw new Error(err.error || "Transcription failed");
        }

        const resultData = await transcribeRes.json();

        // 800ms artificial delay for analysis feel
        await new Promise(r => setTimeout(r, 800));

        const data = {
          chapters: resultData.chapters,
          transcript: resultData.transcript,
          entities: resultData.entities || [],
          highlights: resultData.highlights || [],
          sponsors: resultData.sponsors || [],
          qa: resultData.qa || [],
          debugData: resultData
        };

        // Complete
        setProcessedItems(prev => prev.map(i => i.id === pendingItem.id ? { ...i, status: "completed", data } : i));

        // Save History
        addToHistory({
          url: pendingItem.url,
          title: currentTitle,
          thumbnail: currentThumbnail,
          ...data
        });

      } catch (error: any) {
        console.error(error);
        setProcessedItems(prev => prev.map(i => i.id === pendingItem.id ? { ...i, status: "error", error: error.message } : i));
      }
    };

    processQueue();
  }, [processedItems, apiKey, keyTerms, isProcessingAny, activeItemId, entityTypes, addToHistory]);


  const handleStartBatch = () => {
    const urls = batchUrls.split('\n').filter(u => u.trim());
    if (urls.length === 0) return;

    const newItems: ProcessedItem[] = urls.map(u => ({
      id: Math.random().toString(36).substr(2, 9),
      url: u.trim(),
      title: "Waiting...",
      status: "pending"
    }));

    setProcessedItems(prev => [...prev, ...newItems]);
    setBatchUrls("");
    setShowBatchModal(false);
  };

  const handleSingleGenerate = () => {
    if (!url.trim()) return;
    const newItem: ProcessedItem = {
      id: Math.random().toString(36).substr(2, 9),
      url: url.trim(),
      title: "Waiting...",
      status: "pending"
    };
    setProcessedItems(prev => [...prev, newItem]);
    setUrl("");
  };

  const handleSeek = (time: number) => {
    // setSeekToTime(time);
  };

  const handleHistorySelect = (item: HistoryItem) => {
    // Reconstruct item structure
    const restoredItem: ProcessedItem = {
      id: Math.random().toString(36).substr(2, 9),
      url: item.url,
      title: item.title,
      thumbnail: item.thumbnail,
      status: "completed",
      data: {
        chapters: item.chapters,
        transcript: item.transcript,
        entities: item.entities,
        highlights: item.highlights,
        sponsors: item.sponsors,
        qa: item.qa
      }
    };
    setProcessedItems([restoredItem]);
    setActiveItemId(restoredItem.id);
    setShowHistory(false);
  };

  const handleRemove = (id: string) => {
    setProcessedItems(prev => prev.filter(i => i.id !== id));
    if (activeItemId === id) {
      setActiveItemId(null);
    }
  };

  return (
    <div className="min-h-screen w-full bg-zinc-950 text-white font-sans selection:bg-blue-500/30 overflow-x-hidden">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px]" />
      </div>

      <SettingsDialog
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onSave={(key) => setApiKey(key)}
        openAIKey={openAIKey}
        onSaveOpenAI={handleOpenAISave}
      />

      <KeyTermsDialog
        isOpen={showKeyTerms}
        onClose={() => setShowKeyTerms(false)}
        keyTerms={keyTerms}
        setKeyTerms={setKeyTerms}
        entityTypes={entityTypes}
        setEntityTypes={setEntityTypes}
      />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 flex h-20 items-center justify-between px-6 md:px-12 backdrop-blur-sm transition-all duration-500">
        <div className="flex items-center gap-6 flex-1">
          <div
            onClick={() => { setProcessedItems([]); setActiveItemId(null); setUrl(""); setTableItems([]); setTableColumns([]); }}
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity shrink-0"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/20">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white hidden sm:block">Streamline</span>
          </div>

          {/* Top Bar Input Area (Visible when NOT idle) */}
          {hasItems && (
            <div className="flex-1 max-w-2xl animate-in fade-in slide-in-from-top-4 duration-500 flex items-center gap-2">
              <button
                onClick={() => setIsBatchMode(!isBatchMode)}
                className={cn("p-2 rounded-lg transition-colors border",
                  isBatchMode ? "bg-white text-black border-white" : "text-gray-400 border-white/10 hover:bg-white/10"
                )}
                title="Toggle Batch Mode"
              >
                <Layers size={18} />
              </button>

              {isBatchMode ? (
                <div className="flex-1 flex gap-2">
                  <button
                    onClick={() => setShowKeyTerms(true)}
                    className="h-10 w-10 shrink-0 flex items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
                    title="Entity Types & Config"
                  >
                    <Sparkles className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setShowBatchModal(true)}
                    className="flex-1 text-left px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors flex items-center justify-between group"
                  >
                    <span>Add more URLs to queue...</span>
                    <Plus className="w-5 h-5 opacity-50 group-hover:opacity-100" />
                  </button>
                </div>
              ) : (
                <div className="flex-1">
                  <InputSection
                    url={url}
                    setUrl={setUrl}
                    onGenerate={handleSingleGenerate}
                    isLoading={isProcessingAny}
                    onKeyTermsClick={() => setShowKeyTerms(true)}
                    variant="compact"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <button
            onClick={() => setShowBookmarksPanel(true)}
            className={cn(
              "p-2.5 rounded-full transition-all relative group",
              showBookmarksPanel ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/10"
            )}
            title="Bookmarks"
          >
            <Bookmark size={20} />
            {bookmarks.length > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full ring-2 ring-black" />
            )}
          </button>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={cn(
              "p-2.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-all",
              showHistory && "text-white bg-white/10"
            )}
          >
            <History size={20} />
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="p-2.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <Settings size={20} />
          </button>
        </div>
      </header>

      {/* History Sidebar/Overlay (Existing) */}
      <div className={cn(
        "fixed inset-y-0 right-0 z-50 w-80 bg-zinc-900 border-l border-white/10 p-6 transform transition-transform duration-300 ease-in-out shadow-2xl",
        showHistory ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">History</h3>
          <button onClick={() => setShowHistory(false)} className="text-gray-500 hover:text-white">
            <X size={20} />
          </button>
        </div>
        <div className="space-y-3 overflow-y-auto h-[calc(100vh-100px)]">
          {history.length === 0 && <p className="text-gray-500 text-sm">No recent videos.</p>}
          {history.map((item) => (
            <button
              key={item.id}
              onClick={() => handleHistorySelect(item)}
              className="flex w-full gap-3 rounded-xl p-3 hover:bg-white/5 text-left group transition-all border border-transparent hover:border-white/5"
            >
              <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-gray-800 flex items-center justify-center">
                {item.thumbnail ? (
                  <img src={item.thumbnail} alt="" className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" />
                ) : (
                  <Sparkles className="h-6 w-6 text-gray-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-300 group-hover:text-white truncate transition-colors">{item.title}</h4>
                <p className="text-xs text-gray-500 mt-1">{new Date(item.date).toLocaleDateString()}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Batch Input Modal (Existing) */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-2xl bg-zinc-900 rounded-2xl border border-white/10 p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <Layers className="text-blue-500" />
                Batch Process URLs
              </h3>
              <button onClick={() => setShowBatchModal(false)} className="text-gray-500 hover:text-white"><X /></button>
            </div>
            <p className="text-sm text-gray-400">Paste multiple YouTube or Audio URLs here, one per line.</p>
            <textarea
              value={batchUrls}
              onChange={(e) => setBatchUrls(e.target.value)}
              className="w-full h-48 bg-zinc-950 border border-white/10 rounded-xl p-4 text-sm font-mono focus:border-blue-500 outline-none resize-none"
              placeholder="https://youtube.com/watch?v=...\nhttps://example.com/audio.mp3\n..."
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowBatchModal(false)} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
              <button
                onClick={handleStartBatch}
                disabled={!batchUrls.trim()}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
              >
                Add {batchUrls.split('\n').filter(u => u.trim()).length} URLs to Queue
              </button>
            </div>
          </div>
        </div>
      )}

      <main className={cn(
        "relative z-10 mx-auto pt-24 px-6 pb-10 transition-all duration-500",
        activeRightPanel ? "max-w-[98vw]" : "max-w-7xl"
      )}>

        {/* Hero / Input State (Only visible when NO items) */}
        {!hasItems && (
          <div className={cn(
            "flex flex-col items-center justify-center transition-all duration-700 ease-in-out min-h-[60vh] opacity-100"
          )}>
            <div className="text-center mb-10 space-y-4">
              <h1 className="text-5xl md:text-7xl font-bold tracking-tighter bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent">
                Streamline
              </h1>
              <p className="text-gray-400 text-lg md:text-xl max-w-md mx-auto">
                Advanced YouTube intelligence powered by ElevenLabs Scribe v2.
              </p>
            </div>

            <div className="w-full max-w-xl space-y-4">
              <div className="flex items-center justify-center gap-2 mb-4">
                <button
                  onClick={() => setIsBatchMode(false)}
                  className={cn("px-4 py-1.5 rounded-full text-sm font-medium transition-colors", !isBatchMode ? "bg-white text-black" : "text-gray-400 hover:text-white")}
                >
                  Single URL
                </button>
                <div className="w-px h-4 bg-white/20" />
                <button
                  onClick={() => setIsBatchMode(true)}
                  className={cn("px-4 py-1.5 rounded-full text-sm font-medium transition-colors", isBatchMode ? "bg-white text-black" : "text-gray-400 hover:text-white")}
                >
                  Batch Mode
                </button>
              </div>

              {isBatchMode ? (
                <div className="w-full space-y-4">
                  <button
                    onClick={() => setShowBatchModal(true)}
                    className="w-full h-14 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 rounded-2xl flex items-center justify-center gap-3 text-gray-300 hover:text-white transition-all group"
                  >
                    <Layers className="w-5 h-5 text-blue-500 group-hover:scale-110 transition-transform" />
                    <span className="font-medium">Open Batch Input Modal</span>
                  </button>

                  <button
                    onClick={() => setShowKeyTerms(true)}
                    className="w-full h-12 flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-colors text-sm"
                  >
                    <Sparkles className="h-4 w-4" />
                    Entity Types & Config
                  </button>
                </div>
              ) : (
                <InputSection
                  url={url}
                  setUrl={setUrl}
                  onGenerate={handleSingleGenerate}
                  isLoading={isProcessingAny}
                  onKeyTermsClick={() => setShowKeyTerms(true)}
                  variant="hero"
                />
              )}
            </div>


          </div>
        )}

        {/* Results Area */}
        {hasItems && (
          <div className={cn(
            "flex items-start gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700 mx-auto",
            activeRightPanel ? "max-w-none" : "max-w-7xl"
          )}>

            {/* Left Sidebar: File List */}
            <FileSidebar
              items={processedItems}
              activeId={activeItemId}
              onSelect={setActiveItemId}
              onRemove={handleRemove}
              isCollapsed={isSidebarCollapsed}
              onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            />

            {/* Main Content Area */}
            <div className="flex-1 min-w-0 space-y-8">
              {activeItem ? (
                <>
                  {/* Status Checker */}
                  {activeItem.status === 'processing' && (
                    <div className="flex flex-col items-center justify-center py-20 bg-zinc-900/50 rounded-2xl border border-white/5">
                      <div className="h-12 w-12 rounded-full border-4 border-white/10 border-t-blue-500 animate-spin mb-4" />
                      <p className="text-gray-400 font-mono text-sm animate-pulse">Processing {activeItem.title}...</p>
                    </div>
                  )}
                  {activeItem.status === 'error' && (
                    <div className="flex flex-col items-center justify-center py-20 bg-red-950/20 rounded-2xl border border-red-500/20">
                      <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                      <p className="text-red-300 font-mono text-sm px-4 text-center">{activeItem.error || "Failed to process"}</p>
                    </div>
                  )}
                  {activeItem.status === 'completed' && activeItem.data && (
                    <>
                      {/* Sticky Audio Player */}
                      {/* Removed from top */}

                      <ResultsSection
                        videoUrl={activeItem.url}
                        thumbnail={activeItem.thumbnail || ""}
                        title={activeItem.title}
                        chapters={activeItem.data.chapters}
                        transcript={activeItem.data.transcript}
                        entities={activeItem.data.entities}
                        highlights={activeItem.data.highlights}
                        sponsors={activeItem.data.sponsors}
                        qa={activeItem.data.qa}
                        debugData={activeItem.data.debugData}
                        onSeek={handleSeek}
                        openAIKey={openAIKey}
                        elevenLabsKey={apiKey}
                        showResultsPanel={showResultsPanel}
                        setShowResultsPanel={setShowResultsPanel}

                        // Right Panel Props
                        activeRightPanel={activeRightPanel}
                        setActiveRightPanel={setActiveRightPanel}
                        notesContent={notesContent}
                        setNotesContent={setNotesContent}
                        canvasItems={canvasItems}
                        setCanvasItems={setCanvasItems}

                        // Global Table Props
                        tableColumns={tableColumns}
                        setTableColumns={setTableColumns}
                        tableItems={tableItems}
                        setTableItems={setTableItems}
                        allProcessedItems={processedItems}

                        // Bookmarks
                        bookmarks={bookmarks}
                        onToggleBookmark={(item) => handleToggleBookmark({
                          ...item,
                          sourceId: activeItem.id,
                          videoTitle: activeItem.title
                        })}
                        onEducationModeToggle={(enabled) => {
                          if (enabled) setIsSidebarCollapsed(true);
                        }}
                      />
                    </>
                  )}
                  {activeItem.status === 'pending' && (
                    <div className="flex flex-col items-center justify-center py-20 bg-zinc-900/50 rounded-2xl border border-dashed border-white/10">
                      <Clock className="h-10 w-10 text-gray-600 mb-4" />
                      <p className="text-gray-500">Waiting in queue...</p>
                    </div>
                  )}

                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                  <p>Select a file from the sidebar to view results.</p>
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      {/* Bookmarks Sidebar */}
      {showBookmarksPanel && (
        <>
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 animate-in fade-in"
            onClick={() => setShowBookmarksPanel(false)}
          />
          <div className="fixed right-0 top-0 bottom-0 w-[400px] bg-zinc-900 border-l border-white/10 p-6 z-50 shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Bookmark className="w-5 h-5 text-blue-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Saved Insights</h2>
              </div>
              <button
                onClick={() => setShowBookmarksPanel(false)}
                className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {bookmarks.length === 0 ? (
                <div className="text-center py-20 text-gray-500">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bookmark className="w-6 h-6 opacity-30" />
                  </div>
                  <p>No saved bookmarks yet.</p>
                  <p className="text-xs mt-2">Use Education Mode to save insights.</p>
                </div>
              ) : (
                bookmarks.map(bm => (
                  <div key={bm.id} className="bg-white/5 border border-white/5 rounded-xl p-4 hover:border-blue-500/30 transition-all group">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-blue-300 bg-blue-500/10 px-1.5 py-0.5 rounded uppercase">
                          {bm.type}
                        </span>
                        <span className="text-xs text-gray-500">{bm.timestamp}</span>
                      </div>
                      <button
                        onClick={() => deleteBookmark(bm.id)}
                        className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <h3 className="font-semibold text-white mb-2 text-lg">{bm.text}</h3>
                    <p className="text-sm text-gray-400 leading-relaxed mb-3 line-clamp-3 hover:line-clamp-none transition-all">
                      {bm.explanation}
                    </p>
                    <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                      <p className="text-xs text-gray-500 truncate max-w-[200px]" title={bm.videoTitle}>
                        {bm.videoTitle}
                      </p>
                      <button className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                        View <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
