import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

// Ім'я вважаємо справжнім, якщо воно є й це не пошта
function isRealName(value) {
  const text = String(value || "").trim();
  return text.length > 0 && !text.includes("@");
}

// Прізвище та ім'я: щонайменше два слова
function isFullName(value) {
  const parts = String(value || "").trim().split(/\s+/).filter(Boolean);
  return parts.length >= 2 && parts.every((p) => p.length >= 2);
}

// Картка «Вкажіть прізвище та ім'я». Показується, лише якщо в профілі
// немає імені (або замість нього пошта). Інакше нічого не виводить.
export default function NamePrompt() {
  const [userId, setUserId] = useState(null);
  const [show, setShow] = useState(false);
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data } = await supabase.auth.getSession();
      const id = data?.session?.user?.id;
      if (!id) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", id)
        .maybeSingle();

      if (cancelled || !profile) return;

      setUserId(id);
      setShow(!isRealName(profile.full_name));
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!show) return null;

  const save = async (event) => {
    event.preventDefault();
    setError("");

    const name = value.trim().replace(/\s+/g, " ");

    if (!isFullName(name)) {
      setError("Вкажіть прізвище та ім'я, наприклад: Петренко Іван");
      return;
    }

    setSaving(true);
    const { error: saveError } = await supabase
      .from("profiles")
      .update({ full_name: name })
      .eq("id", userId);
    setSaving(false);

    if (saveError) {
      console.error(saveError);
      setError("Не вдалося зберегти ім'я. Спробуйте ще раз.");
      return;
    }

    setShow(false);
  };

  return (
    <form
      onSubmit={save}
      style={{
        marginBottom: 16,
        padding: "14px 16px",
        borderRadius: 14,
        border: "1px solid color-mix(in srgb, var(--warning) 45%, transparent)",
        background: "color-mix(in srgb, var(--warning) 8%, var(--surface))",
        color: "var(--text)",
        maxWidth: 900,
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 4 }}>Вкажіть прізвище та ім'я</div>
      <div style={{ color: "var(--text-secondary)", fontSize: 13, marginBottom: 10 }}>
        Так вас бачитимуть керівник і колеги. Зараз замість імені показується
        пошта.
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Наприклад: Петренко Іван"
          autoComplete="name"
          style={{
            flex: 1,
            minWidth: 200,
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid var(--border)",
            background: "var(--bg)",
            color: "var(--text)",
            fontSize: 14,
          }}
        />
        <button
          type="submit"
          disabled={saving}
          style={{
            border: "none",
            borderRadius: 10,
            padding: "10px 16px",
            background: "var(--primary)",
            color: "#06210f",
            fontWeight: 700,
            cursor: saving ? "wait" : "pointer",
          }}
        >
          {saving ? "Збереження..." : "Зберегти"}
        </button>
      </div>

      {error && (
        <div role="alert" style={{ color: "var(--danger)", fontSize: 13, marginTop: 8 }}>
          {error}
        </div>
      )}
    </form>
  );
}