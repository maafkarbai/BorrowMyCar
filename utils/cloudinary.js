import cloudinary from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

cloudinary.v2.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

export const storage = new CloudinaryStorage({
  cloudinary: cloudinary.v2,
  params: {
    folder: "borrowmycar",
    allowed_formats: ["jpg", "png"],
  },
});

export const cloudinaryUpload = cloudinary.v2;
