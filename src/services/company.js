import { supabase } from "../lib/supabase";

// Створення фірми, приєднання і вихід виконуються функціями в базі,
// а не прямими змінами профілю з браузера.

export async function createCompany(name) {
  const { data, error } = await supabase.rpc("create_company", {
    p_name: name,
  });

  if (error) {
    console.error(error);
    alert(error.message || "Не вдалося створити фірму");
    return null;
  }

  return data;
}

export async function joinCompany(code) {
  const { data, error } = await supabase.rpc("join_company", {
    p_code: code,
  });

  if (error) {
    console.error(error);
    if (String(error.message).includes("invalid_code")) {
      alert("Код фірми невірний");
    } else {
      alert(error.message || "Не вдалося приєднатися до фірми");
    }
    return null;
  }

  return data;
}

export async function becomeSolo() {
  const { error } = await supabase.rpc("leave_company");

  if (error) {
    console.error(error);
    alert(error.message || "Не вдалося зберегти режим");
    return null;
  }

  return true;
}

export async function leaveCompany() {
  const { error } = await supabase.rpc("leave_company");

  if (error) {
    console.error(error);
    alert(error.message || "Не вдалося від'єднатися");
    return null;
  }

  return true;
}

export async function getMyCompany() {
  const { data: sessionData } = await supabase.auth.getUser();
  const user = sessionData?.user;
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.company_id) return null;

  const { data: company } = await supabase
    .from("companies")
    .select("*")
    .eq("id", profile.company_id)
    .maybeSingle();

  return company;
}