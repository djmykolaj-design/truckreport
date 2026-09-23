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
    return { id: user.id, role: "driver", email: user.email };
  }

  if (!data) {
    const { data: created } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        role: "driver",
        full_name: user.email,
      })
      .select()
      .single();

    return created || { id: user.id, role: "driver", email: user.email };
  }

  return { ...data, email: user.email };
}

export function isBoss(profile) {
  return profile?.role === "boss";
}