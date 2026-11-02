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
    cloudBackup: true,
  },
  pro: {
    fullTripHistory: true,
    export: true,
    analytics: true,
    cloudBackup: true,
  },
  business: {
    fullTripHistory: true,
    export: true,
    analytics: true,
    cloudBackup: true,
  },
  owner: {
    fullTripHistory: true,
    export: true,
    analytics: true,
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

export async function getMyPlan() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { plan: "free", until: null, label: PLAN_LABELS.free };

  const { data, error } = await supabase
    .from("profiles")
    .select("plan, plan_until")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("getMyPlan:", error);
    return { plan: "free", until: null, label: PLAN_LABELS.free };
  }

  const plan = effectivePlan(data);

  return {
    plan,
    until: data?.plan_until || null,
    label: PLAN_LABELS[plan] || PLAN_LABELS.free,
  };
}