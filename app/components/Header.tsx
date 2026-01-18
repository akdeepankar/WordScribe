import { Sparkles } from "lucide-react";

export default function Header() {
    return (
        <header className="flex flex-col items-center justify-center space-y-4 py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-xl shadow-blue-500/20">
                <Sparkles className="h-8 w-8 text-white" />
            </div>
            <div className="space-y-2">
                <h1 className="bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent dark:from-white dark:to-gray-400 sm:text-5xl">
                    Streamline
                </h1>
                <p className="max-w-[40ch] text-lg text-gray-500 dark:text-gray-400">
                    Auto-generate YouTube chapters from any video using AI
                </p>
            </div>
        </header>
    );
}
