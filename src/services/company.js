import { supabase } from "../lib/supabase";

async function currentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) return null;
  return data.user;
}

async function saveProfile(userId, patch) {
  const { error } = await supabase
    .from("profiles")
    .upsert({
      id: userId,
      ...patch,
    });

  return error;
}

export async function createCompany(name) {
  const user = await currentUser();
  if (!user) {
    alert("Немає сесії. Увійди знову.");
    return null;
  }

  const invite_code = Math.random().toString(36).slice(2, 8).toUpperCase();

  const { data, error } = await supabase
    .from("companies")
    .insert({
      name: name.trim(),
      owner_id: user.id,
      invite_code,
    })
    .select()
    .single();

  if (error) {
    console.error(error);
    alert(error.message || "Не вдалося створити фірму");
    return null;
  }

  const profileError = await saveProfile(user.id, {
    company_id: data.id,
    role: "boss",
    full_name: user.email,
    setup_done: true,
  });

  if (profileError) {
    console.error(profileError);
    alert(profileError.message || "Фірму створено, але профіль не оновився");
    return null;
  }

  return data;
}

export async function joinCompany(code) {
  const user = await currentUser();
  if (!user) {
    alert("Немає сесії. Увійди знову.");
    return null;
  }

  const { data: company, error } = await supabase
    .from("companies")
    .select("*")
    .eq("invite_code", code.trim().toUpperCase())
    .maybeSingle();

  if (error || !company) {
    alert("Код фірми невірний");
    return null;
  }

  const profileError = await saveProfile(user.id, {
    company_id: company.id,
    role: "driver",
    full_name: user.email,
    setup_done: true,
  });

  if (profileError) {
    console.error(profileError);
    alert(profileError.message || "Не вдалося приєднати профіль");
    return null;
  }

  return company;
}

export async function becomeSolo() {
  const user = await currentUser();
  if (!user) {
    alert("Немає сесії. Увійди знову.");
    return null;
  }

  const error = await saveProfile(user.id, {
    company_id: null,
    role: "solo",
    full_name: user.email,
    setup_done: true,
  });

  if (error) {
    console.error(error);
    alert(error.message || "Не вдалося зберегти режим");
    return null;
  }

  return true;
}

export async function getMyCompany() {
  const user = await currentUser();
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