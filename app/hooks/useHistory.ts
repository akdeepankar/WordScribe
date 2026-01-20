import { useState, useEffect } from 'react';

export interface HistoryItem {
    id: string;
    url: string;
    title: string;
    thumbnail: string;
    date: string;
    chapters: any[];
    transcript: string;
    entities: any[];
    highlights: any[];
    sponsors: any[];
    qa: any[];
    words?: any[];
    language_code?: string;
    language_probability?: number;
}

export function useHistory() {
    const [history, setHistory] = useState<HistoryItem[]>([]);

    useEffect(() => {
        const saved = localStorage.getItem('protube_history');
        if (saved) {
            try {
                setHistory(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse history", e);
            }
        }
    }, []);

    const addToHistory = (item: Omit<HistoryItem, 'id' | 'date'>) => {
        const newItem: HistoryItem = {
            ...item,
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
        };

        // Check if URL already exists to avoid duplicates (optional, but good UX)
        const exists = history.find(h => h.url === item.url);
        if (exists) return;

        const newHistory = [newItem, ...history];
        setHistory(newHistory);
        localStorage.setItem('protube_history', JSON.stringify(newHistory));
    };

    const clearHistory = () => {
        setHistory([]);
        localStorage.removeItem('protube_history');
    };

    return { history, addToHistory, clearHistory };
}
