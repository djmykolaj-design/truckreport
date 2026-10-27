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

// Акаунти, які вступили у фірму (для прив'язки до водія зі списку)
export async function loadCompanyAccounts() {
  const profile = await getMyProfile();
  if (!profile?.company_id) return [];

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("company_id", profile.company_id);

  if (error) {
    console.error("loadCompanyAccounts:", error);
    return [];
  }
  return data || [];
}

// Список водіїв фірми, який веде шеф
export async function loadCompanyDrivers() {
  const profile = await getMyProfile();
  if (!profile?.company_id || profile.role !== "boss") return [];

  const { data: list, error } = await supabase
    .from("company_drivers")
    .select("id, full_name, user_id")
    .eq("company_id", profile.company_id)
    .order("full_name", { ascending: true });

  if (error) {
    console.error("loadCompanyDrivers:", error);
    return [];
  }

  const ids = (list || []).map((d) => d.user_id).filter(Boolean);
  let stays = [];

  if (ids.length) {
    const { data, error: staysError } = await supabase
      .from("stays")
      .select("user_id, start_date, end_date")
      .in("user_id", ids);

    if (staysError) console.error("company stays:", staysError);
    stays = data || [];
  }

  return (list || []).map((driver) => ({
    ...driver,
    stays: stays
      .filter((s) => s.user_id === driver.user_id)
      .map((s) => ({
        start: s.start_date,
        end: s.end_date || new Date().toISOString().slice(0, 10),
      })),
  }));
}

export async function addCompanyDriver(fullName, userId) {
  const { error } = await supabase.from("company_drivers").insert({
    full_name: String(fullName || "").trim(),
    user_id: userId || null,
  });

  if (error) {
    console.error("addCompanyDriver:", error);
    alert("Не вдалося додати водія: " + error.message);
    return false;
  }
  return true;
}

export async function updateCompanyDriver(id, patch) {
  const { data, error } = await supabase
    .from("company_drivers")
    .update(patch)
    .eq("id", id)
    .select("id");

  if (error || !data?.length) {
    console.error("updateCompanyDriver:", error);
    alert("Не вдалося зберегти зміни");
    return false;
  }
  return true;
}

export async function deleteCompanyDriver(id) {
  const { error } = await supabase.from("company_drivers").delete().eq("id", id);

  if (error) {
    console.error("deleteCompanyDriver:", error);
    alert("Не вдалося видалити: " + error.message);
    return false;
  }
  return true;
}