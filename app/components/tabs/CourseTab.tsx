import { useState, useEffect, useRef } from "react";
import { BookOpen, ChevronRight, PlayCircle, Clock, Loader2, PanelLeftClose, PanelLeftOpen, RefreshCw, Image as ImageIcon, Download, Headphones } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Image from "next/image";
import { cn } from "../../lib/utils";
import { toJpeg } from "html-to-image";


interface Lesson {
    title: string;
    content: string;
    duration: string;
}

interface Module {
    title: string;
    lessons: Lesson[];
}

export interface CourseData {
    title: string;
    modules: Module[];
}

interface CourseTabProps {
    courseData: CourseData | null;
    onGenerateCourse: () => void;
    isGeneratingCourse: boolean;
    apiKey: string;
    elevenLabsKey: string;
}

// Simple in-memory cache for generated images to avoid re-generating on re-renders
const imageCache: Record<string, string> = {};

interface CourseImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    apiKey: string;
}

const CourseImage = ({ src, alt, apiKey, className, ...props }: CourseImageProps) => {
    // Determine prompt and initial state based on cache
    // Support both PROMPT (legacy) and QUERY (new) prefixes
    let prompt = null;
    if (src === "placeholder" && alt) {
        if (alt.startsWith("QUERY: ")) prompt = alt.replace("QUERY: ", "");
        else if (alt.startsWith("PROMPT: ")) prompt = alt.replace("PROMPT: ", "");
    }

    const cachedUrl = prompt ? imageCache[prompt] : undefined;

    const initialSrc = typeof src === 'string' ? src : undefined;

    // Initialize state with cached value if available
    const [imageUrl, setImageUrl] = useState<string | undefined>(cachedUrl || (src === "placeholder" ? undefined : initialSrc));
    const [loading, setLoading] = useState(src === "placeholder" && !cachedUrl);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Only generate if it's a placeholder, we found a prompt, and no image yet
        // apiKey is redundant now for search, but we keep the prop for compatibility
        if (src === "placeholder" && prompt && !imageUrl) {

            // Check cache again in case it was updated (e.g. strict mode double invoke)
            if (imageCache[prompt]) {
                setImageUrl(imageCache[prompt]);
                setLoading(false);
                return;
            }

            const generateImage = async () => {
                setLoading(true);
                try {
                    const response = await fetch("/api/generate-image", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ prompt, apiKey }),
                    });

                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(data.error || "Failed to generate image");
                    }

                    if (data.url) {
                        imageCache[prompt] = data.url;
                        setImageUrl(data.url);
                    }
                } catch (err) {
                    console.error("Image generation error:", err);
                    setError("Failed to generate image");
                } finally {
                    setLoading(false);
                }
            };

            generateImage();
        }
    }, [src, prompt, apiKey, imageUrl]);

    if (src === "placeholder") {
        if (loading) {
            return (
                <span className="flex w-full h-64 bg-slate-100 rounded-lg flex-col items-center justify-center text-gray-400 animate-pulse my-6">
                    <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                    <span className="text-xs">Generating illustration...</span>
                </span>
            );
        }

        if (error) {
            return (
                <span className="flex w-full h-32 bg-red-50 rounded-lg items-center justify-center text-red-400 text-xs my-6">
                    Failed to find image
                </span>
            );
        }

        if (imageUrl) {
            return (
                <span className="block relative w-full h-auto aspect-square md:aspect-video my-6 rounded-xl overflow-hidden shadow-sm border border-gray-100">
                    <Image
                        src={imageUrl}
                        alt={alt?.replace("PROMPT: ", "") || "Course illustration"}
                        fill
                        className="object-cover"
                        unoptimized // For external DALL-E urls
                    />
                </span>
            );
        }

        return null;
    }

    // Default fallback for regular images (though likely none in this context)
    return <img src={src} alt={alt} className={cn("rounded-xl my-6", className)} {...props} />;
};

