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

  return (data || []).map((row) => ({
    id: row.id,
    start: row.start_date,
    end: row.end_date,
  }));
}

export async function saveStaysToCloud(stays) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  // Простий варіант: видалити всі свої і записати заново
  await supabase.from("stays").delete().eq("user_id", user.id);

  if (!stays.length) return;

  const rows = stays.map((s) => ({
    user_id: user.id,
    start_date: s.start,
    end_date: s.end,
  }));

  const { error } = await supabase.from("stays").insert(rows);

  if (error) {
    console.error("saveStaysToCloud:", error);
  }
}