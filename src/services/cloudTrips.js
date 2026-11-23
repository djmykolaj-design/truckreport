import { supabase } from "../lib/supabase";
import { getMyProfile } from "./profile";

// Скільки днів рейс лежить у кошику, перш ніж його можна прибрати назавжди
export const TRASH_DAYS = 30;

// Номер без пробілів, у верхньому регістрі; кирилична й латинська літери
// однакового вигляду (напр. «ВО» і «BO») вважаються однаковими.
const PLATE_LOOKALIKES = {
  А: "A", В: "B", Е: "E", К: "K", М: "M", Н: "H",
  О: "O", Р: "P", С: "C", Т: "T", Х: "X", І: "I",
};

function plateKey(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, "")
    .toUpperCase()
    .split("")
    .map((ch) => PLATE_LOOKALIKES[ch] || ch)
    .join("");
}

// Номери автопарку фірми (кеш на хвилину, щоб не питати базу при кожному збереженні)
let fleetCache = { companyId: null, at: 0, plates: null };

async function loadCompanyPlates(companyId) {
  const fresh =
    fleetCache.companyId === companyId && Date.now() - fleetCache.at < 60000;

  if (fresh) return fleetCache.plates;

  const { data, error } = await supabase
    .from("fleet_vehicles")
    .select("plate_number")
    .eq("company_id", companyId);

  if (error) {
    console.error("loadCompanyPlates:", error);
    return null;
  }

  const plates = new Set(
    (data || []).map((v) => plateKey(v.plate_number)).filter(Boolean)
  );

  fleetCache = { companyId, at: Date.now(), plates };
  return plates;
}

// Рейс належить фірмі, лише якщо його тягач або причіп є в автопарку цієї фірми.
// Інакше рейс особистий (company_id = null).
// Якщо автопарк прочитати не вдалося (plates = null), статус рейсу не змінюємо.
function tripCompanyId(trip, profile, plates) {
  if (!profile?.company_id) return null;

  const id = trip?.companyId || null;
  if (id && String(id) !== String(profile.company_id)) return null;

  if (!plates) {
    return id && String(id) === String(profile.company_id)
      ? profile.company_id
      : null;
  }

  const inFleet =
    plates.has(plateKey(trip?.truck)) || plates.has(plateKey(trip?.trailer));

  return inFleet ? profile.company_id : null;
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
  const plates = profile?.company_id
    ? await loadCompanyPlates(profile.company_id)
    : null;

  const { error } = await supabase.from("trips").upsert({
    id: trip.id,
    user_id: user.id,
    company_id: tripCompanyId(trip, profile, plates),
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
  const plates = profile?.company_id
    ? await loadCompanyPlates(profile.company_id)
    : null;

  const rows = trips.map((trip) => ({
    id: trip.id,
    user_id: user.id,
    company_id: tripCompanyId(trip, profile, plates),
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

// Рейси колег, де поточний користувач вказаний напарником (лише перегляд).
// Тримаємо окремо від власних рейсів, щоб вони не потрапили в збереження.
export async function loadSharedTripsFromCloud() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("trips")
    .select("id, user_id, data, status, company_id")
    .neq("user_id", user.id)
    .eq("data->>codriverUserId", user.id)
    .is("deleted_at", null);

  if (error) {
    console.error("loadSharedTripsFromCloud:", error);
    return [];
  }

  return (data || []).map((row) => ({
    ...row.data,
    id: row.id,
    ownerId: row.user_id,
    companyId: row.company_id || null,
    status: row.status || row.data?.status,
  }));
}