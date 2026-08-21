import { supabase } from "../lib/supabase";

// Завантажити всі рейси поточного користувача
export async function loadTripsFromCloud() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("trips")
    .select("id, data, status")
    .eq("user_id", user.id);

  if (error) {
    console.error("loadTripsFromCloud:", error);
    return [];
  }

  return (data || []).map((row) => ({
    ...row.data,
    id: row.id,
    status: row.status || row.data?.status,
  }));
}

// Зберегти / оновити один рейс
export async function saveTripToCloud(trip) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !trip?.id) return;

  const { error } = await supabase.from("trips").upsert({
    id: trip.id,
    user_id: user.id,
    data: trip,
    status: trip.status || "active",
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.error("saveTripToCloud:", error);
  }
}

// Зберегти всі рейси (після змін)
export async function saveAllTripsToCloud(trips) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const rows = trips.map((trip) => ({
    id: trip.id,
    user_id: user.id,
    data: trip,
    status: trip.status || "active",
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase.from("trips").upsert(rows);

  if (error) {
    console.error("saveAllTripsToCloud:", error);
  }
}

// Видалити рейс
export async function deleteTripFromCloud(tripId) {
  const { error } = await supabase
    .from("trips")
    .delete()
    .eq("id", tripId);

  if (error) {
    console.error("deleteTripFromCloud:", error);
  }
}