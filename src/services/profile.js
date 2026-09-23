import { supabase } from "../lib/supabase";

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

export function needsSetup(profile) {
  return !profile?.setup_done;
}