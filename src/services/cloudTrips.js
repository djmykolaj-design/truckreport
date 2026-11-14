import { supabase } from "../lib/supabase";
import { getMyProfile } from "./profile";

// Скільки днів рейс лежить у кошику, перш ніж його можна прибрати назавжди
export const TRASH_DAYS = 30;

// Якщо водій зараз у фірмі — рейс належить цій фірмі.
// Виняток: рейс явно створений в іншій фірмі — тоді він особистий.
// Якщо водій не в фірмі — рейс особистий.
function tripCompanyId(trip, profile) {
  if (!profile?.company_id) return null;

  const id = trip?.companyId || null;
  if (id && String(id) !== String(profile.company_id)) return null;

  return profile.company_id;
}

export async function loadTripsFromCloud() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("trips")
    .select("id, data, status, company_id")
    .eq("user_id", user.id)
    .is("deleted_at", null);

  if (error) {
    console.error("loadTripsFromCloud:", error);
    return [];
  }

  return (data || []).map((row) => ({
    ...row.data,
    id: row.id,
    companyId: row.company_id || null,
    status: row.status || row.data?.status,
  }));
}

export async function saveTripToCloud(trip) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !trip?.id) return;

  const profile = await getMyProfile();

  const { error } = await supabase.from("trips").upsert({
    id: trip.id,
    user_id: user.id,
    company_id: tripCompanyId(trip, profile),
    data: trip,
    status: trip.status || "active",
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.error("saveTripToCloud:", error);
  }
}

export async function saveAllTripsToCloud(trips) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const profile = await getMyProfile();

  const rows = trips.map((trip) => ({
    id: trip.id,
    user_id: user.id,
    company_id: tripCompanyId(trip, profile),
    data: trip,
    status: trip.status || "active",
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase.from("trips").upsert(rows);

  if (error) {
    console.error("saveAllTripsToCloud:", error);
  }
}

// М'яке видалення: рейс не стирається, а потрапляє в кошик.
// Назва збережена, щоб не міняти місця, де функція вже викликається.
export async function deleteTripFromCloud(tripId) {
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("trips")
    .update({ deleted_at: now, updated_at: now })
    .eq("id", tripId);

  if (error) {
    console.error("deleteTripFromCloud:", error);
    return false;
  }

  return true;
}

// Рейси з кошика (новіші зверху)
export async function loadDeletedTripsFromCloud() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("trips")
    .select("id, data, status, company_id, deleted_at")
    .eq("user_id", user.id)
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });

  if (error) {
    console.error("loadDeletedTripsFromCloud:", error);
    return [];
  }

  return (data || []).map((row) => ({
    ...row.data,
    id: row.id,
    companyId: row.company_id || null,
    status: row.status || row.data?.status,
    deletedAt: row.deleted_at,
  }));
}

// Повернути рейс із кошика
export async function restoreTripFromCloud(tripId) {
  const { error } = await supabase
    .from("trips")
    .update({ deleted_at: null, updated_at: new Date().toISOString() })
    .eq("id", tripId);

  if (error) {
    console.error("restoreTripFromCloud:", error);
    return false;
  }

  return true;
}

// Видалити назавжди (без можливості відновити)
export async function permanentlyDeleteTripFromCloud(tripId) {
  const { error } = await supabase
    .from("trips")
    .delete()
    .eq("id", tripId)
    .not("deleted_at", "is", null);

  if (error) {
    console.error("permanentlyDeleteTripFromCloud:", error);
    return false;
  }

  return true;
}

// Прибрати з кошика рейси, які лежать там довше TRASH_DAYS днів
export async function purgeOldDeletedTrips() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const limit = new Date(
    Date.now() - TRASH_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  const { error } = await supabase
    .from("trips")
    .delete()
    .eq("user_id", user.id)
    .not("deleted_at", "is", null)
    .lt("deleted_at", limit);

  if (error) {
    console.error("purgeOldDeletedTrips:", error);
  }
}