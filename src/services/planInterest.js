import { supabase } from "../lib/supabase";

// Що користувач уже відмітив: { pro: {plan, vehicles}, business: {...} }
export async function getMyInterests() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return {};

  const { data, error } = await supabase
    .from("plan_interest")
    .select("plan, vehicles")
    .eq("user_id", user.id);

  if (error) {
    console.error("getMyInterests:", error);
    return {};
  }

  const result = {};
  for (const row of data || []) result[row.plan] = row;
  return result;
}

export async function saveInterest(plan, vehicles = null) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { error } = await supabase
    .from("plan_interest")
    .upsert({ user_id: user.id, plan, vehicles }, { onConflict: "user_id,plan" });

  if (error) {
    console.error("saveInterest:", error);
    return false;
  }

  return true;
}

export async function removeInterest(plan) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { error } = await supabase
    .from("plan_interest")
    .delete()
    .eq("user_id", user.id)
    .eq("plan", plan);

  if (error) {
    console.error("removeInterest:", error);
    return false;
  }

  return true;
}