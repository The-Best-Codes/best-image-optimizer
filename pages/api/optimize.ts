import { NextApiRequest, NextApiResponse } from "next";
import multiparty from "multiparty";
import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";

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
    const form: any = new multiparty.Form({
      uploadDir: path.join(process.cwd(), "public", "uploads"),
    });

    // @ts-ignore
    const [fields, files]: any = await new Promise<
      // @ts-ignore
      [multiparty.Fields, multiparty.Files]
    >((resolve, reject) => {
      form.parse(req, (err: any, fields: any, files: any) => {
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
    const originalBuffer = await fs.readFile(file.path);
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

    const newFilename = `${fileId}.webp`;
    const newPath = path.join(form.uploadDir, newFilename);

    await fs.writeFile(newPath, optimizedBuffer);
    await fs.unlink(file.path); // Remove the original uploaded file

    res.status(200).json({
      fileId,
      originalName: file.originalFilename,
      optimizedUrl: `/uploads/${newFilename}`,
      compressionRatio,
    });
  } catch (error) {
    console.error("Error optimizing image:", error);
    res.status(500).json({ error: "Image optimization failed" });
  }
}
