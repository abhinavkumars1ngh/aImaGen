import { NextResponse } from 'next/server';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const { id } = params;

    const response = await fetch(`https://openrouter.ai/api/v1/videos/${id}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenRouter Video Polling Error:", data);
      throw new Error(data.error?.message || "Failed to poll video generation.");
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error polling video:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to poll video generation.' },
      { status: 500 }
    );
  }
}
