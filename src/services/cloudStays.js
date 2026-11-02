import { supabase } from "../lib/supabase";

const keyOf = (start, end) => `${start}_${end || "open"}`;

// Повертає масив перебувань або null, якщо завантажити не вдалося.
export async function loadStaysFromCloud() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("stays")
    .select("id, start_date, end_date")
    .eq("user_id", user.id)
    .order("start_date", { ascending: true });

  if (error) {
    console.error("loadStaysFromCloud:", error);
    return null;
  }

  const map = new Map();
  (data || []).forEach((row) => {
    map.set(keyOf(row.start_date, row.end_date), {
      id: row.id,
      start: row.start_date,
      end: row.end_date || null,
    });
  });

  return Array.from(map.values());
}

// Змінює в хмарі лише різницю: спершу додає нове, потім прибирає застаріле.
export async function saveStaysToCloud(stays) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { data: existing, error: readError } = await supabase
    .from("stays")
    .select("id, start_date, end_date")
    .eq("user_id", user.id);

  if (readError) {
    console.error("read stays:", readError);
    return false;
  }

  const wanted = new Map();
  (stays || []).forEach((s) => {
    if (!s?.start) return;
    wanted.set(keyOf(s.start, s.end), {
      user_id: user.id,
      start_date: s.start,
      end_date: s.end || null,
    });
  });

  const existingKeys = new Set();
  const obsoleteIds = [];

  (existing || []).forEach((row) => {
    const key = keyOf(row.start_date, row.end_date);
    if (wanted.has(key) && !existingKeys.has(key)) {
      existingKeys.add(key);
    } else {
      obsoleteIds.push(row.id); // зайвий або дублікат
    }
  });

  const toInsert = [...wanted.entries()]
    .filter(([key]) => !existingKeys.has(key))
    .map(([, row]) => row);

  if (toInsert.length) {
    const { error } = await supabase.from("stays").insert(toInsert);
    if (error) {
      console.error("insert stays:", error);
      return false; // нічого не видаляємо, якщо вставка не вдалась
    }
  }

  if (obsoleteIds.length) {
    const { error } = await supabase
      .from("stays")
      .delete()
      .in("id", obsoleteIds);
    if (error) {
      console.error("delete stays:", error);
      return false;
    }
  }

  return true;
}