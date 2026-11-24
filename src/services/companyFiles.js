import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const BUCKET = "company-files";
const MAX_SIDE = 1600;
const TTL_MS = 50 * 60 * 1000; // посилання живе 60 хв, оновлюємо за 50

const cache = new Map();

// Фото стискаємо, PDF лишаємо як є
async function prepareFile(file) {
  if (!file) throw new Error("Файл не вибрано");

  if (file.type === "application/pdf") {
    return { blob: file, ext: "pdf", type: "application/pdf" };
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("Можна додати лише фото або PDF");
  }

  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("Не вдалося прочитати фото. Спробуйте формат JPG або PNG.");
  }

  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d").drawImage(bitmap, 0, 0, width, height);
  if (bitmap.close) bitmap.close();

  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.82)
  );

  if (!blob) throw new Error("Не вдалося обробити фото");

  return { blob, ext: "jpg", type: "image/jpeg" };
}

// folder: "vehicles" | "drivers" | "firm". Повертає шлях файлу в сховищі.
export async function uploadCompanyFile(companyId, folder, file) {
  if (!companyId) throw new Error("Немає фірми");

  const { blob, ext, type } = await prepareFile(file);
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const path = `${companyId}/${folder}/${name}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { contentType: type, upsert: false });

  if (error) throw error;

  return path;
}

export async function removeCompanyFile(path) {
  if (!path) return;

  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) console.error("removeCompanyFile:", error);
}

export async function getCompanyFileUrl(path) {
  if (!path) return "";

  const hit = cache.get(path);
  if (hit && hit.expires > Date.now()) return hit.url;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 3600);

  if (error || !data?.signedUrl) {
    console.error("getCompanyFileUrl:", error);
    return "";
  }

  cache.set(path, { url: data.signedUrl, expires: Date.now() + TTL_MS });
  return data.signedUrl;
}

// Для компонентів: повертає посилання, коли воно готове
export function useCompanyFileUrl(path) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    let alive = true;

    if (!path) {
      setUrl("");
      return undefined;
    }

    getCompanyFileUrl(path).then((value) => {
      if (alive) setUrl(value);
    });

    return () => {
      alive = false;
    };
  }, [path]);

  return url;
}