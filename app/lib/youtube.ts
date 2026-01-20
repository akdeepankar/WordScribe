import ytdl from "@distube/ytdl-core";

export async function getVideoInfo(url: string) {
    try {
        const info = await ytdl.getInfo(url);
        // Find best thumbnail (largest width)
        const thumbnail = info.videoDetails.thumbnails.sort((a, b) => b.width - a.width)[0]?.url || "";

        return {
            title: info.videoDetails.title,
            thumbnail: thumbnail,
            duration: info.videoDetails.lengthSeconds,
            videoId: info.videoDetails.videoId,
        };
    } catch (e: any) {
        throw new Error(`Failed to fetch video metadata: ${e.message}`);
    }
}

export async function getAudioStream(url: string) {
    // High quality audio, prevent ended stream
    return ytdl(url, {
        filter: 'audioonly',
        quality: 'highestaudio',
        dlChunkSize: 0, // Disable chunking for reliable stream in serverless
    });
}
