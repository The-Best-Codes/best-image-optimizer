"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  Download,
  ImageIcon,
  ImagePlus,
  Loader2,
  X,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { ReactCompareSlider } from "react-compare-slider";
import { toast } from "sonner";

export default function BestImageOptimizer() {
  const [file, setFile] = useState<File | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [quality, setQuality] = useState(50);
  const [width, setWidth] = useState<number | undefined>(undefined);
  const [height, setHeight] = useState<number | undefined>(undefined);
  const [lossless, setLossless] = useState(false);
  const [optimizedImage, setOptimizedImage] = useState<string | null>(null);
  const [compressionRatio, setCompressionRatio] = useState<number | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setOptimizedImage(null);
      setCompressionRatio(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setOriginalImage(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setFile(null);
      setOriginalImage(null);
      setOptimizedImage(null);
      setCompressionRatio(null);
    }
  };

  const clearImage = () => {
    setFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    setOriginalImage(null);
    setOptimizedImage(null);
    setCompressionRatio(null);
  };

  const optimizeImage = useCallback(async () => {
    if (!file) {
      toast.error("Please select an image file.");
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
      toast.success("Image optimized successfully!");
    } catch (error: any) {
      console.error("Optimization error:", error);
      toast.error(`Image optimization failed: ${error.message}`);
    } finally {
      setIsOptimizing(false);
    }
  }, [file, quality, width, height, lossless]);

  const downloadOptimizedImage = () => {
    if (optimizedImage) {
      const link = document.createElement("a");
      link.href = optimizedImage;
      link.download = "optimized_image.webp";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <h1 className="text-3xl font-semibold text-foreground mb-6">
        Best Image Optimizer
      </h1>
      <div className="lg:flex lg:space-x-4 w-full max-w-4xl">
        <div className="bg-card flex flex-col rounded-md border-border border-1 p-4 w-full lg:w-1/2">
          <div className="mb-6">
            <Label
              htmlFor="file"
              className="block text-sm font-medium text-muted-foreground"
            >
              Select Image
            </Label>
            <div className="flex items-center space-x-2">
              <Input
                type="file"
                id="file"
                accept="image/*"
                ref={fileInputRef as React.RefObject<HTMLInputElement>}
                onChange={handleFileChange}
                className="mt-1"
              />
              {file && (
                <Button
                  variant="outline"
                  size="icon"
                  className="mt-1 h-10 w-10"
                  onClick={clearImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="mb-2">
            <Label
              htmlFor="quality"
              className="block text-sm font-medium text-muted-foreground"
            >
              Quality
            </Label>
            <Slider
              id="quality"
              defaultValue={[quality]}
              min={1}
              max={100}
              step={1}
              onValueChange={(value) => setQuality(value[0])}
              className="mt-2"
            />
            <p className="text-sm text-muted-foreground mt-1">{quality}%</p>
          </div>

          <div className="mb-6 flex items-center space-x-2">
            <Switch
              id="lossless"
              checked={lossless}
              onCheckedChange={setLossless}
            />
            <Label
              htmlFor="lossless"
              className="text-sm font-medium text-muted-foreground"
            >
              Lossless
            </Label>
          </div>

          <div className="mb-6">
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
                    e.target.value === ""
                      ? undefined
                      : parseInt(e.target.value),
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
                    e.target.value === ""
                      ? undefined
                      : parseInt(e.target.value),
                  )
                }
              />
            </div>
          </div>

          <Button
            onClick={optimizeImage}
            disabled={isOptimizing || !file}
            className="w-full mt-auto"
          >
            {isOptimizing ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Optimizing...
              </>
            ) : (
              <>
                <ImagePlus className="size-4" />
                Optimize Image
              </>
            )}
          </Button>
        </div>

        <div className="w-full lg:w-1/2 mt-4 lg:mt-0 flex flex-col items-center justify-center p-4 rounded-md border-border border-1">
          {optimizedImage ? (
            <div className="w-full">
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Optimized Image
              </h2>
              <div className="flex flex-row justify-between items-center">
                <span>Before</span>
                <span>After</span>
              </div>
              {originalImage && optimizedImage && (
                <ReactCompareSlider
                  disabled={isOptimizing}
                  className={cn(
                    "border-border border-1 rounded-md",
                    isOptimizing ? "opacity-50 animate-pulse" : "",
                  )}
                  itemOne={
                    <img
                      src={originalImage}
                      alt="Original"
                      className="rounded-md object-contain w-full h-full"
                      style={{ maxHeight: "300px" }}
                    />
                  }
                  itemTwo={
                    <img
                      src={optimizedImage}
                      alt="Optimized"
                      className="rounded-md object-contain w-full h-full"
                      style={{ maxHeight: "300px" }}
                    />
                  }
                />
              )}
              <div className="flex justify-between items-center mt-2">
                {compressionRatio && (
                  <p className="text-base text-foreground">
                    {compressionRatio >= 1 ? (
                      `${compressionRatio.toFixed(1)}x smaller`
                    ) : (
                      <span>
                        <AlertTriangle className="text-yellow-500" /> Not
                        optimized
                      </span>
                    )}
                  </p>
                )}
                <Button
                  variant="default"
                  size="sm"
                  disabled={isOptimizing}
                  onClick={downloadOptimizedImage}
                >
                  <Download className="size-4" />
                  Download
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-6 flex flex-col items-center justify-center">
              <ImageIcon className="h-12 w-12 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mt-2">
                No image optimized yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
