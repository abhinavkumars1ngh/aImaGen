"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, ImageIcon, Loader2, Download, Type, Image as ImageLucide, Film } from "lucide-react";

export default function Home() {
  const [mode, setMode] = useState<"img2img" | "txt2img" | "img2vid">("img2img");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [denoising, setDenoising] = useState(0.75);
  const [guidance, setGuidance] = useState(7.5);
  const [isLoading, setIsLoading] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [resultMedia, setResultMedia] = useState<string | null>(null);
  const [resultType, setResultType] = useState<"image" | "video">("image");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const canGenerate = prompt && (mode === "txt2img" || mode === "img2vid" || image);

  const handleGenerate = async () => {
    if (!canGenerate) return;

    setIsLoading(true);
    setResultMedia(null);
    setErrorMsg(null);
    setIsPolling(false);

    const formData = new FormData();
    if (image) formData.append("image", image);
    formData.append("prompt", prompt);
    formData.append("negative_prompt", negativePrompt);
    formData.append("denoising_strength", denoising.toString());
    formData.append("guidance_scale", guidance.toString());
    formData.append("mode", mode);

    try {
      if (mode === "img2vid") {
        const response = await fetch("/api/video", { method: "POST", body: formData });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to start video generation");

        const jobId = data.id;
        if (!jobId) throw new Error("No Job ID returned for video generation");

        setIsPolling(true);

        while (true) { // poll every 5s until done
          await new Promise(resolve => setTimeout(resolve, 5000));
          const pollRes = await fetch(`/api/video/${jobId}`);
          const pollData = await pollRes.json();
          if (!pollRes.ok) throw new Error(pollData.error || "Failed to check video status");

          if (pollData.status === "completed") {
            setResultType("video");
            setResultMedia(`/api/video/${jobId}/content`);
            setIsPolling(false);
            break;
          } else if (pollData.status === "failed" || pollData.status === "error") {
            throw new Error(pollData.error || "Video generation failed");
          }
        }

      } else {
        const response = await fetch("/api/generate", { method: "POST", body: formData });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to generate image");

        if (data.result?.images?.[0]?.url) {
          setResultType("image");
          setResultMedia(data.result.images[0].url);
        } else if (data.result?.image?.url) {
          setResultType("image");
          setResultMedia(data.result.image.url);
        } else {
          throw new Error("Invalid response format from generation API");
        }
      }
    } catch (error) {
      console.error(error);
      setErrorMsg(error instanceof Error ? error.message : "An error occurred");
      setIsPolling(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white p-6 md:p-12 font-sans selection:bg-white/30">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl md:text-5xl font-light tracking-tight">aIma<span className="font-bold">Gen</span></h1>
          <p className="text-neutral-400 text-sm md:text-base max-w-xl">
            Generate what you like ;)
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 space-y-6">
            <div className="glass-panel p-6 space-y-6">

              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-300">Generation Mode</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setMode("img2img")}
                    className={`flex items-center justify-center space-x-2 px-2 py-2.5 rounded-xl text-xs font-medium transition-all ${
                      mode === "img2img"
                        ? "bg-white text-black"
                        : "bg-neutral-800/50 text-neutral-400 hover:text-white hover:bg-neutral-700/50"
                    }`}
                  >
                    <ImageLucide className="w-4 h-4" />
                    <span>Img → Img</span>
                  </button>
                  <button
                    onClick={() => setMode("txt2img")}
                    className={`flex items-center justify-center space-x-2 px-2 py-2.5 rounded-xl text-xs font-medium transition-all ${
                      mode === "txt2img"
                        ? "bg-white text-black"
                        : "bg-neutral-800/50 text-neutral-400 hover:text-white hover:bg-neutral-700/50"
                    }`}
                  >
                    <Type className="w-4 h-4" />
                    <span>Txt → Img</span>
                  </button>
                  <button
                    onClick={() => setMode("img2vid")}
                    className={`flex items-center justify-center space-x-2 px-2 py-2.5 rounded-xl text-xs font-medium transition-all ${
                      mode === "img2vid"
                        ? "bg-white text-black"
                        : "bg-neutral-800/50 text-neutral-400 hover:text-white hover:bg-neutral-700/50"
                    }`}
                  >
                    <Film className="w-4 h-4" />
                    <span>Img → Vid</span>
                  </button>
                </div>
                <p className="text-xs text-neutral-500">
                  {mode === "img2img"
                    ? "Upload a base image and describe changes (uses FLUX.2 Pro)"
                    : mode === "txt2img" 
                    ? "Generate from text only (uses FLUX.2 Pro)"
                    : "Turn an image or text into video (uses Grok Imagine Video)"}
                </p>
              </div>
              
              {(mode === "img2img" || mode === "img2vid") && (
                <div 
                  className={`border-2 border-dashed border-neutral-700 rounded-2xl p-8 text-center cursor-pointer hover:bg-neutral-800/50 transition-colors ${imagePreview ? 'bg-neutral-800/30' : ''}`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                  {imagePreview ? (
                    <div className="relative w-full h-48 rounded-xl overflow-hidden">
                      <img src={imagePreview} alt="Base model" className="object-contain w-full h-full" />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center space-y-4 py-8">
                      <UploadCloud className="w-10 h-10 text-neutral-400" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Click or drag base image here {mode === "img2vid" && "(Optional)"}</p>
                        <p className="text-xs text-neutral-500">Supports JPG, PNG (Max 5MB)</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-300">
                    {mode === "img2img" ? "Edit Instructions" : "Prompt"}
                  </label>
                  <textarea 
                    className="input-field min-h-[100px] resize-none" 
                    placeholder={
                      mode === "img2img"
                        ? "Describe the changes you want to make..."
                        : mode === "txt2img"
                        ? "Describe the full image (e.g. a fashion model, studio lighting, editorial photo)..."
                        : "Describe the video motion (e.g. model walking down runway)..."
                    }
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                  />
                </div>
                {mode !== "img2vid" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-300">Negative Prompt</label>
                    <textarea 
                      className="input-field min-h-[80px] resize-none" 
                      placeholder="(Optional) things to avoid..."
                      value={negativePrompt}
                      onChange={(e) => setNegativePrompt(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {errorMsg && (
                <div className="bg-red-900/30 border border-red-800 rounded-xl px-4 py-3 text-sm text-red-300">
                  {errorMsg}
                </div>
              )}

              <button 
                className="primary-button flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleGenerate}
                disabled={isLoading || !canGenerate}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{isPolling ? "Rendering Video..." : "Generating..."}</span>
                  </>
                ) : (
                  <span>{mode === "img2vid" ? "Generate Video" : "Generate Collection"}</span>
                )}
              </button>

            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="glass-panel h-full min-h-[600px] p-6 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium">Result Studio</h2>
                {resultMedia && (
                  <a 
                    href={resultMedia} 
                    download={`generated-collection.${resultType === "video" ? "mp4" : "png"}`} 
                    target="_blank"
                    className="flex items-center space-x-2 text-sm text-neutral-300 hover:text-white bg-neutral-800/50 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </a>
                )}
              </div>
              
              <div className="flex-1 bg-neutral-950/50 rounded-xl border border-neutral-800 flex items-center justify-center overflow-hidden relative">
                {resultMedia ? (
                  resultType === "video" ? (
                    <video src={resultMedia} controls autoPlay loop className="object-contain w-full h-full" />
                  ) : (
                    <img src={resultMedia} alt="Generated" className="object-contain w-full h-full" />
                  )
                ) : isLoading ? (
                  <div className="flex flex-col items-center space-y-4 text-neutral-500">
                    <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
                    <p className="text-sm">
                      {isPolling ? "Video generation takes a few minutes. Please wait..." : "Weaving digital threads..."}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-4 text-neutral-600">
                    <ImageIcon className="w-12 h-12 opacity-50" />
                    <p className="text-sm font-medium">No media generated yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
