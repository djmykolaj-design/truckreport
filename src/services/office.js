import { supabase } from "../lib/supabase";
import { getMyProfile } from "./profile";

export async function loadFleetTrips() {
  const profile = await getMyProfile();
  if (!profile?.company_id) return [];

  const { data, error } = await supabase
    .from("trips")
    .select("id, user_id, company_id, data, status, updated_at")
    .eq("company_id", profile.company_id)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("loadFleetTrips:", error);
    return [];
  }

  return (data || []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    companyId: row.company_id,
    status: row.status || row.data?.status,
    updatedAt: row.updated_at,
    ...(row.data || {}),
  }));
}