export default function CourseTab({ courseData, onGenerateCourse, isGeneratingCourse, apiKey, elevenLabsKey }: CourseTabProps) {
    const [selectedModuleIdx, setSelectedModuleIdx] = useState(0);
    const [selectedLessonIdx, setSelectedLessonIdx] = useState(0);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    // Audio State
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
    const audioRef = useRef<HTMLAudioElement>(null);

    // Reset audio when lesson changes
    useEffect(() => {
        setAudioUrl(null);
    }, [selectedModuleIdx, selectedLessonIdx]);

    // Reset selection when course data changes
    useEffect(() => {
        setSelectedModuleIdx(0);
        setSelectedLessonIdx(0);
    }, [courseData]);

    const handleGenerateAudio = async () => {
        const currentModule = courseData?.modules[selectedModuleIdx];
        const currentLesson = currentModule?.lessons[selectedLessonIdx];

        if (!currentLesson || isGeneratingAudio) return;

        if (!elevenLabsKey) {
            alert("Please set your ElevenLabs API Key in Settings first.");
            return;
        }

        setIsGeneratingAudio(true);
        try {
            // Clean markdown for speech
            const textToSpeak = currentLesson.content.replace(/[#*`]/g, '');

            const response = await fetch("/api/generate-audio", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    text: textToSpeak.slice(0, 5000), // Safety limit
                    apiKey: elevenLabsKey
                })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error);

            setAudioUrl(data.audioUrl);
            setTimeout(() => audioRef.current?.play(), 100);

        } catch (error: any) {
            console.error("Audio generation failed:", error);
            alert("Failed to generate audio: " + error.message);
        } finally {
            setIsGeneratingAudio(false);
        }
    };

    const handleExportPDF = () => {
        const element = document.getElementById('lesson-content');
        if (!element) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert("Please allow popups to export PDF.");
            return;
        }

        const content = element.innerHTML;
        const title = `${courseData?.title} - Lesson ${selectedLessonIdx + 1}`;

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${title}</title>
                <meta charset="UTF-8">
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                    body { 
                        font-family: 'Inter', sans-serif; 
                        padding: 40px; 
                        max-width: 800px;
                        margin: 0 auto;
                        color: #111827;
                    }
                    h1 { font-size: 2.25rem; font-weight: 800; margin-bottom: 1.5rem; color: #111827; }
                    h2 { font-size: 1.5rem; font-weight: 700; margin-top: 2rem; margin-bottom: 1rem; color: #1f2937; }
                    img { max-width: 100%; height: auto; border-radius: 0.5rem; margin: 1.5rem 0; }
                    p { margin-bottom: 1rem; line-height: 1.6; color: #374151; }
                    ul, ol { margin-bottom: 1rem; padding-left: 1.5rem; }
                    li { margin-bottom: 0.5rem; }
                    strong { font-weight: 600; color: #111827; }
                    button, .no-print { display: none !important; }
                </style>
            </head>
            <body>
                <div class="prose prose-lg max-w-none">
                    ${content}
                </div>
                <script>
                    window.onload = () => {
                        setTimeout(() => {
                            window.print();
                        }, 500);
                    };
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    if (!courseData) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-slate-50 border border-slate-200 rounded-xl h-full">
                <BookOpen className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-500 mb-2">No Course Generated</h3>
                <p className="text-gray-400 text-sm max-w-sm text-center mb-6">
                    Click "Generate Course" to create a structured learning path from this video.
                </p>
                <button
                    onClick={onGenerateCourse}
                    disabled={isGeneratingCourse}
                    className="flex items-center gap-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg border border-transparent shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    {isGeneratingCourse ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />}
                    {isGeneratingCourse ? "Generating Course..." : "Generate Course"}
                </button>
            </div>
        );
    }

    const currentLesson = courseData.modules[selectedModuleIdx]?.lessons[selectedLessonIdx];

    return (
        <div className="w-full h-full flex bg-white rounded-xl overflow-hidden border border-slate-200">
            {/* Sidebar - Modules & Lessons */}
            <div className={cn(
                "border-r border-slate-200 bg-slate-50 flex flex-col overflow-y-auto shrink-0 transition-all duration-300",
                isSidebarCollapsed ? "w-14" : "w-80"
            )}>
                <div className={cn(
                    "p-4 border-b border-slate-200 bg-white sticky top-0 z-10 flex items-center transition-all duration-300",
                    isSidebarCollapsed ? "flex-col justify-center gap-4 py-6" : "justify-between"
                )}>
                    {!isSidebarCollapsed && (
                        <div className="overflow-hidden">
                            <h2 className="font-bold text-gray-900 leading-tight truncate">
                                {courseData.title}
                            </h2>
                            <p className="text-xs text-gray-500 mt-1 truncate">
                                {courseData.modules.reduce((acc, m) => acc + m.lessons.length, 0)} Lessons
                            </p>
                        </div>
                    )}
                    <div className={cn("flex items-center gap-1", isSidebarCollapsed ? "flex-col-reverse gap-4" : "")}>
                        <button
                            onClick={() => {
                                handleExportPDF(); /*
                                const element = document.getElementById('lesson-content');
                                if (!element) return;

                                try {
                                    const dataUrl = await toJpeg(element, { quality: 0.95, cacheBust: true, backgroundColor: '#ffffff' });

                                    // Safer dynamic import for jsPDF to handle default exports
                                    const jsPDFModule = await import('jspdf');
                                    const JsPDF = jsPDFModule.default || jsPDFModule.jsPDF;
                                    // @ts-ignore - Handle constructor mismatch if any
                                    const pdf = new JsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

                                    const imgProps = pdf.getImageProperties(dataUrl);
                                    const pdfWidth = pdf.internal.pageSize.getWidth();
                                    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

                                    pdf.addImage(dataUrl, 'JPEG', 0, 0, pdfWidth, pdfHeight);
                                    pdf.save(`${courseData.title.slice(0, 20)}_Lesson.pdf`);
                                } catch (error: any) {
                                    console.error("PDF Export failed:", error);
                                    alert(`Failed to export PDF: ${error?.message || JSON.stringify(error)}`);
                                }
                            */ }}
                            className={cn(
                                "text-gray-500 hover:text-green-600 p-1 rounded-md hover:bg-green-50 transition-colors",
                            )}
                            title="Export Current Lesson PDF"
                        >
                            <Download className="w-4 h-4" />
                        </button>



                        <button
                            onClick={onGenerateCourse}
                            disabled={isGeneratingCourse}
                            className={cn(
                                "text-gray-500 hover:text-blue-600 p-1 rounded-md hover:bg-blue-50 transition-colors",
                                isGeneratingCourse ? "opacity-50 cursor-not-allowed" : ""
                            )}
                            title="Regenerate Course"
                        >
                            {isGeneratingCourse ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                        </button>
                        <button
                            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                            className={cn(
                                "text-gray-500 hover:text-gray-700 p-1 rounded-md hover:bg-slate-100 transition-colors",
                                isSidebarCollapsed ? "mx-auto" : ""
                            )}
                            title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                        >
                            {isSidebarCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                {!isSidebarCollapsed ? (
                    <div className="p-3 space-y-4">
                        {courseData.modules.map((module, mIdx) => (
                            <div key={mIdx}>
                                <h3 className="px-3 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                                    {module.title}
                                </h3>
                                <div className="space-y-1">
                                    {module.lessons.map((lesson, lIdx) => {
                                        const isActive = mIdx === selectedModuleIdx && lIdx === selectedLessonIdx;
                                        return (
                                            <button
                                                key={lIdx}
                                                onClick={() => {
                                                    setSelectedModuleIdx(mIdx);
                                                    setSelectedLessonIdx(lIdx);
                                                }}
                                                className={cn(
                                                    "w-full text-left px-3 py-2 rounded-lg text-sm flex items-start gap-3 transition-colors",
                                                    isActive
                                                        ? "bg-blue-100 text-blue-700 font-medium"
                                                        : "text-gray-600 hover:bg-slate-200 hover:text-gray-900"
                                                )}
                                            >
                                                <PlayCircle className={cn("w-4 h-4 mt-0.5 shrink-0", isActive ? "fill-blue-600 text-blue-100" : "text-gray-400")} />
                                                <span className="line-clamp-2">{lesson.title}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center py-4 gap-4">
                        {courseData.modules.map((module, mIdx) => (
                            <div key={mIdx} className="flex flex-col items-center gap-2 w-full">
                                {module.lessons.map((lesson, lIdx) => {
                                    const isActive = mIdx === selectedModuleIdx && lIdx === selectedLessonIdx;
                                    return (
                                        <button
                                            key={`${mIdx}-${lIdx}`}
                                            onClick={() => {
                                                setSelectedModuleIdx(mIdx);
                                                setSelectedLessonIdx(lIdx);
                                            }}
                                            className={cn(
                                                "p-2 rounded-lg transition-colors group relative",
                                                isActive
                                                    ? "bg-blue-100 text-blue-700"
                                                    : "text-gray-400 hover:bg-slate-200 hover:text-gray-900"
                                            )}
                                            title={`${module.title}: ${lesson.title}`}
                                        >
                                            <PlayCircle className={cn("w-5 h-5", isActive ? "fill-blue-600 text-blue-100" : "")} />
                                        </button>
                                    );
                                })}
                                <div className="w-8 h-px bg-slate-200" />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Main Content - Lesson View */}
            <div className="flex-1 overflow-y-auto bg-white">
                {currentLesson ? (
                    <div id="lesson-content" className="max-w-3xl mx-auto p-8 md:p-12">
                        <div className="mb-8 border-b border-gray-100 pb-6">
                            <div className="flex items-center gap-2 text-sm text-blue-600 font-medium mb-3">
                                <span>{courseData.modules[selectedModuleIdx].title}</span>
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                                <span>Lesson {selectedLessonIdx + 1}</span>
                            </div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-4">{currentLesson.title}</h1>
                            <div className="flex items-center gap-2 text-gray-500 text-sm">
                                <Clock className="w-4 h-4" />
                                {currentLesson.duration}
                            </div>

                            {/* Audio Player Section */}
                            <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <button
                                    onClick={handleGenerateAudio}
                                    disabled={isGeneratingAudio}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all shadow-sm shrink-0",
                                        audioUrl
                                            ? "bg-purple-100 text-purple-700 hover:bg-purple-200"
                                            : "bg-white text-gray-700 hover:text-purple-600 border border-slate-200 hover:border-purple-200",
                                        isGeneratingAudio && "opacity-50 cursor-not-allowed"
                                    )}
                                >
                                    {isGeneratingAudio ? <Loader2 className="w-4 h-4 animate-spin" /> : <Headphones className="w-4 h-4" />}
                                    {isGeneratingAudio ? "Generating..." : (audioUrl ? "Play Audio" : "Generate Audio")}
                                </button>

                                {audioUrl && (
                                    <audio
                                        ref={audioRef}
                                        src={audioUrl}
                                        controls
                                        className="w-full h-10"
                                    />
                                )}
                            </div>
                        </div>

                        <div className="prose prose-lg max-w-none prose-slate prose-headings:font-bold prose-headings:text-black prose-p:text-black prose-li:text-black prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-p:leading-relaxed prose-li:marker:text-blue-500 text-black">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    img: (props) => <CourseImage {...props} apiKey={apiKey} />
                                }}
                            >
                                {currentLesson.content}
                            </ReactMarkdown>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                        Select a lesson to start learning
                    </div>
                )}
            </div>
        </div >
    );
}
