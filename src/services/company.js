import { supabase } from "../lib/supabase";

// Створення фірми, приєднання і вихід виконуються функціями в базі,
// а не прямими змінами профілю з браузера.

// Чекаємо на сесію до ~3 секунд (після входу через Google вона з'являється не одразу)
async function requireSession() {
  for (let i = 0; i < 6; i++) {
    const { data } = await supabase.auth.getSession();
    if (data?.session?.access_token) return data.session;
    await new Promise((r) => setTimeout(r, 500));
  }
  return null;
}

async function callRpc(name, args) {
  const session = await requireSession();
  if (!session) {
    console.error("[rpc] немає сесії, виклик", name, "піде як anon");
    alert("Сесія не знайдена. Увійдіть ще раз.");
    return { data: null, error: { message: "no_session" } };
  }
  console.log("[rpc]", name, "user:", session.user?.email);
  return supabase.rpc(name, args);
}

export async function createCompany(name) {
  const { data, error } = await callRpc("create_company", { p_name: name });

  if (error) {
    if (error.message === "no_session") return null;
    console.error(error);
    alert(error.message || "Не вдалося створити фірму");
    return null;
  }

  return data;
}

export async function joinCompany(code) {
  const { data, error } = await callRpc("join_company", { p_code: code });

  if (error) {
    if (error.message === "no_session") return null;
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
  const { error } = await callRpc("leave_company");

  if (error) {
    if (error.message === "no_session") return null;
    console.error(error);
    alert(error.message || "Не вдалося зберегти режим");
    return null;
  }

  return true;
}

export async function leaveCompany() {
  const { error } = await callRpc("leave_company");

  if (error) {
    if (error.message === "no_session") return null;
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