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
    const [error, setError] = useState<string | null>(null);

    const playerRef = useRef<any>(null);
    const nativeAudioRef = useRef<HTMLAudioElement>(null);

    // Determine if we should use native audio tag
    const isYoutube = url.toLowerCase().includes("youtube") || url.includes("youtu.be");
    const useNativeAudio = audioOnly && !isYoutube;

    useEffect(() => {
        setMounted(true);
    }, []);

    // Sync Seek Props
    useEffect(() => {
        if (seekTo !== null && seekTo !== undefined) {
            if (useNativeAudio && nativeAudioRef.current) {
                nativeAudioRef.current.currentTime = seekTo;
            } else if (playerRef.current) {
                playerRef.current.seekTo(seekTo, 'seconds');
            }
        }
    }, [seekTo, useNativeAudio]);

    // Sync Playing State for Native Audio
    useEffect(() => {
        if (useNativeAudio && nativeAudioRef.current) {
            if (playing) {
                nativeAudioRef.current.play().catch(e => {
                    console.error("Native Play Error:", e);
                    setError("Error playing audio");
                });
            } else {
                nativeAudioRef.current.pause();
            }
        }
    }, [playing, useNativeAudio]);

    const handlePlayPause = () => {
        setPlaying(!playing);
    };

    // ReactPlayer Progress
    const handleProgress = (state: any) => {
        if (!seeking) {
            setPlayed(state.played);
        }
        if (onProgress) {
            onProgress(state);
        }
    };

    // Native Audio Progress
    const handleNativeTimeUpdate = () => {
        if (!nativeAudioRef.current || seeking) return;
        const current = nativeAudioRef.current.currentTime;
        const dur = nativeAudioRef.current.duration;
        if (dur > 0) {
            const progressState = { playedSeconds: current, played: current / dur, loaded: 0, loadedSeconds: 0 };
            setPlayed(progressState.played);
            if (onProgress) onProgress(progressState);
        }
    };

    const handleNativeLoadedMetadata = () => {
        if (nativeAudioRef.current) {
            setDuration(nativeAudioRef.current.duration);
            setError(null);
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
        const fraction = parseFloat(e.target.value);

        if (useNativeAudio && nativeAudioRef.current) {
            nativeAudioRef.current.currentTime = fraction * duration;
        } else {
            playerRef.current?.seekTo(fraction, 'fraction');
        }
    };

    const formatTime = (seconds: number) => {
        if (!seconds || isNaN(seconds)) return "00:00";
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

            {useNativeAudio ? (
                /* Native Audio Element (Hidden) */
                <audio
                    ref={nativeAudioRef}
                    src={url}
                    onTimeUpdate={handleNativeTimeUpdate}
                    onLoadedMetadata={handleNativeLoadedMetadata}
                    onEnded={() => setPlaying(false)}
                    onError={(e) => {
                        console.error("Native Audio Error:", e);
                        setError("Error loading audio file");
                    }}
                    className="hidden"
                />
            ) : (
                /* ReactPlayer (Hidden for Audio Mode, Visible for Video) */
                <div className={cn(audioOnly ? "fixed w-px h-px opacity-0 pointer-events-none" : "w-full h-full")}>
                    <ReactPlayer
                        ref={playerRef}
                        url={url}
                        width="100%"
                        height="100%"
                        playing={playing}
                        controls={!audioOnly}
                        onProgress={handleProgress}
                        onReady={(player: any) => {
                            setDuration(player.getDuration());
                            setError(null);
                        }}
                        onError={(e: any) => {
                            console.error("Media Error:", e);
                            setError("Error loading media");
                        }}
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
            )}

            {/* Custom Audio Controls */}
            {audioOnly && (
                <div className="w-full rounded-2xl border border-white/10 bg-zinc-900/90 backdrop-blur-md p-4 shadow-xl animate-in slide-in-from-top-4">
                    {error ? (
                        <div className="flex items-center gap-3 text-red-400 justify-center py-2 h-12">
                            <VolumeX className="w-5 h-5" />
                            <span className="text-sm font-medium">Unable to load audio</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-4">
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
            )}
        </div>
    );
}
