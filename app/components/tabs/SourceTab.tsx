import { FileAudio } from "lucide-react";
import VideoPlayer from "../VideoPlayer";
import { getYouTubeId } from "../../lib/utils";

interface SourceTabProps {
    videoUrl: string;
    isYoutube: boolean;
    seekToTime: number | null;
}

export default function SourceTab({ videoUrl, isYoutube, seekToTime }: SourceTabProps) {
    return (
        <div className="rounded-xl overflow-hidden bg-black/40 border border-white/10 shadow-2xl aspect-video relative group">
            {isYoutube ? (
                <iframe
                    src={`https://www.youtube.com/embed/${getYouTubeId(videoUrl)}?autoplay=0&controls=1&start=${Math.floor(seekToTime || 0)}`}
                    className="w-full h-full"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
            ) : (
                <VideoPlayer url={videoUrl} seekTo={seekToTime} audioOnly={true} />
            )}
        </div>
    );
}
