"use client";

import { useRef, useEffect } from "react";
import { X, Settings2, Shield, CheckCircle2 } from "lucide-react";
import { cn } from "../lib/utils";

interface KeyTermsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    keyTerms: string;
    setKeyTerms: (terms: string) => void;
    entityTypes: string[];
    setEntityTypes: (types: string[]) => void;
}

export default function KeyTermsDialog({
    isOpen,
    onClose,
    keyTerms,
    setKeyTerms,
    entityTypes = ["all"], // Default fallback
    setEntityTypes
}: KeyTermsDialogProps) {
    const dialogRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dialogRef.current && !dialogRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const toggleType = (type: string) => {
        if (type === "all") {
            setEntityTypes(["all"]);
            return;
        }

        // If selecting specific, remove 'all'
        let newTypes = entityTypes.filter(t => t !== "all");

        if (newTypes.includes(type)) {
            newTypes = newTypes.filter(t => t !== type);
        } else {
            newTypes = [...newTypes, type];
        }

        if (newTypes.length === 0) newTypes = ["all"]; // Prevent empty selection
        setEntityTypes(newTypes);
    };

    const isAll = entityTypes.includes("all");

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div
                ref={dialogRef}
                className="w-full max-w-lg rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden"
            >
                <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-white/5">
                    <div className="flex items-center gap-2 text-white">
                        <Settings2 className="h-5 w-5 text-red-500" />
                        <h2 className="text-lg font-semibold">Analysis Configuration</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-8">
                    {/* Entity Detection Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-300 uppercase tracking-wider">
                            <Shield className="h-4 w-4 text-blue-400" />
                            Entity Types
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button
                                onClick={() => toggleType("all")}
                                className={cn(
                                    "flex items-center gap-3 p-3 rounded-xl border text-left transition-all",
                                    isAll
                                        ? "bg-blue-500/10 border-blue-500/50 text-white"
                                        : "bg-white/5 border-white/5 text-gray-400 hover:bg-white/10"
                                )}
                            >
                                <div className={cn("w-5 h-5 rounded-full border flex items-center justify-center", isAll ? "border-blue-500 bg-blue-500" : "border-gray-500")}>
                                    {isAll && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                </div>
                                <span className="font-medium">All Entities</span>
                            </button>

                            <button
                                onClick={() => toggleType("pii")}
                                className={cn(
                                    "flex items-center gap-3 p-3 rounded-xl border text-left transition-all",
                                    entityTypes.includes("pii")
                                        ? "bg-red-500/10 border-red-500/50 text-white"
                                        : "bg-white/5 border-white/5 text-gray-400 hover:bg-white/10"
                                )}
                            >
                                <div className={cn("w-5 h-5 rounded-full border flex items-center justify-center", entityTypes.includes("pii") ? "border-red-500 bg-red-500" : "border-gray-500")}>
                                    {entityTypes.includes("pii") && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                </div>
                                <span className="font-medium">PII (Personal)</span>
                            </button>

                            <button
                                onClick={() => toggleType("phi")}
                                className={cn(
                                    "flex items-center gap-3 p-3 rounded-xl border text-left transition-all",
                                    entityTypes.includes("phi")
                                        ? "bg-green-500/10 border-green-500/50 text-white"
                                        : "bg-white/5 border-white/5 text-gray-400 hover:bg-white/10"
                                )}
                            >
                                <div className={cn("w-5 h-5 rounded-full border flex items-center justify-center", entityTypes.includes("phi") ? "border-green-500 bg-green-500" : "border-gray-500")}>
                                    {entityTypes.includes("phi") && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                </div>
                                <span className="font-medium">PHI (Health)</span>
                            </button>

                            <button
                                onClick={() => toggleType("pci")}
                                className={cn(
                                    "flex items-center gap-3 p-3 rounded-xl border text-left transition-all",
                                    entityTypes.includes("pci")
                                        ? "bg-purple-500/10 border-purple-500/50 text-white"
                                        : "bg-white/5 border-white/5 text-gray-400 hover:bg-white/10"
                                )}
                            >
                                <div className={cn("w-5 h-5 rounded-full border flex items-center justify-center", entityTypes.includes("pci") ? "border-purple-500 bg-purple-500" : "border-gray-500")}>
                                    {entityTypes.includes("pci") && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                </div>
                                <span className="font-medium">PCI (Payment)</span>
                            </button>
                        </div>
                    </div>

                    {/* OpenAI Config Removed */}


                    {/* Key Terms Section - kept but secondary */}
                    <div className="space-y-3 pt-4 border-t border-white/10">
                        <label className="text-sm font-medium text-gray-300 uppercase tracking-wider flex items-center gap-2">
                            Keyterms
                        </label>
                        <textarea
                            value={keyTerms}
                            onChange={(e) => setKeyTerms(e.target.value)}
                            placeholder="Enter specific words/phrases to track (comma separated)..."
                            className="w-full h-24 rounded-xl bg-white/5 border border-white/10 p-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500/50 transition-all resize-none text-sm"
                        />
                    </div>
                </div>

                <div className="p-6 pt-0 flex justify-end">
                    <button
                        onClick={onClose}
                        className="bg-white text-black px-6 py-2.5 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}
