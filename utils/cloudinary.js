// utils/cloudinary.js (Enhanced)
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import dotenv from "dotenv";

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Enhanced storage configuration with organized folders and transformations
export const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // Determine folder based on file field and user role
    let folder = "borrowmycar/misc";

    if (file.fieldname === "images") {
      folder = "borrowmycar/cars";
    } else if (
      ["drivingLicense", "emiratesId", "visa", "passport"].includes(
        file.fieldname
      )
    ) {
      folder = "borrowmycar/documents";
    } else if (file.fieldname === "profileImage") {
      folder = "borrowmycar/profiles";
    }

    // Generate unique filename
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);

    return {
      folder: folder,
      public_id: `${file.fieldname}-${uniqueSuffix}`,
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      transformation: [
        {
          quality: "auto:good",
          fetch_format: "auto",
        },
      ],
      // Add different transformations based on file type
      ...(file.fieldname === "profileImage" && {
        transformation: [
          { width: 300, height: 300, crop: "fill", gravity: "face" },
          { quality: "auto:good", fetch_format: "auto" },
        ],
      }),
      ...(file.fieldname === "images" && {
        transformation: [
          { width: 1200, height: 800, crop: "limit" },
          { quality: "auto:good", fetch_format: "auto" },
        ],
      }),
    };
  },
});

// Health check for Cloudinary
export const checkCloudinaryHealth = async () => {
  try {
    const result = await cloudinary.api.ping();
    return {
      status: "connected",
      response: result,
    };
  } catch (error) {
    return {
      status: "error",
      error: error.message,
    };
  }
};

export { cloudinary };
