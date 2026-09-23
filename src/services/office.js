import { supabase } from "../lib/supabase";

export async function loadFleetTrips() {
  const { data, error } = await supabase
    .from("trips")
    .select("id, user_id, data, status, updated_at")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("loadFleetTrips:", error);
    return [];
  }

  return (data || []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    status: row.status || row.data?.status,
    updatedAt: row.updated_at,
    ...(row.data || {}),
  }));
}