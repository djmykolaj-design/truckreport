import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const BUCKET = "documents";
const TTL_MS = 50 * 60 * 1000; // посилання живе 60 хв, оновлюємо за 50

const cache = new Map();

export async function getDocumentUrl(doc) {
  if (!doc) return "";
  if (!doc.storagePath) return doc.url || "";

  const hit = cache.get(doc.storagePath);
  if (hit && hit.expires > Date.now()) return hit.url;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(doc.storagePath, 3600);

  if (error || !data?.signedUrl) {
    console.error(error);
    return doc.url || "";
  }

  cache.set(doc.storagePath, {
    url: data.signedUrl,
    expires: Date.now() + TTL_MS,
  });

  return data.signedUrl;
}

// Для компонентів: повертає посилання, коли воно готове
export function useDocumentUrl(doc) {
  const [url, setUrl] = useState(doc?.url || "");

  useEffect(() => {
    let alive = true;

    getDocumentUrl(doc).then((value) => {
      if (alive) setUrl(value);
    });

    return () => {
      alive = false;
    };
  }, [doc?.storagePath, doc?.url]);

  return url;
}