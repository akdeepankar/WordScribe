"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, useRef } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { cn } from "../lib/utils";

// Dynamically import ReactPlayer to avoid hydration mismatch
const ReactPlayer = dynamic(() => import("react-player"), { ssr: false }) as any;

interface VideoPlayerProps {
    url: string;
    onProgress?: (state: { playedSeconds: number; played: number; loaded: number; loadedSeconds: number }) => void;
    seekTo?: number | null; // Pass a timestamp to seek to
    audioOnly?: boolean;
}

export default function VideoPlayer({ url, onProgress, seekTo, audioOnly = false }: VideoPlayerProps) {
    const [mounted, setMounted] = useState(false);
    const [playing, setPlaying] = useState(false);
    const [played, setPlayed] = useState(0); // 0 to 1
    const [duration, setDuration] = useState(0);
    const [seeking, setSeeking] = useState(false);
    const playerRef = useRef<any>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (seekTo !== null && seekTo !== undefined && playerRef.current) {
            playerRef.current.seekTo(seekTo, 'seconds');
            // Removed automatic setPlaying(true) to avoid race conditions
        }
    }, [seekTo]);

    const handlePlayPause = () => {
        setPlaying(!playing);
    };

    const handleProgress = (state: any) => {
        if (!seeking) {
            setPlayed(state.played);
        }
        if (onProgress) {
            onProgress(state);
        }
    };

    const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPlayed(parseFloat(e.target.value));
    };

    const handleSeekMouseDown = () => {
        setSeeking(true);
    };

    const handleSeekMouseUp = (e: any) => {
        setSeeking(false);
        playerRef.current?.seekTo(parseFloat(e.target.value));
    };

    const formatTime = (seconds: number) => {
        const date = new Date(seconds * 1000);
        const hh = date.getUTCHours();
        const mm = date.getUTCMinutes();
        const ss = date.getUTCSeconds().toString().padStart(2, "0");
        if (hh) {
            return `${hh}:${mm.toString().padStart(2, "0")}:${ss}`;
        }
        return `${mm}:${ss}`;
    };

    if (!mounted) return <div className="aspect-video w-full animate-pulse rounded-xl bg-gray-800" />;

    return (
        <div className={cn("w-full transition-all", audioOnly ? "bg-transparent" : "relative aspect-video overflow-hidden rounded-xl border border-white/10 bg-black shadow-2xl")}>
            {/* Hidden Player for Audio Mode, Visible for Video Mode */}
            <div className={cn(audioOnly ? "fixed w-px h-px opacity-0 pointer-events-none" : "w-full h-full")}>
                <ReactPlayer
                    ref={playerRef}
                    url={url}
                    width="100%"
                    height="100%"
                    playing={playing}
                    controls={!audioOnly}
                    onProgress={handleProgress}
                    onReady={(player: any) => setDuration(player.getDuration())}
                    onError={(e: any) => console.error("Media Error:", e)}
                    config={{
                        youtube: {
                            playerVars: { showinfo: 0, modestbranding: 1, playsinline: 1, origin: typeof window !== 'undefined' ? window.location.origin : undefined }
                        },
                        file: {
                            attributes: {
                                controlsList: 'nodownload'
                            }
                        }
                    } as any}
                />
            </div>

            {/* Custom Audio Controls */}
            {audioOnly && (
                <div className="w-full rounded-2xl border border-white/10 bg-zinc-900/90 backdrop-blur-md p-4 shadow-xl flex items-center gap-4 animate-in slide-in-from-top-4">
                    <button
                        onClick={handlePlayPause}
                        className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-black hover:scale-105 active:scale-95 transition-all shadow-lg shadow-white/10 shrink-0"
                    >
                        {playing ? <Pause className="fill-current w-5 h-5" /> : <Play className="fill-current ml-1 w-5 h-5" />}
                    </button>

                    <div className="flex-1 space-y-1">
                        <div className="flex justify-between text-xs font-medium text-gray-400">
                            <span>{formatTime(played * duration)}</span>
                            <span>{formatTime(duration)}</span>
                        </div>
                        <input
                            type="range"
                            min={0}
                            max={0.999999}
                            step="any"
                            value={played}
                            onMouseDown={handleSeekMouseDown}
                            onChange={handleSeekChange}
                            onMouseUp={handleSeekMouseUp}
                            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-red-500 hover:bg-white/20 transition-all"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
