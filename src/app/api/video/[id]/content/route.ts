import { NextResponse } from 'next/server';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    const response = await fetch(`https://openrouter.ai/api/v1/videos/${id}/content`, {
      headers: { "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}` },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to download video." },
        { status: response.status }
      );
    }

    return new NextResponse(response.body, { // proxy video stream to client
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "video/mp4",
        "Content-Disposition": "inline",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch video content.' },
      { status: 500 }
    );
  }
}
