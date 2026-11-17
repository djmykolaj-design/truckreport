import { supabase } from "../lib/supabase";

export const FREE_TRIP_LIMIT = 3;

export const PLAN_LABELS = {
  free: "Безкоштовний",
  pro: "Pro",
  business: "Business",
  owner: "Власник",
};

// Що дозволено на кожному плані
const FEATURES = {
  free: {
    fullTripHistory: false,
    export: false,
    analytics: false,
    schengenPlanner: false,
    cloudBackup: true,
  },
  pro: {
    fullTripHistory: true,
    export: true,
    analytics: true,
    schengenPlanner: true,
    cloudBackup: true,
  },
  business: {
    fullTripHistory: true,
    export: true,
    analytics: true,
    schengenPlanner: true,
    cloudBackup: true,
  },
  owner: {
    fullTripHistory: true,
    export: true,
    analytics: true,
    schengenPlanner: true,
    cloudBackup: true,
  },
};

// Реальний план з урахуванням терміну дії
export function effectivePlan(profile) {
  const plan = profile?.plan || "free";
  if (plan === "free") return "free";

  const until = profile?.plan_until ? new Date(profile.plan_until) : null;
  if (until && until.getTime() < Date.now()) return "free";

  return plan;
}

export function can(plan, feature) {
  return Boolean(FEATURES[plan]?.[feature]);
}

const FREE_RESULT = { plan: "free", until: null, label: PLAN_LABELS.free };

// План користувача з урахуванням фірми: працівники отримують план шефа,
// а власний платний план людини теж враховується (береться вищий).
export async function getMyPlan() {
  const { data, error } = await supabase.rpc("my_effective_plan");

  if (error) {
    console.error("getMyPlan:", error);
    return FREE_RESULT;
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.plan) return FREE_RESULT;

  const plan = effectivePlan({ plan: row.plan, plan_until: row.plan_until });

  return {
    plan,
    until: row.plan_until || null,
    label: PLAN_LABELS[plan] || PLAN_LABELS.free,
  };
}