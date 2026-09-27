import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const ALLOWED_MIME_TYPES = new Map([
  ["image/png", "png"],
  ["image/jpeg", "jpg"],
  ["image/webp", "webp"],
]);

// Signature bytes so we don't trust the client-declared Content-Type alone.
const MAGIC_BYTES = [
  { mime: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47] },
  { mime: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
  { mime: "image/webp", bytes: [0x52, 0x49, 0x46, 0x46], offset: 0, webp: true },
];

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

let client = null;

function storageClient() {
  if (client) return client;
  const url = String(process.env.SUPABASE_URL || "").trim();
  const serviceKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  if (!url || !serviceKey) {
    const error = new Error("Supabase Storage가 설정되지 않았습니다. SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY를 확인해주세요.");
    error.statusCode = 503;
    throw error;
  }
  client = createClient(url, serviceKey, { auth: { persistSession: false } });
  return client;
}

function detectMimeFromBytes(buffer) {
  if (buffer.length >= 4 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return "image/png";
  }
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  ) {
    return "image/webp";
  }
  return null;
}

export function validateImageFile(file) {
  if (!file) {
    const error = new Error("업로드할 이미지 파일이 없습니다.");
    error.statusCode = 400;
    throw error;
  }
  if (file.size > MAX_IMAGE_BYTES) {
    const error = new Error("이미지 파일은 5MB 이하만 업로드할 수 있습니다.");
    error.statusCode = 413;
    throw error;
  }
  const declared = ALLOWED_MIME_TYPES.has(file.mimetype) ? file.mimetype : null;
  const actual = detectMimeFromBytes(file.buffer);
  if (!declared || !actual || declared !== actual) {
    const error = new Error("PNG, JPEG, WEBP 이미지만 업로드할 수 있습니다.");
    error.statusCode = 415;
    throw error;
  }
  return { mime: actual, extension: ALLOWED_MIME_TYPES.get(actual) };
}

export async function uploadImage({ userId, projectId, purpose, file }) {
  const { extension, mime } = validateImageFile(file);
  const bucket = String(process.env.SUPABASE_STORAGE_BUCKET || "project-assets");
  const storageKey = `${userId}/${projectId}/${purpose}/${randomUUID()}.${extension}`;

  const supabase = storageClient();
  const { error } = await supabase.storage.from(bucket).upload(storageKey, file.buffer, {
    contentType: mime,
    upsert: false,
  });
  if (error) {
    const wrapped = new Error("이미지 업로드에 실패했습니다.");
    wrapped.statusCode = 502;
    wrapped.cause = error;
    throw wrapped;
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(storageKey);
  return { imageUrl: data.publicUrl, storageKey };
}

export async function deleteImage(storageKey) {
  if (!storageKey) return;
  const bucket = String(process.env.SUPABASE_STORAGE_BUCKET || "project-assets");
  const supabase = storageClient();
  await supabase.storage.from(bucket).remove([storageKey]);
}
