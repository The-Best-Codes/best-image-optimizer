"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";

export default function BestImageOptimizer() {
  const [file, setFile] = useState<File | null>(null);
  const [quality, setQuality] = useState(80);
  const [width, setWidth] = useState<number | undefined>(undefined);
  const [height, setHeight] = useState<number | undefined>(undefined);
  const [lossless, setLossless] = useState(false);
  const [optimizedImage, setOptimizedImage] = useState<string | null>(null);
  const [compressionRatio, setCompressionRatio] = useState<number | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setFile(selectedFile || null);
  };

  const optimizeImage = async () => {
    if (!file) {
      alert("Please select an image file.");
      return;
    }

    setIsOptimizing(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("quality", quality.toString());
      if (width) formData.append("width", width.toString());
      if (height) formData.append("height", height.toString());
      formData.append("lossless", lossless.toString());

      const response = await fetch("/api/optimize", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setOptimizedImage(data.optimizedImage);
      setCompressionRatio(data.compressionRatio);
    } catch (error: any) {
      console.error("Optimization error:", error);
      alert(`Image optimization failed: ${error.message}`);
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <h1 className="text-3xl font-semibold text-foreground mb-6">
        Best Image Optimizer
      </h1>
      <div className="bg-card rounded-lg shadow-md p-6 w-full max-w-md">
        <div className="mb-4">
          <Label
            htmlFor="file"
            className="block text-sm font-medium text-muted-foreground"
          >
            Select Image
          </Label>
          <Input
            type="file"
            id="file"
            accept="image/*"
            onChange={handleFileChange}
            className="mt-1"
          />
        </div>

        <div className="mb-4">
          <Label
            htmlFor="quality"
            className="block text-sm font-medium text-muted-foreground"
          >
            Quality
          </Label>
          <Slider
            id="quality"
            defaultValue={[quality]}
            max={100}
            step={1}
            onValueChange={(value) => setQuality(value[0])}
            className="mt-2"
          />
          <p className="text-sm text-muted-foreground mt-1">{quality}%</p>
        </div>

        <div className="mb-4">
          <Label className="block text-sm font-medium text-muted-foreground">
            Dimensions (optional)
          </Label>
          <div className="flex space-x-2 mt-1">
            <Input
              type="number"
              id="width"
              placeholder="Width"
              className="w-1/2"
              value={width === undefined ? "" : width.toString()}
              onChange={(e) =>
                setWidth(
                  e.target.value === "" ? undefined : parseInt(e.target.value),
                )
              }
            />
            <Input
              type="number"
              id="height"
              placeholder="Height"
              className="w-1/2"
              value={height === undefined ? "" : height.toString()}
              onChange={(e) =>
                setHeight(
                  e.target.value === "" ? undefined : parseInt(e.target.value),
                )
              }
            />
          </div>
        </div>

        <div className="mb-4 flex items-center space-x-2">
          <Label
            htmlFor="lossless"
            className="text-sm font-medium text-muted-foreground"
          >
            Lossless
          </Label>
          <Switch
            id="lossless"
            checked={lossless}
            onCheckedChange={setLossless}
          />
        </div>

        <Button onClick={optimizeImage} disabled={isOptimizing}>
          {isOptimizing ? "Optimizing..." : "Optimize Image"}
        </Button>

        {optimizedImage && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Optimized Image
            </h2>
            <img
              src={optimizedImage}
              alt="Optimized"
              className="rounded-md shadow-md"
            />
            {compressionRatio && (
              <p className="text-sm text-muted-foreground mt-2">
                Compression Ratio: {compressionRatio.toFixed(2)}x
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
