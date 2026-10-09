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

export async function loadCompanyDrivers() {
  const profile = await getMyProfile();
  if (!profile?.company_id || profile.role !== "boss") return [];

  const { data: people, error } = await supabase
    .from("profiles")
    .select("id, full_name, role, company_id")
    .eq("company_id", profile.company_id);

  if (error) {
    console.error("loadCompanyDrivers:", error);
    return [];
  }

  const drivers = (people || []).filter((p) => p.role !== "boss");

  const { data: stays, error: staysError } = await supabase
    .from("stays")
    .select("user_id, start_date, end_date");

  if (staysError) console.error("company stays:", staysError);

  return drivers.map((driver) => ({
    ...driver,
    stays: (stays || [])
      .filter((s) => s.user_id === driver.id)
      .map((s) => ({
        start: s.start_date,
        end: s.end_date || new Date().toISOString().slice(0, 10),
      })),
  }));
}