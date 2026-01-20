"use client";

import { useState, useEffect } from "react";
import { Loader2, CheckCircle, XCircle, AlertCircle, RefreshCw, Info, ShieldCheck } from "lucide-react";
import { cn } from "../../lib/utils";
import { maskText } from "../../lib/safeMode";

interface VerificationResult {
    item: string;
    satisfied: boolean;
    reason: string;
    confidence: number;
}

interface ComplianceTabProps {
    transcript: string;
    checklistItems: string[];
    apiKey: string;
    isSafeMode?: boolean;
    entities?: any[];
    onComplianceUpdate?: (passed: number, total: number) => void;
}

export default function ComplianceTab({ transcript, checklistItems, apiKey, isSafeMode = false, entities = [], onComplianceUpdate }: ComplianceTabProps) {
    const [results, setResults] = useState<VerificationResult[]>([]);
    const [isVerifying, setIsVerifying] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastVerifiedItems, setLastVerifiedItems] = useState<string[]>([]);

    const verifyCompliance = async () => {
        if (!transcript || checklistItems.length === 0) return;

        if (!apiKey) {
            setError("OpenAI API Key is required. Please set it in Settings.");
            return;
        }

        // Don't re-verify if items haven't changed and we have results
        if (results.length > 0 && JSON.stringify(lastVerifiedItems) === JSON.stringify(checklistItems)) {
            // Ensure we still notify parent of current state (e.g. on remount or parent refresh)
            if (onComplianceUpdate) {
                onComplianceUpdate(results.filter(r => r.satisfied).length, results.length);
            }
            return;
        }

        setIsVerifying(true);
        setError(null);
        setResults([]);

        try {
            const res = await fetch("/api/verify-compliance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    transcript,
                    checklist: checklistItems,
                    apiKey
                })
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || `Verification failed (${res.status})`);
            }

            const data = await res.json();
            setResults(data.results);
            setLastVerifiedItems([...checklistItems]);

            if (onComplianceUpdate) {
                const passed = data.results.filter((r: any) => r.satisfied).length;
                onComplianceUpdate(passed, data.results.length);
            }
        } catch (err: any) {
            console.error("Compliance verification error:", err);
            setError(err.message || "Verification failed");
        } finally {
            setIsVerifying(false);
        }
    };

    useEffect(() => {
        verifyCompliance();
    }, [transcript, checklistItems]);

    return (
        <div className="w-full h-full flex flex-col bg-slate-50 rounded-xl overflow-hidden border border-slate-200">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white">
                <div>
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        Compliance Verification
                        {isVerifying && <Loader2 className="w-3 h-3 animate-spin text-blue-500" />}
                        {isSafeMode && <ShieldCheck className="w-4 h-4 text-green-500" />}
                    </h3>
                    <p className="text-xs text-gray-500">
                        {results.length > 0
                            ? `${results.filter(r => r.satisfied).length} Passed / ${results.length} Total`
                            : "Checking compliance against transcript..."}
                    </p>
                </div>
                <button
                    onClick={() => { setResults([]); verifyCompliance(); }}
                    disabled={isVerifying}
                    className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                >
                    <RefreshCw className={cn("w-4 h-4", isVerifying && "animate-spin")} />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {error && (
                    <div className="p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                    </div>
                )}

                {isVerifying && results.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-500" />
                        <p>Analyzing transcript against checklist...</p>
                    </div>
                )}

                {!isVerifying && results.length === 0 && !error && (
                    <div className="text-center py-20 text-gray-400">
                        <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No results yet.</p>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {results.map((result, idx) => (
                        <div
                            key={idx}
                            className={cn(
                                "flex flex-col p-4 rounded-xl border-l-[6px] shadow-sm bg-white transition-all hover:shadow-md",
                                result.satisfied
                                    ? "border-green-500"
                                    : "border-red-500"
                            )}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="font-semibold text-gray-900 text-sm leading-tight">
                                    {result.item}
                                </h4>
                                {result.satisfied ? (
                                    <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                                ) : (
                                    <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                                )}
                            </div>

                            <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded-lg leading-relaxed">
                                {isSafeMode && entities.length > 0 ? maskText(result.reason, entities) : result.reason}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
