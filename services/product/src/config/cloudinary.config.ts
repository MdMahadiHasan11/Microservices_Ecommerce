import { v2 as cloudinary } from "cloudinary";

import config from ".";

cloudinary.config({
  cloud_name: config.cloudinary.cloud_name,
  api_key: config.cloudinary.api_key,
  api_secret: config.cloudinary.api_secret,
});

export const cloudinaryUploadConfig = cloudinary;

// //Multer storage cloudinary
// //Amader folder -> image -> form data -> File -> Multer -> storage in cloudinary -> url ->  req.file  -> url  -> mongoose -> mongodb
