import { NextResponse } from 'next/server';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    const response = await fetch(`https://openrouter.ai/api/v1/videos/${id}`, {
      headers: { "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}` },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Failed to poll video generation.");
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to poll video generation.' },
      { status: 500 }
    );
  }
}
