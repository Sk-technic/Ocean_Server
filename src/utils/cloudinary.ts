import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface UploadOptions {
  folder?: string;
  resource_type?: "image" | "video" | "audio";
}

/**
 * Uploads a file to Cloudinary
 * @param filePath - Path to the local file
 * @param options - Optional upload settings
 * @returns secure_url of uploaded file
 */

export const uploadToCloudinary = async (filePath: string,options: UploadOptions = {}): Promise<UploadApiResponse> => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: "UserMedia",
      resource_type: options.resource_type || "auto",
    });
    
    fs.unlinkSync(filePath);

    return result;
  } catch (error) {
    throw new Error(`Cloudinary upload failed: ${error}`);
  }
};

export const uploadMediaCloudinary = async (
  filePath: string,
  options: UploadOptions = {}
): Promise<UploadApiResponse> => {
  try {
    const media = await cloudinary.uploader.upload(filePath, {
      folder: "media",
      resource_type: options.resource_type || "auto",
    });

    fs.unlinkSync(filePath);
    return media; // Return single object, not array
  } catch (error) {
    throw new Error(`Cloudinary upload failed: ${error}`);
  }
};

/**
 * Deletes a file from Cloudinary by public_id
 * @param publicId - Cloudinary public_id of file
 */

export const deleteFromCloudinary = async (url: string) => {
  try {
    if (!url) throw new Error("Invalid Cloudinary URL");

    // Extract versioned part & determine folder + filename
    const urlParts = url.split("/upload/");
    if (urlParts.length < 2) throw new Error("Invalid Cloudinary URL format");

    // folder + publicId + extension
    const afterUpload = urlParts[1]; // e.g. v1762792140/messages/xyzabc.mp4

    // Remove version number (v12345/)
    const parts = afterUpload.split("/");
    if (parts[0].startsWith("v")) {
      parts.shift(); // remove version
    }

    // remaining parts now contain folder + file
    const fileWithExt = parts.pop()!;                // xyzabc.mp4
    const folderPath = parts.join("/");              // messages (optional)

    const fileName = fileWithExt.split(".")[0];      // xyzabc
    const public_id = folderPath
      ? `${folderPath}/${fileName}`
      : fileName;

    console.log("🆔 Final Cloudinary public_id:", public_id);

    // Detect resource type automatically from URL
    const resource_type =
      url.includes("/video/") ? "video" :
      url.includes("/image/") ? "image" :
      "raw";  // fallback for pdf, zip, docs, gifs, audio etc.

    console.log("📂 Detected Resource Type:", resource_type);

    // Finally delete from Cloudinary
    const result = await cloudinary.uploader.destroy(public_id, {
      resource_type,
      invalidate: true,
    });

    console.log("🗑️ Cloudinary delete result:", result);

    return result;
  } catch (error) {
    console.error("❌ Cloudinary delete failed:", error);
    throw new Error(`Cloudinary delete failed: ${error}`);
  }
};

/**
 * ✅ Cloudinary image optimization utility (backend-side)
 */
export const optimizeCloudinaryUrl = (
  url: string,
  width = 200,
  height = 200,
  crop: "fill" | "fit" | "thumb" = "fill"
): string => {
  try {
    if (!url || !url.includes("/upload/")) return url;

    // Inject Cloudinary transformations dynamically
    return url.replace(
      "/upload/",
      `/upload/f_auto,q_auto,w_${width},h_${height},c_${crop}/`
    );
  } catch (err) {
    console.error("❌ Cloudinary optimization failed:", err);
    return url;
  }
};