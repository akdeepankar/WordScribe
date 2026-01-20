import ytdl from "@distube/ytdl-core";

const AGENT = {
    headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cookie": "PREF=f2=8000000",
    }
};

export async function getVideoInfo(url: string) {
    try {
        const info = await ytdl.getInfo(url, { requestOptions: AGENT });
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
        requestOptions: AGENT
    });
}
