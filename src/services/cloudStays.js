import { supabase } from "../lib/supabase";

export async function loadStaysFromCloud() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("stays")
    .select("id, start_date, end_date")
    .eq("user_id", user.id)
    .order("start_date", { ascending: true });

  if (error) {
    console.error("loadStaysFromCloud:", error);
    return [];
  }

  const map = new Map();
  (data || []).forEach((row) => {
    const key = `${row.start_date}_${row.end_date}`;
    map.set(key, {
      id: row.id,
      start: row.start_date,
      end: row.end_date,
    });
  });

  return Array.from(map.values());
}

export async function saveStaysToCloud(stays) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { error: delError } = await supabase
    .from("stays")
    .delete()
    .eq("user_id", user.id);

  if (delError) {
    console.error("delete stays:", delError);
    return;
  }

  if (!stays?.length) return;

  const seen = new Set();
  const rows = [];

  stays.forEach((s) => {
    if (!s?.start || !s?.end) return;
    const key = `${s.start}_${s.end}`;
    if (seen.has(key)) return;
    seen.add(key);
    rows.push({
      user_id: user.id,
      start_date: s.start,
      end_date: s.end,
    });
  });

  if (!rows.length) return;

  const { error } = await supabase.from("stays").insert(rows);
  if (error) console.error("saveStaysToCloud:", error);
}