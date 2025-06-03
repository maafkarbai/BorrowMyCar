import { cloudinaryUpload } from "./cloudinary.js";

export const uploadImagesToCloud = async (files) => {
  const urls = [];

  for (const file of files) {
    const res = await cloudinaryUpload.uploader.upload(file.path, {
      folder: "borrowmycar",
    });
    urls.push(res.secure_url);
  }

  return urls;
};

export const deleteImagesFromCloud = async (publicIds) => {
  const results = [];

  for (const id of publicIds) {
    const res = await cloudinaryUpload.uploader.destroy(id);
    results.push(res);
  }

  return results;
};
