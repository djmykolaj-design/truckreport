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
  return supabase.rpc(name, args);
}

// Зрозумілі повідомлення замість технічних кодів із бази
const ERROR_TEXTS = {
  invalid_code: "Код фірми невірний",
  already_in_company: "Ви вже в фірмі. Спершу вийдіть із неї",
  forbidden: "Недостатньо прав для цієї дії",
  invalid_role: "Невірна роль",
  request_not_found: "Заявку не знайдено (можливо, її вже оброблено)",
  member_not_found: "Працівника не знайдено",
  cannot_change_boss: "Керівника змінити не можна",
  cannot_change_self: "Себе змінити не можна",
  only_boss_assigns_deputy: "Заступника призначає й змінює лише керівник",
  only_boss_manages_deputy: "Заступника призначає й змінює лише керівник",
  not_authenticated: "Сесія не знайдена. Увійдіть ще раз.",
};

function errorText(error, fallback) {
  const message = String(error?.message || "");
  const key = Object.keys(ERROR_TEXTS).find((code) => message.includes(code));
  return key ? ERROR_TEXTS[key] : message || fallback;
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

// Застаріла функція: приєднувала без підтвердження. Замінена на requestJoinCompany.
export async function joinCompany(code) {
  const { data, error } = await callRpc("join_company", { p_code: code });

  if (error) {
    if (error.message === "no_session") return null;
    console.error(error);
    alert(errorText(error, "Не вдалося приєднатися до фірми"));
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

/* ───────── Заявки на вступ ───────── */

// Подати заявку за кодом фірми.
// Повертає { status: "pending" | "member", company_id, company_name } або null.
export async function requestJoinCompany(code) {
  const { data, error } = await callRpc("request_join_company", {
    p_code: code,
  });

  if (error) {
    if (error.message === "no_session") return null;
    console.error(error);
    alert(errorText(error, "Не вдалося надіслати заявку"));
    return null;
  }

  return data;
}

// Моя поточна заявка (або null)
export async function getMyJoinRequest() {
  const { data, error } = await supabase.rpc("my_join_request");

  if (error) {
    console.error("my_join_request:", error);
    return null;
  }

  return data || null;
}

export async function cancelJoinRequest() {
  const { error } = await callRpc("cancel_join_request");

  if (error) {
    if (error.message === "no_session") return false;
    console.error(error);
    alert(errorText(error, "Не вдалося скасувати заявку"));
    return false;
  }

  return true;
}

// Для керівника й заступника: заявки на вступ у їхню фірму
export async function loadJoinRequests() {
  const { data, error } = await supabase
    .from("company_join_requests")
    .select("id, user_id, company_id, requester_name, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("join requests:", error);
    return [];
  }

  return data || [];
}

export async function approveJoinRequest(requestId, role) {
  const { error } = await callRpc("approve_join_request", {
    p_request: requestId,
    p_role: role,
  });

  if (error) {
    if (error.message === "no_session") return false;
    console.error(error);
    alert(errorText(error, "Не вдалося підтвердити заявку"));
    return false;
  }

  return true;
}

export async function rejectJoinRequest(requestId) {
  const { error } = await callRpc("reject_join_request", {
    p_request: requestId,
  });

  if (error) {
    if (error.message === "no_session") return false;
    console.error(error);
    alert(errorText(error, "Не вдалося відхилити заявку"));
    return false;
  }

  return true;
}

/* ───────── Працівники фірми ───────── */

// Усі, хто в фірмі: id, ім'я, роль (для керівника, заступника, логіста)
export async function loadCompanyMembers() {
  const company = await getMyCompany();
  if (!company) return [];

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("company_id", company.id)
    .order("full_name", { ascending: true });

  if (error) {
    console.error("company members:", error);
    return [];
  }

  return data || [];
}

export async function setMemberRole(userId, role) {
  const { error } = await callRpc("set_member_role", {
    p_user: userId,
    p_role: role,
  });

  if (error) {
    if (error.message === "no_session") return false;
    console.error(error);
    alert(errorText(error, "Не вдалося змінити роль"));
    return false;
  }

  return true;
}

export async function removeMember(userId) {
  const { error } = await callRpc("remove_member", { p_user: userId });

  if (error) {
    if (error.message === "no_session") return false;
    console.error(error);
    alert(errorText(error, "Не вдалося вивести працівника з фірми"));
    return false;
  }

  return true;
}