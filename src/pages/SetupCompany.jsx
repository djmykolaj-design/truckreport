import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, KeyRound, Truck, ChevronRight } from "lucide-react";
import {
  createCompany,
  requestJoinCompany,
  getMyJoinRequest,
  cancelJoinRequest,
  becomeSolo,
} from "../services/company";
import { getMyProfile } from "../services/profile";
import { supabase } from "../lib/supabase";

const OPTIONS = [
  {
    key: "create",
    icon: Building2,
    title: "Я керівник",
    sub: "Створити фірму й додати водіїв",
  },
  {
    key: "join",
    icon: KeyRound,
    title: "Я працівник фірми",
    sub: "Приєднатись за кодом від керівника",
  },
  {
    key: "solo",
    icon: Truck,
    title: "Окремий водій",
    sub: "Веду рейси самостійно, без фірми",
  },
];

// Ім'я вважаємо прийнятним, якщо це щонайменше два слова («Прізвище Ім'я»)
function isFullName(value) {
  const parts = String(value || "").trim().split(/\s+/).filter(Boolean);
  return parts.length >= 2 && parts.every((p) => p.length >= 2);
}

// my_join_request може повернути об'єкт або масив із одним елементом
function normalizeRequest(value) {
  const req = Array.isArray(value) ? value[0] : value;
  if (!req) return null;
  if (req.status && req.status !== "pending") return null;
  return req;
}

