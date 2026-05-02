import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { env } from "../../config/env.js";
import { Readable } from "stream";

// Configure Cloudinary
if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET
  });
}

// Use memory storage for multer - we'll upload to Cloudinary ourselves
const storage = multer.memoryStorage();

export const productUpload = multer({
  storage: storage,
  limits: {
    fileSize: env.MAX_UPLOAD_SIZE_MB * 1024 * 1024
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  }
});

export async function uploadProductImage(file) {
  if (!file) return null;

  if (!env.CLOUDINARY_CLOUD_NAME) {
    console.warn("Cloudinary not configured. Using placeholder URL.");
    return "https://via.placeholder.com/400x400?text=Product+Image";
  }

  try {
    // Upload to Cloudinary from memory buffer
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "farmerpremiummeatshop/products",
          resource_type: "auto",
          format: "webp"
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      // Convert buffer to stream and pipe to Cloudinary
      Readable.from(file.buffer).pipe(stream);
    });

    return result.secure_url;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw new Error(`Image upload failed: ${error.message}`);
  }
}
