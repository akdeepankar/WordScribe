import { NextResponse } from "next/server";
import { getVideoInfo } from "../../lib/youtube";

export async function POST(req: Request) {
    try {
        const { url } = await req.json();

        if (!url) {
            return NextResponse.json({ error: "URL is required" }, { status: 400 });
        }

        const info = await getVideoInfo(url);

        return NextResponse.json(info);
    } catch (error) {
        console.error("YouTube Process Error:", error);
        return NextResponse.json(
            { error: `Failed to process video: ${(error as any).message}` },
            { status: 500 }
        );
    }
}
