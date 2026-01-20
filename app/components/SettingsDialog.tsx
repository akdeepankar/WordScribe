"use client";

import { useState, useEffect } from "react";
import { X, Save, Key } from "lucide-react";

interface SettingsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (apiKey: string) => void;
    openAIKey: string;
    onSaveOpenAI: (apiKey: string) => void;
}

export default function SettingsDialog({ isOpen, onClose, onSave, openAIKey, onSaveOpenAI }: SettingsDialogProps) {
    const [key, setKey] = useState("");
    const [aiKey, setAiKey] = useState("");

    useEffect(() => {
        const savedKey = localStorage.getItem("protube_api_key");
        if (savedKey) setKey(savedKey);
        const savedAiKey = localStorage.getItem("protube_openai_key");
        if (savedAiKey) setAiKey(savedAiKey);
    }, [isOpen]);

    const handleSave = () => {
        localStorage.setItem("protube_api_key", key);
        onSave(key);

        localStorage.setItem("protube_openai_key", aiKey);
        onSaveOpenAI(aiKey);

        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900 p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Key className="w-5 h-5 text-red-500" />
                        Settings
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1.5">ElevenLabs API Key</label>
                        <input
                            type="password"
                            value={key}
                            onChange={(e) => setKey(e.target.value)}
                            placeholder="sk_..."
                            className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2.5 text-white placeholder-gray-600 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500/50"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1.5 flex items-center gap-2">
                            OpenAI API Key
                            <span className="text-[10px] bg-green-900/40 text-green-400 px-1.5 py-0.5 rounded border border-green-500/20">For Summary & Refinement</span>
                        </label>
                        <input
                            type="password"
                            value={aiKey}
                            onChange={(e) => setAiKey(e.target.value)}
                            placeholder="sk-..."
                            className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2.5 text-white placeholder-gray-600 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500/50"
                        />
                        <p className="mt-2 text-xs text-gray-500">
                            Keys are stored locally in your browser.
                        </p>
                    </div>

                    <button
                        onClick={handleSave}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 font-medium text-white hover:bg-red-500 active:scale-[0.98] transition-all"
                    >
                        <Save size={18} />
                        Save Configuration
                    </button>
                </div>
            </div>
        </div>
    );
}
