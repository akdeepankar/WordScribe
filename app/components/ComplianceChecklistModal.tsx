"use client";

import { useRef, useEffect, useState } from "react";
import { X, ShieldAlert, CheckCircle2, Plus, Trash2 } from "lucide-react";
import { cn } from "../lib/utils";

export interface ChecklistItem {
    id: string;
    name: string;
    description: string;
}

interface ComplianceChecklistModalProps {
    isOpen: boolean;
    onClose: () => void;
    checklist: ChecklistItem[];
    setChecklist: (items: ChecklistItem[]) => void;
}

export default function ComplianceChecklistModal({
    isOpen,
    onClose,
    checklist,
    setChecklist
}: ComplianceChecklistModalProps) {
    const dialogRef = useRef<HTMLDivElement>(null);
    const [newItemName, setNewItemName] = useState("");
    const [newItemDesc, setNewItemDesc] = useState("");

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

    const handleAddItem = () => {
        if (!newItemName.trim() || !newItemDesc.trim()) return;

        const newItem: ChecklistItem = {
            id: newItemName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''),
            name: newItemName.trim(),
            description: newItemDesc.trim()
        };

        setChecklist([...checklist, newItem]);
        setNewItemName("");
        setNewItemDesc("");
    };

    const handleRemoveItem = (id: string) => {
        setChecklist(checklist.filter(item => item.id !== id));
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div
                ref={dialogRef}
                className="w-full max-w-lg rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden"
            >
                <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-white/5">
                    <div className="flex items-center gap-2 text-white">
                        <ShieldAlert className="h-5 w-5 text-indigo-500" />
                        <h2 className="text-lg font-semibold">Compliance Checklist</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Add New Item */}
                    <div className="space-y-3 p-4 bg-white/5 rounded-xl border border-white/5">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Add New Check</h3>
                        <div className="space-y-2">
                            <input
                                value={newItemName}
                                onChange={(e) => setNewItemName(e.target.value)}
                                placeholder="Check Name (e.g. No Profanity)"
                                className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-indigo-500/50"
                            />
                            <textarea
                                value={newItemDesc}
                                onChange={(e) => setNewItemDesc(e.target.value)}
                                placeholder="Description of what to look for..."
                                className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-indigo-500/50 resize-none h-20"
                            />
                            <button
                                onClick={handleAddItem}
                                disabled={!newItemName.trim() || !newItemDesc.trim()}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg py-2 text-xs font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Add to Checklist
                            </button>
                        </div>
                    </div>

                    {/* Current Items */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                                Active Checks
                                <span className="bg-white/10 text-gray-300 px-1.5 py-0.5 rounded text-[10px]">{checklist.length}</span>
                            </h3>
                        </div>

                        <div className="max-h-[240px] overflow-y-auto space-y-2 pr-2">
                            {checklist.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-8 italic">No checks defined yet.</p>
                            ) : (
                                checklist.map((item) => (
                                    <div key={item.id} className="group bg-zinc-950/50 border border-white/10 rounded-lg p-3 flex items-start justify-between hover:border-white/20 transition-colors">
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-200">{item.name}</h4>
                                            <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveItem(item.id)}
                                            className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
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
