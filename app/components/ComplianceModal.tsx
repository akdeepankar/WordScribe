import { useState, useEffect } from "react";
import { X, Plus, CheckSquare, Trash2, ClipboardCheck } from "lucide-react";
import { cn } from "../lib/utils";

interface ComplianceModalProps {
    isOpen: boolean;
    onClose: () => void;
    items: string[];
    onSave: (items: string[]) => void;
}

export default function ComplianceModal({ isOpen, onClose, items, onSave }: ComplianceModalProps) {
    const [localItems, setLocalItems] = useState<string[]>([]);
    const [newItem, setNewItem] = useState("");

    useEffect(() => {
        if (isOpen) {
            setLocalItems([...items]);
        }
    }, [isOpen, items]);

    const handleAdd = () => {
        if (newItem.trim()) {
            setLocalItems([...localItems, newItem.trim()]);
            setNewItem("");
        }
    };

    const handleRemove = (index: number) => {
        const newItems = [...localItems];
        newItems.splice(index, 1);
        setLocalItems(newItems);
    };

    const handleSave = () => {
        onSave(localItems);
        onClose();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAdd();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-zinc-900 border border-white/10 p-6 rounded-2xl w-full max-w-md shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <ClipboardCheck className="w-5 h-5 text-green-500" />
                        Compliance Checklist
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-4">
                    <p className="text-sm text-gray-400">
                        Define compliance requirements to check against the transcript.
                    </p>

                    <div className="flex gap-2">
                        <input
                            value={newItem}
                            onChange={(e) => setNewItem(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Add requirement (e.g., 'Mentioned Privacy Policy')"
                            className="flex-1 bg-zinc-800 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-green-500/50 outline-none placeholder:text-gray-500"
                            autoFocus
                        />
                        <button
                            onClick={handleAdd}
                            disabled={!newItem.trim()}
                            className="bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-lg transition-colors disabled:opacity-50"
                        >
                            <Plus size={20} />
                        </button>
                    </div>

                    <div className="bg-zinc-950/50 rounded-xl border border-white/5 max-h-60 overflow-y-auto p-2 space-y-1">
                        {localItems.length === 0 ? (
                            <div className="text-center py-6 text-gray-500 text-xs italic">
                                No items added yet.
                            </div>
                        ) : (
                            localItems.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-zinc-900 rounded-lg group border border-transparent hover:border-white/5 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500/50" />
                                        <span className="text-sm text-gray-300 font-medium">{item}</span>
                                    </div>
                                    <button
                                        onClick={() => handleRemove(idx)}
                                        className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm text-gray-400 hover:text-white font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="bg-green-600 hover:bg-green-500 text-white px-5 py-2 rounded-lg text-sm font-bold shadow-lg shadow-green-900/20 transition-all"
                    >
                        Save Checklist
                    </button>
                </div>
            </div>
        </div>
    );
}
