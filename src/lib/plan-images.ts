import { screenshotFields } from "./screenshots";
export function planImages(formData: FormData, userId: string) {
  return screenshotFields(formData, userId).map(({ objectKey, mimeType, size, userId }) => ({ objectKey, mimeType, size, userId }));
}
