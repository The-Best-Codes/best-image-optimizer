import { NextResponse } from "next/server";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const quality = parseInt((formData.get("quality") as string) || "80");
    const width = formData.get("width")
      ? parseInt(formData.get("width") as string)
      : undefined;
    const height = formData.get("height")
      ? parseInt(formData.get("height") as string)
      : undefined;
    const lossless = formData.get("lossless") === "true";

    const fileId = uuidv4();
    const originalBuffer = await file.arrayBuffer();
    const originalSize = originalBuffer.byteLength;

    let sharpInstance = sharp(Buffer.from(originalBuffer));

    // Get original image metadata
    const metadata = await sharpInstance.metadata();
    const originalWidth = metadata.width;
    const originalHeight = metadata.height;

    // Resize if width or height is provided, otherwise use original dimensions
    if (width || height) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const resizeOptions: any = {};
      if (width) resizeOptions.width = width;
      if (height) resizeOptions.height = height;
      if (width && !height) resizeOptions.height = null;
      if (height && !width) resizeOptions.width = null;
      sharpInstance = sharpInstance.resize(resizeOptions);
    } else {
      sharpInstance = sharpInstance.resize(originalWidth, originalHeight);
    }

    // Convert to webp
    const optimizedBuffer = await sharpInstance
      .webp({ quality, lossless })
      .toBuffer();

    const optimizedSize = optimizedBuffer.length;
    const compressionRatio = originalSize / optimizedSize;

    // Convert optimized image to base64
    const optimizedBase64 = optimizedBuffer.toString("base64");

    return NextResponse.json({
      fileId,
      originalName: file.name,
      optimizedImage: `data:image/webp;base64,${optimizedBase64}`,
      compressionRatio,
    });
  } catch (error) {
    console.error("Error optimizing image:", error);
    return NextResponse.json(
      { error: "Image optimization failed" },
      { status: 500 },
    );
  }
}