export default function SetupCompany() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("choose");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [fullName, setFullName] = useState("");
  const [pending, setPending] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Без сесії на цій сторінці нічого не працює: чекаємо до 3 с, потім на вхід.
  // Заодно: підставляємо ім'я з профілю й перевіряємо, чи нема вже поданої заявки.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (let i = 0; i < 6; i++) {
        const { data } = await supabase.auth.getSession();
        const session = data?.session;

        if (session) {
          const profile = await getMyProfile();

          if (cancelled) return;

          if (profile?.company_id) {
            navigate("/", { replace: true });
            return;
          }

          if (isFullName(profile?.full_name)) setFullName(profile.full_name);

          const request = normalizeRequest(await getMyJoinRequest());
          if (!cancelled && request) {
            setPending(request);
            setMode("pending");
          }
          return;
        }

        if (cancelled) return;
        await new Promise((r) => setTimeout(r, 500));
      }
      if (!cancelled) navigate("/login", { replace: true });
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  // Поки заявка очікує: кожні 4 секунди перевіряємо, чи її підтвердили
  useEffect(() => {
    if (mode !== "pending") return undefined;

    let stopped = false;

    const check = async () => {
      const profile = await getMyProfile();
      if (stopped) return;

      if (profile?.company_id) {
        navigate("/", { replace: true });
        return;
      }

      const request = normalizeRequest(await getMyJoinRequest());
      if (stopped) return;

      if (!request) {
        setPending(null);
        setMode("choose");
        setError("Заявку не підтверджено. Перевірте код або зверніться до керівника.");
      }
    };

    const timer = setInterval(check, 4000);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [mode, navigate]);

  const goHome = () => navigate("/", { replace: true });

  const back = () => {
    setMode("choose");
    setError("");
  };

  // Записує прізвище та ім'я в профіль. Повертає true, якщо все гаразд.
  const saveFullName = async () => {
    const value = fullName.trim().replace(/\s+/g, " ");

    if (!isFullName(value)) {
      setError("Вкажіть прізвище та ім'я, наприклад: Петренко Іван");
      return false;
    }

    const { data } = await supabase.auth.getSession();
    const userId = data?.session?.user?.id;

    if (!userId) {
      setError("Сесія закінчилась. Увійдіть ще раз.");
      return false;
    }

    const { error: saveError } = await supabase
      .from("profiles")
      .update({ full_name: value })
      .eq("id", userId);

    if (saveError) {
      console.error(saveError);
      setError("Не вдалося зберегти ім'я. Спробуйте ще раз.");
      return false;
    }

    return true;
  };

  const onCreate = async (e) => {
    e?.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Вкажи назву фірми");
      return;
    }

    setLoading(true);
    try {
      if (!(await saveFullName())) return;

      const company = await createCompany(name);
      if (company) goHome();
      else setError("Не вдалося створити фірму. Спробуй ще раз.");
    } catch (err) {
      setError(err.message || "Не вдалося створити фірму");
    } finally {
      setLoading(false);
    }
  };

  // Подає заявку. Доки керівник не підтвердить, людина нічого в фірмі не бачить.
  const onJoin = async (e) => {
    e?.preventDefault();
    setError("");

    if (!code.trim()) {
      setError("Вкажи код фірми");
      return;
    }

    setLoading(true);
    try {
      if (!(await saveFullName())) return;

      const result = await requestJoinCompany(code.trim());
      if (!result) return;

      if (result.status === "member") {
        goHome();
        return;
      }

      setPending(result);
      setMode("pending");
    } catch (err) {
      setError(err.message || "Не вдалося надіслати заявку");
    } finally {
      setLoading(false);
    }
  };

  const onCancelRequest = async () => {
    setLoading(true);
    const ok = await cancelJoinRequest();
    setLoading(false);

    if (ok) {
      setPending(null);
      setCode("");
      setMode("choose");
      setError("");
    }
  };

  const onSolo = async () => {
    setError("");
    setLoading(true);
    try {
      const ok = await becomeSolo();
      if (ok) goHome();
      else setError("Не вдалося зберегти вибір. Спробуй ще раз.");
    } catch (err) {
      setError(err.message || "Сталася помилка");
    } finally {
      setLoading(false);
    }
  };

  const onPick = (key) => {
    setError("");
    if (key === "solo") onSolo();
    else setMode(key);
  };

  const input = {
    width: "100%",
    padding: "14px",
    marginBottom: 12,
    borderRadius: 12,
    border: "1px solid var(--border)",
    background: "var(--surface)",
    color: "var(--text)",
    boxSizing: "border-box",
    font: "inherit",
  };

  const primary = {
    width: "100%",
    padding: "14px",
    marginBottom: 10,
    borderRadius: 12,
    border: "none",
    background: "var(--primary)",
    color: "#06210f",
    fontWeight: 700,
    font: "inherit",
    cursor: loading ? "wait" : "pointer",
  };

  const secondary = {
    width: "100%",
    padding: "14px",
    borderRadius: 12,
    border: "1px solid var(--border)",
    background: "transparent",
    color: "var(--text-secondary)",
    font: "inherit",
    cursor: "pointer",
  };

  const hint = {
    margin: "-4px 0 12px",
    color: "var(--text-secondary)",
    fontSize: 13,
  };

  const title =
    mode === "choose"
      ? "Як ви користуватиметесь TruckReport?"
      : mode === "create"
        ? "Створення фірми"
        : mode === "pending"
          ? "Заявку надіслано"
          : "Приєднання до фірми";

  return (
    <div
      style={{
        maxWidth: 440,
        margin: "60px auto",
        padding: "0 16px",
        color: "var(--text)",
      }}
    >
      <h1 style={{ marginBottom: 8 }}>{title}</h1>

      <p style={{ color: "var(--text-secondary)", marginBottom: 24 }}>
        {mode === "choose" && "Оберіть, як вам зручніше. Це можна змінити пізніше."}
        {mode === "create" && "Ви станете керівником і зможете додавати водіїв."}
        {mode === "join" &&
          "Код фірми дає керівник. Після заявки він підтвердить вас і призначить роль."}
        {mode === "pending" &&
          `Чекаємо, поки керівник${
            pending?.company_name ? ` фірми «${pending.company_name}»` : ""
          } підтвердить заявку. Ця сторінка оновиться сама.`}
      </p>

      {error && (
        <p
          role="alert"
          style={{
            color: "var(--danger)",
            fontSize: 14,
            marginBottom: 12,
          }}
        >
          {error}
        </p>
      )}

      {mode === "choose" && (
        <div style={{ display: "grid", gap: 12 }}>
          {OPTIONS.map(({ key, icon: Icon, title: optionTitle, sub }) => (
            <button
              key={key}
              type="button"
              onClick={() => onPick(key)}
              disabled={loading}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                width: "100%",
                padding: "16px 18px",
                border: "1px solid var(--border)",
                borderRadius: 14,
                background: "var(--surface)",
                color: "var(--text)",
                font: "inherit",
                textAlign: "left",
                cursor: loading ? "wait" : "pointer",
              }}
            >
              <span
                style={{
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background:
                    "color-mix(in srgb, var(--primary) 14%, transparent)",
                  color: "var(--primary)",
                }}
              >
                <Icon size={22} />
              </span>

              <span style={{ flex: 1, minWidth: 0 }}>
                <b style={{ display: "block", fontSize: 16 }}>{optionTitle}</b>
                <small style={{ color: "var(--text-secondary)", fontSize: 13 }}>
                  {sub}
                </small>
              </span>

              <ChevronRight size={20} style={{ color: "var(--text-muted)" }} />
            </button>
          ))}
        </div>
      )}

      {mode === "create" && (
        <form onSubmit={onCreate}>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Ваше прізвище та ім'я"
            autoComplete="name"
            autoFocus
            style={input}
          />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Назва фірми"
            style={input}
          />
          <button type="submit" style={primary} disabled={loading}>
            {loading ? "Зачекай..." : "Створити"}
          </button>
          <button type="button" style={secondary} onClick={back}>
            Назад
          </button>
        </form>
      )}

      {mode === "join" && (
        <form onSubmit={onJoin}>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Ваше прізвище та ім'я"
            autoComplete="name"
            autoFocus
            style={input}
          />
          <p style={hint}>Керівник побачить його в заявці й зрозуміє, хто ви.</p>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Код фірми"
            style={input}
          />
          <button type="submit" style={primary} disabled={loading}>
            {loading ? "Зачекай..." : "Надіслати заявку"}
          </button>
          <button type="button" style={secondary} onClick={back}>
            Назад
          </button>
        </form>
      )}

      {mode === "pending" && (
        <div>
          <button
            type="button"
            style={secondary}
            onClick={onCancelRequest}
            disabled={loading}
          >
            {loading ? "Зачекай..." : "Скасувати заявку"}
          </button>
        </div>
      )}
    </div>
  );
}