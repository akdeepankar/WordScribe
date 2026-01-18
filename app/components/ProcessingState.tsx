import { Loader2 } from "lucide-react";

interface ProcessingStateProps {
    status: string;
}

export default function ProcessingState({ status }: ProcessingStateProps) {
    return (
        <div className="flex w-full max-w-2xl flex-col items-center justify-center space-y-6 rounded-3xl border border-dashed border-gray-200 bg-gray-50/50 py-16 text-center backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
            <div className="relative flex h-16 w-16 items-center justify-center">
                <div className="absolute inset-0 animate-ping rounded-full bg-red-500/20" />
                <Loader2 className="h-8 w-8 animate-spin text-red-500" />
            </div>
            <div className="space-y-1">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Analyzing Video</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{status}</p>
            </div>
        </div>
    );
}
