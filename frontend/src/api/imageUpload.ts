// Internal helper for api/*.ts only — not imported by any component.
// Components keep producing base64 data URLs (via utils/image.ts) exactly as
// before; this is where that gets turned into a real multipart upload against
// the real backend.
import { apiClient } from "./client";

export function isDataUrl(value?: string | null): value is string {
  return typeof value === "string" && value.startsWith("data:");
}

export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl);
  return response.blob();
}

function extensionForMime(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}

export async function uploadImageBlob<T>(url: string, blob: Blob): Promise<T> {
  const formData = new FormData();
  formData.append("file", blob, `upload.${extensionForMime(blob.type)}`);
  // Clear the instance's default JSON Content-Type so the browser sets the
  // correct multipart boundary for this request.
  const response = await apiClient.post<T>(url, formData, { headers: { "Content-Type": undefined } });
  return response.data;
}
