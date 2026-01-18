import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, Sparkles } from "lucide-react";
import { cn } from "../lib/utils";

interface Message {
    role: "user" | "assistant";
    content: string;
}

interface ChatPanelProps {
    transcript: string;
    apiKey: string;
}

export default function ChatPanel({ transcript, apiKey }: ChatPanelProps) {
    const [messages, setMessages] = useState<Message[]>([
        { role: "assistant", content: "Hi! Ask me anything about this video." }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: "smooth"
            });
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        if (!apiKey) {
            setMessages(prev => [...prev, { role: "assistant", content: "Please set your OpenAI API key in Settings to use the chatbot." }]);
            return;
        }

        const userMsg = input.trim();
        setInput("");
        setMessages(prev => [...prev, { role: "user", content: userMsg }]);
        setIsLoading(true);

        try {
            const history = messages.map(m => ({ role: m.role, content: m.content }));
            history.push({ role: "user", content: userMsg });

            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: history,
                    transcript,
                    apiKey
                })
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.error);

            setMessages(prev => [...prev, { role: "assistant", content: data.message.content }]);
        } catch (error: any) {
            console.error(error);
            setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I encountered an error answering that." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-zinc-900 text-white">
            {/* Header */}
            <div className="flex items-center gap-2 p-4 border-b border-white/10 bg-white/5">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <h2 className="font-semibold text-lg">AI Assistant</h2>
            </div>

            {/* Messages Area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-4"
            >
                {messages.map((m, i) => (
                    <div
                        key={i}
                        className={cn(
                            "flex gap-3 max-w-[85%]",
                            m.role === "user" ? "ml-auto flex-row-reverse" : ""
                        )}
                    >
                        <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1",
                            m.role === "user" ? "bg-blue-600" : "bg-purple-600"
                        )}>
                            {m.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                        </div>
                        <div className={cn(
                            "p-3 rounded-2xl text-sm leading-relaxed",
                            m.role === "user"
                                ? "bg-blue-600 text-white rounded-tr-none"
                                : "bg-white/10 text-gray-200 rounded-tl-none"
                        )}>
                            {m.content}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex gap-3 max-w-[85%]">
                        <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center shrink-0 mt-1">
                            <Bot className="w-4 h-4" />
                        </div>
                        <div className="bg-white/10 p-3 rounded-2xl rounded-tl-none flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                            <span className="text-xs text-gray-400">Thinking...</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSubmit} className="p-4 border-t border-white/10 bg-zinc-950">
                <div className="relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask about the video..."
                        className="w-full bg-zinc-800 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500 placeholder:text-gray-500"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:bg-transparent disabled:text-gray-500 text-white rounded-lg transition-colors"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                </div>
                {!apiKey && (
                    <p className="text-[10px] text-red-400 mt-2 text-center">
                        API Key required in Settings
                    </p>
                )}
            </form>
        </div>
    );
}
