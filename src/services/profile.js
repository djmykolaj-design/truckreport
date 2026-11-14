import { supabase } from "../lib/supabase";

export const ROLE_LABELS = {
  solo: "Самостійний водій",
  driver: "Водій",
  boss: "Керівник",
  deputy: "Заступник керівника",
  logist: "Логіст",
  mechanic: "Механік",
};

// Ролі, які керівник може призначати працівникам
export const ASSIGNABLE_ROLES = ["driver", "logist", "mechanic", "deputy"];

// Хто що може в фірмі. Це лише для інтерфейсу: справжній захист у базі (RLS).
const PERMISSIONS = {
  // Водійський кабінет
  "trips.own": ["solo", "driver"],
    "breakdown.report": ["driver", "logist"],

  // Кабінет фірми
  "fleet.view": ["boss", "deputy", "logist", "mechanic"],
  "fleet.manage": ["boss", "deputy"], // додавати й видаляти машини
  "fleet.service": ["boss", "deputy", "mechanic"], // ТО, ремонти, суми ремонтів
  "fleet.repairStatus": ["boss", "deputy", "logist", "mechanic"], // поставити в ремонт
  "breakdown.view": ["boss", "deputy", "logist", "mechanic"],

  "drivers.view": ["boss", "deputy", "logist"], // водії, їхні рейси, гроші рейсу, шенген
  "drivers.manage": ["boss", "deputy"],

  "documents.view": ["boss", "deputy", "logist", "mechanic"],
  "documents.drivers": ["boss", "deputy", "logist"], // документи водіїв
  "documents.manage": ["boss", "deputy"],

  "finance.view": ["boss", "deputy"], // фінанси фірми
  "team.manage": ["boss", "deputy"], // заявки, ролі працівників
  "company.settings": ["boss"],
  "plan.manage": ["boss"],
};

const OFFICE_ROLES = ["boss", "deputy", "logist", "mechanic"];

export async function getMyProfile() {
  const { data: sessionData } = await supabase.auth.getUser();
  const user = sessionData?.user;
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("profile load:", error);
    return {
      id: user.id,
      role: "driver",
      email: user.email,
      setup_done: false,
    };
  }

  if (!data) {
    const { data: created, error: createError } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        role: "driver",
        full_name: user.email,
        setup_done: false,
      })
      .select()
      .single();

    if (createError) {
      console.error("profile create:", createError);
      return {
        id: user.id,
        role: "driver",
        email: user.email,
        setup_done: false,
      };
    }

    return { ...created, email: user.email };
  }

  return { ...data, email: user.email };
}

export function isBoss(profile) {
  return profile?.role === "boss";
}

// Керівник або заступник: керують працівниками, водіями, документами
export function isManager(profile) {
  return profile?.role === "boss" || profile?.role === "deputy";
}

// Працює в кабінеті фірми (а не у водійському кабінеті)
export function isOfficeRole(profile) {
  return OFFICE_ROLES.includes(profile?.role);
}

export function hasCompany(profile) {
  return Boolean(profile?.company_id);
}

export function roleLabel(profile) {
  return ROLE_LABELS[profile?.role] || "";
}

// Чи може ця людина виконувати дію
export function roleCan(profile, permission) {
  if (!profile) return false;
  const allowed = PERMISSIONS[permission];
  if (!allowed) return false;
  return allowed.includes(profile.role);
}

export function needsSetup(profile) {
  return !profile?.setup_done;
}