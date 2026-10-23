/** Validate metadata before attaching private chart uploads to a daily plan. */
export function planImages(formData: FormData, userId: string) {
  const keys = formData.getAll("attachmentKey");
  const types = formData.getAll("attachmentMime");
  const sizes = formData.getAll("attachmentSize");
  if (keys.length > 3 || types.length !== keys.length || sizes.length !== keys.length) {
    throw new Error("Attach up to 3 expectation charts with complete image details");
  }
  return keys.map((key, index) => {
    const objectKey = String(key), mimeType = String(types[index]), size = Number(sizes[index]);
    const prefix = `tfxzella/users/${userId}/`;
    if (!objectKey.startsWith(prefix) || !/^[a-zA-Z0-9_-]+$/.test(objectKey.slice(prefix.length)) ||
        !["image/png", "image/jpeg", "image/webp"].includes(mimeType) ||
        !Number.isInteger(size) || size <= 0 || size > 5_000_000) {
      throw new Error("Invalid expectation chart. Upload a PNG, JPEG, or WebP up to 5MB from your account.");
    }
    return { objectKey, mimeType, size, userId };
  });
}
