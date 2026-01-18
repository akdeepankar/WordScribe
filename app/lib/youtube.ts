import { spawn } from "child_process";
import path from "path";

const YTDLP_PATH = path.join(process.cwd(), "yt-dlp");

export async function getVideoInfo(url: string) {
    return new Promise((resolve, reject) => {
        const process = spawn(YTDLP_PATH, [
            "--dump-single-json",
            "--no-warnings",
            "--prefer-free-formats",
            "--youtube-skip-dash-manifest",
            url
        ]);

        let stdout = "";
        let stderr = "";

        process.stdout.on("data", (data) => stdout += data.toString());
        process.stderr.on("data", (data) => stderr += data.toString());

        process.on("close", (code) => {
            if (code !== 0) {
                console.error("yt-dlp error:", stderr);
                return reject(new Error("Failed to fetch video metadata: " + stderr));
            }
            try {
                const info = JSON.parse(stdout);
                resolve({
                    title: info.title,
                    thumbnail: info.thumbnail,
                    duration: info.duration,
                    videoId: info.id,
                });
            } catch (e) {
                reject(e);
            }
        });
    });
}

export function getAudioStream(url: string) {
    const process = spawn(YTDLP_PATH, [
        "-o", "-",
        "-f", "bestaudio",
        "--no-warnings",
        url
    ]);

    if (process.stderr) {
        process.stderr.on('data', (data) => console.log('yt-dlp stderr:', data.toString()));
    }

    return process.stdout;
}
