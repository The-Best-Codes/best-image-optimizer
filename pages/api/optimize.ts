import { NextApiRequest, NextApiResponse } from "next";
import multiparty from "multiparty";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";
import rateLimiter from "@/utils/ratelimiter";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { success } = await rateLimiter.limit(
      (req.headers["x-forwarded-for"] as any) ||
        (req.connection.remoteAddress as any)
    );

    if (!success) {
      res.status(429).json({ error: "Too many requests" });
      return;
    }

    const form = new multiparty.Form();

    const [fields, files]: [any, any] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    const file = files.file?.[0];
    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const quality = parseInt(fields.quality?.[0] || "80");
    const width = fields.width?.[0] ? parseInt(fields.width[0]) : undefined;
    const height = fields.height?.[0] ? parseInt(fields.height[0]) : undefined;
    const lossless = fields.lossless?.[0] === "true";

    const fileId = uuidv4();
    const originalBuffer = await sharp(file.path).toBuffer();
    const originalSize = originalBuffer.length;

    let sharpInstance = sharp(originalBuffer);

    // Get original image metadata
    const metadata = await sharpInstance.metadata();
    const originalWidth = metadata.width;
    const originalHeight = metadata.height;

    // Resize if width or height is provided, otherwise use original dimensions
    if (width || height) {
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

    res.status(200).json({
      fileId,
      originalName: file.originalFilename,
      optimizedImage: `data:image/webp;base64,${optimizedBase64}`,
      compressionRatio,
    });
  } catch (error) {
    console.error("Error optimizing image:", error);
    res.status(500).json({ error: "Image optimization failed" });
  }
}
