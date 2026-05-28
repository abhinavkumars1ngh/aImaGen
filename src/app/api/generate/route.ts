import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image') as File | null;
    const prompt = formData.get('prompt') as string;
    const negativePrompt = formData.get('negative_prompt') as string;
    const mode = formData.get('mode') as string || 'img2img';

    if (!prompt) {
      return NextResponse.json({ error: 'A prompt is required.' }, { status: 400 });
    }

    const fullPrompt = negativePrompt
      ? `${prompt}\n\nNegative prompt: ${negativePrompt}`
      : prompt;

    let messages: any[] = [
      {
        role: "user",
        content: []
      }
    ];

    if (mode === 'img2img') {
      if (!imageFile) {
         return NextResponse.json({ error: 'An image is required for Image-to-Image mode.' }, { status: 400 });
      }
      const arrayBuffer = await imageFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString('base64');
      const dataUrl = `data:${imageFile.type};base64,${base64}`;

      messages[0].content.push({
        type: "image_url",
        image_url: {
          url: dataUrl
        }
      });
      messages[0].content.push({
        type: "text",
        text: fullPrompt
      });
    } else {
      messages[0].content.push({
        type: "text",
        text: fullPrompt
      });
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "StudioAI",
      },
      body: JSON.stringify({
        model: "black-forest-labs/flux.2-pro",
        messages: messages,
        modalities: ["image"]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenRouter API Error:", data);
      throw new Error(data.error?.message || "Failed to generate image via OpenRouter.");
    }

    const message = data.choices?.[0]?.message;
    
    // OpenRouter returns images in the `images` array of the message object
    if (message?.images?.[0]?.image_url?.url) {
       return NextResponse.json({
         result: {
           images: [{ url: message.images[0].image_url.url }]
         }
       });
    } else if (message?.content) {
      throw new Error("Received text instead of an image from OpenRouter. This usually happens if the model doesn't support the image modality properly or ignored the modality flag.");
    } else {
       console.log("Raw OpenRouter response message:", message);
       throw new Error("Invalid response format from OpenRouter generation API.");
    }

  } catch (error: any) {
    console.error('Error generating image:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate image.' },
      { status: 500 }
    );
  }
}
