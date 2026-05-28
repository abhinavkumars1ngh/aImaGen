import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image') as File | null;
    const prompt = formData.get('prompt') as string;
    
    // For video generation, OpenRouter uses a different payload structure.
    const payload: any = {
      model: "x-ai/grok-imagine-video", // Cheapest video model
      prompt: prompt || "A video based on the provided image.",
    };

    if (imageFile) {
      const arrayBuffer = await imageFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString('base64');
      const dataUrl = `data:${imageFile.type};base64,${base64}`;

      payload.frame_images = [
        {
          type: "image_url",
          image_url: {
            url: dataUrl
          },
          frame_type: "first_frame"
        }
      ];
    }

    const response = await fetch("https://openrouter.ai/api/v1/videos", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "StudioAI",
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenRouter Video API Error:", data);
      throw new Error(data.error?.message || "Failed to start video generation.");
    }

    // data should contain { id: "job_id", polling_url: "..." }
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Error starting video generation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to start video generation.' },
      { status: 500 }
    );
  }
}
