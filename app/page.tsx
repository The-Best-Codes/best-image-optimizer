"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Download, Loader2 } from "lucide-react";
import Image from "next/image";
import { useCallback, useState } from "react";
import {
  ReactCompareSlider,
  ReactCompareSliderImage,
} from "react-compare-slider";
import { Toaster, toast } from "react-hot-toast";

export default function Home() {
  const [quality, setQuality] = useState(50);
  const [width, setWidth] = useState<number | undefined>(undefined);
  const [height, setHeight] = useState<number | undefined>(undefined);
  const [file, setFile] = useState<File | null>(null);
  const [optimizedImage, setOptimizedImage] = useState<string | null>(null);
  const [compressionRatio, setCompressionRatio] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lossless, setLossless] = useState(false);
  const [originalObjectURL, setOriginalObjectURL] = useState<string | null>(
    null,
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        const newFile = e.target.files[0];
        setFile(newFile);
        setOptimizedImage(null);
        setCompressionRatio(null);
        if (originalObjectURL) {
          URL.revokeObjectURL(originalObjectURL);
        }
        setOriginalObjectURL(URL.createObjectURL(newFile));
      }
    },
    [originalObjectURL],
  );

  const handleOptimize = async () => {
    if (!file) return;

    setIsLoading(true);
    setOptimizedImage(null);
    setCompressionRatio(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("quality", quality.toString());
    if (width) formData.append("width", width.toString());
    if (height) formData.append("height", height.toString());
    formData.append("lossless", lossless.toString());

    try {
      const response = await fetch("/api/optimize", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Optimization failed");
      }

      const result = await response.json();
      setOptimizedImage(result.optimizedImage);
      setCompressionRatio(result.compressionRatio);
      toast.success("Image optimized successfully!");
    } catch (error) {
      console.error("Error optimizing image:", error);
      toast.error("Failed to optimize image. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <Toaster position="top-right" />
      <h1 className="text-4xl font-bold mb-8 text-center">Image Optimizer</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="quality">Quality: {quality}%</Label>
            <Slider
              id="quality"
              min={1}
              max={100}
              step={1}
              value={[quality]}
              onValueChange={(value) => setQuality(value[0])}
              disabled={lossless}
            />
          </div>

          <div className="flex items-center space-x-3">
            <Switch
              id="lossless"
              checked={lossless}
              onCheckedChange={setLossless}
            />
            <Label htmlFor="lossless">Lossless compression</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="width">Width (optional)</Label>
            <Input
              id="width"
              type="number"
              placeholder="Width in pixels"
              value={width || ""}
              onChange={(e) =>
                setWidth(e.target.value ? parseInt(e.target.value) : undefined)
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="height">Height (optional)</Label>
            <Input
              id="height"
              type="number"
              placeholder="Height in pixels"
              value={height || ""}
              onChange={(e) =>
                setHeight(e.target.value ? parseInt(e.target.value) : undefined)
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">Upload Image</Label>
            <Input
              id="file"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>

          <Button
            onClick={handleOptimize}
            disabled={!file || isLoading}
            className="w-full py-6 text-lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Optimizing...
              </>
            ) : (
              "Optimize Image"
            )}
          </Button>
        </div>

        {!isLoading && optimizedImage && (
          <div className="space-y-6">
            <h2 className="text-3xl font-semibold">Result</h2>
            <div className="bg-green-100 border border-green-300 rounded-md p-6">
              <p className="text-xl font-medium text-green-800">
                Your file is now{" "}
                {((compressionRatio as number) * 100)?.toFixed(2)}% smaller!
              </p>
            </div>
            <div className="w-full aspect-video relative">
              <ReactCompareSlider
                itemOne={
                  <ReactCompareSliderImage
                    src={originalObjectURL!}
                    alt="Original"
                  />
                }
                itemTwo={
                  <ReactCompareSliderImage
                    src={optimizedImage}
                    alt="Optimized"
                  />
                }
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-medium mb-3">Original</h3>
                <Image
                  src={originalObjectURL!}
                  alt="Original"
                  width={400}
                  height={400}
                  style={{ width: "100%", height: "auto" }}
                  unoptimized
                />
              </div>
              <div>
                <h3 className="text-xl font-medium mb-3">Optimized</h3>
                <Image
                  src={optimizedImage}
                  alt="Optimized"
                  width={400}
                  height={400}
                  style={{ width: "100%", height: "auto" }}
                  unoptimized
                />
              </div>
            </div>
            <a
              href={optimizedImage}
              download="optimized_image.webp"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Download className="mr-2" />
              Download Optimized Image
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
