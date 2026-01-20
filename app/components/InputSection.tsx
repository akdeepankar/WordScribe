import { Play, Sparkles, Tag, ClipboardCheck } from "lucide-react";
import { cn } from "../lib/utils";

interface InputSectionProps {
    url: string;
    setUrl: (url: string) => void;
    onGenerate: () => void;
    isLoading: boolean;
    onKeyTermsClick: () => void;
    onComplianceClick?: () => void;
    hasKeyTerms?: boolean;
    hasComplianceItems?: boolean;
    variant?: "hero" | "compact";
}

export default function InputSection({
    url,
    setUrl,
    onGenerate,
    isLoading,
    onKeyTermsClick,
    onComplianceClick,
    hasKeyTerms = false,
    hasComplianceItems = false,
    variant = "hero",
}: InputSectionProps) {
    if (variant === "compact") {
        return (
            <div className="flex w-full items-center gap-2 animate-in fade-in transition-all duration-300">
                <div className="relative flex-1 group">
                    <input
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="YouTube URL..."
                        className="w-full h-10 rounded-lg border border-white/10 bg-white/5 pl-9 pr-4 text-sm text-white placeholder:text-gray-500 outline-none transition-all focus:border-blue-500/50 focus:bg-white/10"
                    />
                    <Play className="absolute left-3 top-2.5 h-4 w-4 text-gray-500 transition-colors group-focus-within:text-blue-500" />
                </div>

                <button
                    onClick={onKeyTermsClick}
                    className={cn(
                        "h-10 w-10 flex items-center justify-center rounded-lg border transition-colors",
                        hasKeyTerms
                            ? "border-blue-500/50 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
                            : "border-white/10 bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                    )}
                    title="Edit Key Terms"
                >
                    <Tag className="h-4 w-4" />
                </button>

                {onComplianceClick && (
                    <button
                        onClick={onComplianceClick}
                        className={cn(
                            "h-10 w-10 flex items-center justify-center rounded-lg border transition-colors",
                            hasComplianceItems
                                ? "border-blue-500/50 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
                                : "border-white/10 bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                        )}
                        title="Compliance Checklist"
                    >
                        <ClipboardCheck className="h-4 w-4" />
                    </button>
                )}

                <button
                    onClick={onGenerate}
                    disabled={isLoading || !url}
                    className="h-10 px-4 rounded-lg bg-white text-black text-sm font-bold hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                    {isLoading ? <div className="h-4 w-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : "Experiment"}
                </button>
            </div>
        );
    }

    return (
        <div className="w-full max-w-xl mx-auto space-y-4">
            <div className="relative group">
                <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Paste YouTube URL here..."
                    className="w-full h-14 rounded-2xl border border-white/10 bg-white/5 px-4 pl-12 text-lg text-white placeholder:text-gray-500 outline-none transition-all focus:border-blue-500/50 focus:bg-white/10 focus:ring-4 focus:ring-blue-500/10"
                />
                <Play className="absolute left-4 top-4 h-6 w-6 text-gray-500 transition-colors group-focus-within:text-blue-500" />
            </div>

            <div className="flex gap-2">
                <button
                    onClick={onKeyTermsClick}
                    className={cn(
                        "flex-1 h-12 flex items-center justify-center gap-2 rounded-xl border transition-colors text-sm",
                        hasKeyTerms
                            ? "border-blue-500/50 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
                            : "border-white/10 bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                    )}
                >
                    <Sparkles className="h-4 w-4" />
                    Config
                </button>
                {onComplianceClick && (
                    <button
                        onClick={onComplianceClick}
                        className={cn(
                            "flex-1 h-12 flex items-center justify-center gap-2 rounded-xl border transition-colors text-sm",
                            hasComplianceItems
                                ? "border-blue-500/50 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
                                : "border-white/10 bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                        )}
                    >
                        <ClipboardCheck className="h-4 w-4" />
                        Compliance
                    </button>
                )}
            </div>

            <button
                onClick={onGenerate}
                disabled={isLoading || !url}
                className="group relative flex w-full h-14 items-center justify-center overflow-hidden rounded-2xl bg-white text-black font-bold text-lg transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 opacity-0 transition-opacity group-hover:opacity-100" />
                <span className="flex items-center gap-2 relative z-10">
                    {isLoading ? (
                        "Processing..."
                    ) : (
                        <>
                            <Sparkles className="h-5 w-5 text-blue-400" />
                            Experiment
                        </>
                    )}
                </span>
            </button>
        </div>
    );
}
