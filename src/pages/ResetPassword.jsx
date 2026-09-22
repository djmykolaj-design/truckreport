import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Пароль має бути від 6 символів");
      return;
    }
    if (password !== confirm) {
      setError("Паролі не збігаються");
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
      return;
    }

    setOk("Пароль змінено");
    setTimeout(() => navigate("/"), 800);
  };

  if (!ready) {
    return (
      <div className="login-page">
        <div className="login-card">
          <h1>TruckReport</h1>
          <p>Відкрий посилання з листа ще раз.</p>
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
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          type="password"
          placeholder="Повтори пароль"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />

        {error && <p className="login-error">{error}</p>}
        {ok && <p className="login-ok">{ok}</p>}

        <button type="submit">Зберегти пароль</button>
      </form>
    </div>
  );
}