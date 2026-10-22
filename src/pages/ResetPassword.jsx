
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function ResetPassword() {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  useEffect(() => {
    let active = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;

      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
        setChecking(false);
      } else if (session) {
        setReady(true);
        setChecking(false);
      }
    });

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!active) return;

        if (error) {
          setError("Не вдалося перевірити посилання. Запроси нове.");
        } else if (data.session) {
          setReady(true);
        }

        setChecking(false);
      })
      .catch(() => {
        if (!active) return;

        setError("Не вдалося перевірити посилання. Запроси нове.");
        setChecking(false);
      });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setError("");
    setOk("");

    if (password.length < 6) {
      setError("Пароль має бути від 6 символів");
      return;
    }

    if (password !== confirm) {
      setError("Паролі не збігаються");
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setError(error.message);
        return;
      }

      setOk("Пароль успішно змінено. Переходимо до входу...");

      await supabase.auth.signOut();

      navigate("/login", { replace: true });
    } catch (err) {
      setError(err.message || "Не вдалося змінити пароль");
    } finally {
      setSaving(false);
    }
  };

  if (checking) {
    return (
      <div className="login-page">
        <div className="login-card">
          <h1>TruckReport</h1>
          <p>Перевіряємо посилання...</p>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="login-page">
        <div className="login-card">
          <h1>TruckReport</h1>
          <p>
            Посилання недійсне або термін його дії закінчився.
            Запроси нове посилання для відновлення пароля.
          </p>

          {error && <p className="login-error">{error}</p>}

          <button type="button" onClick={() => navigate("/login")}>
            Повернутися до входу
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={save}>
        <h1>Новий пароль</h1>

        <input
          type="password"
          placeholder="Новий пароль"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />

        <input
          type="password"
          placeholder="Повтори пароль"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          minLength={6}
          required
        />

        {error && <p className="login-error">{error}</p>}
        {ok && <p className="login-ok">{ok}</p>}

        <button type="submit" disabled={saving}>
          {saving ? "Зберігаємо..." : "Зберегти пароль"}
        </button>
      </form>
    </div>
  );
}
