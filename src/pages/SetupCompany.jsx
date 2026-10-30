import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, KeyRound, Truck, ChevronRight } from "lucide-react";
import {
  createCompany,
  joinCompany,
  becomeSolo,
} from "../services/company";
import { supabase } from "../lib/supabase";

const OPTIONS = [
  {
    key: "create",
    icon: Building2,
    title: "Я шеф",
    sub: "Створити фірму й додати водіїв",
  },
  {
    key: "join",
    icon: KeyRound,
    title: "Я водій фірми",
    sub: "Приєднатись за кодом від шефа",
  },
  {
    key: "solo",
    icon: Truck,
    title: "Окремий водій",
    sub: "Веду рейси самостійно, без фірми",
  },
];

export default function SetupCompany() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("choose");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Без сесії на цій сторінці нічого не працює: чекаємо до 3 с, потім на вхід
  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (let i = 0; i < 6; i++) {
        const { data } = await supabase.auth.getSession();
        if (data?.session) return;
        if (cancelled) return;
        await new Promise((r) => setTimeout(r, 500));
      }
      if (!cancelled) navigate("/login", { replace: true });
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const goHome = () => navigate("/", { replace: true });

  const back = () => {
    setMode("choose");
    setError("");
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
      const company = await createCompany(name);
      if (company) goHome();
      else setError("Не вдалося створити фірму. Спробуй ще раз.");
    } catch (err) {
      setError(err.message || "Не вдалося створити фірму");
    } finally {
      setLoading(false);
    }
  };

  const onJoin = async (e) => {
    e?.preventDefault();
    setError("");

    if (!code.trim()) {
      setError("Вкажи код фірми");
      return;
    }

    setLoading(true);
    try {
      const company = await joinCompany(code);
      if (company) goHome();
      else setError("Не вдалося приєднатись. Перевір код і спробуй ще раз.");
    } catch (err) {
      setError(err.message || "Не вдалося приєднатись");
    } finally {
      setLoading(false);
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

  return (
    <div
      style={{
        maxWidth: 440,
        margin: "60px auto",
        padding: "0 16px",
        color: "var(--text)",
      }}
    >
      <h1 style={{ marginBottom: 8 }}>
        {mode === "choose"
          ? "Як ви користуватиметесь TruckReport?"
          : mode === "create"
            ? "Створення фірми"
            : "Приєднання до фірми"}
      </h1>

      <p style={{ color: "var(--text-secondary)", marginBottom: 24 }}>
        {mode === "choose" && "Оберіть, як вам зручніше. Це можна змінити пізніше."}
        {mode === "create" && "Ви станете шефом і зможете додавати водіїв."}
        {mode === "join" && "Код фірми дає шеф. Попросіть його надіслати вам код."}
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
          {OPTIONS.map(({ key, icon: Icon, title, sub }) => (
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
                <b style={{ display: "block", fontSize: 16 }}>{title}</b>
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
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Назва фірми"
            autoFocus
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
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Код фірми"
            autoFocus
            style={input}
          />
          <button type="submit" style={primary} disabled={loading}>
            {loading ? "Зачекай..." : "Приєднатись"}
          </button>
          <button type="button" style={secondary} onClick={back}>
            Назад
          </button>
        </form>
      )}
    </div>
  );
}