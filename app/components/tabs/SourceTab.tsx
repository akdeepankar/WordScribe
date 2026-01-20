import { FileAudio } from "lucide-react";
import VideoPlayer from "../VideoPlayer";
import { getYouTubeId } from "../../lib/utils";

interface SourceTabProps {
    videoUrl: string;
    isYoutube: boolean;
    seekToTime: number | null;
    languageCode?: string;
    languageProbability?: number;
}

export default function SourceTab({ videoUrl, isYoutube, seekToTime, languageCode, languageProbability }: SourceTabProps) {
    return (
        <div className="flex flex-col gap-4 w-full h-full">
            {/* Metadata Header - styled like TranscriptTab search bar */}
            {languageCode && (
                <div className="flex items-center justify-between gap-2 bg-zinc-950 p-3 rounded-xl border border-white/5 sticky top-0 z-10 backdrop-blur-xl shadow-lg">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                            <FileAudio className="w-4 h-4 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-px leading-none">Detected Language</p>
                            <div className="flex items-baseline gap-2 leading-none">
                                <span className="text-sm font-bold text-gray-200">{languageCode.toUpperCase()}</span>
                                {languageProbability && (
                                    <span className="text-[10px] text-green-500/80 font-mono">
                                        {(languageProbability * 100).toFixed(0)}%
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="relative group flex-1 min-h-0">
                {isYoutube ? (
                    <div className="rounded-xl overflow-hidden bg-black/40 border border-white/10 shadow-2xl w-full h-full relative">
                        <iframe
                            src={`https://www.youtube.com/embed/${getYouTubeId(videoUrl)}?autoplay=0&controls=1&start=${Math.floor(seekToTime || 0)}`}
                            className="w-full h-full"
                            allowFullScreen
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        />
                    </div>
                ) : (
                    <div className="w-full h-full flex flex-col justify-start p-6 rounded-xl bg-black/20 border border-white/5 min-h-[150px]">
                        <VideoPlayer url={videoUrl} seekTo={seekToTime} audioOnly={true} />
                    </div>
                )}
            </div>
        </div>
    );
}
