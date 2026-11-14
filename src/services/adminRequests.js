import { supabase } from "../lib/supabase";

export async function isOwner() {
  const { data, error } = await supabase.rpc("is_owner");
  if (error) return false;
  return data === true;
}

export async function loadPlanRequests() {
  const { data, error } = await supabase.rpc("admin_plan_requests");
  if (error) {
    console.error("loadPlanRequests:", error.message);
    return [];
  }
  return data || [];
}