import { NextResponse } from 'next/server';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const { id } = params;

    const response = await fetch(`https://openrouter.ai/api/v1/videos/${id}/content`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to download video from OpenRouter." },
        { status: response.status }
      );
    }

    // Proxy the video stream directly to the client
    return new NextResponse(response.body, {
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "video/mp4",
        "Content-Disposition": "inline",
      },
    });
  } catch (error: any) {
    console.error('Error fetching video content:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch video content.' },
      { status: 500 }
    );
  }
}
