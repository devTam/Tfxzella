import { v2 as cloudinary } from "cloudinary";

export function chartImageUrl(objectKey: string) {
  return cloudinary.url(objectKey, {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    type: "authenticated", sign_url: true, secure: true,
  });
}
