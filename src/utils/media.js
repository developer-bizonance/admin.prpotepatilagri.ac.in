
const DEFAULT_MEDIA_BASE_URL = import.meta.env.VITE_MEDIA_DOWNLOAD_URL || "http://localhost:4001";

export const getMediaUrl = (mediaId, baseUrl = DEFAULT_MEDIA_BASE_URL) => {
  if (!mediaId) return null;

  if (
    typeof mediaId === "string" &&
    (mediaId.startsWith("http") ||
      mediaId.startsWith("blob:") ||
      mediaId.startsWith("data:"))
  ) {
    return mediaId;
  }

  const cleanId = String(mediaId).replace(/\\/g, "/").replace(/^\/+/, "");
  
  
  return `${baseUrl}/uploads/${cleanId}`;
};