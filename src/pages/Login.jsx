import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

const fieldStyle = {
  width: "100%",
  padding: 12,
  marginBottom: 12,
  borderRadius: 10,
  border: "1px solid #334155",
  background: "#1e293b",
  color: "white",
  boxSizing: "border-box",
};

const primaryBtn = {
  width: "100%",
  padding: 12,
  borderRadius: 10,
  border: "none",
  background: "#22c55e",
  color: "white",
  fontWeight: 700,
  cursor: "pointer",
  marginBottom: 12,
};

const secondaryBtn = {
  width: "100%",
  padding: 10,
  borderRadius: 10,
  border: "1px solid #334155",
  background: "transparent",
  color: "#94a3b8",
  cursor: "pointer",
  marginBottom: 8,
};

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setInfo("");

    try {
      if (forgot) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setInfo("Лист надіслано. Перевір пошту і папку «Спам».");
        return;
      }

      if (isRegister) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setInfo("Акаунт створено. Тепер увійди.");
        setIsRegister(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        navigate("/");
      }
    } catch (err) {
      setError(err.message || "Помилка");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0f172a",
        padding: 16,
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          maxWidth: 380,
          background: "#111827",
          border: "1px solid #334155",
          borderRadius: 16,
          padding: 24,
          color: "white",
        }}
      >
        <h1 style={{ marginTop: 0, marginBottom: 8 }}>TruckReport</h1>
        <p style={{ color: "#94a3b8", marginTop: 0 }}>
          {forgot
            ? "Відновлення пароля"
            : isRegister
            ? "Реєстрація"
            : "Вхід у акаунт"}
        </p>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={fieldStyle}
        />

        {!forgot && (
          <input
            type="password"
            placeholder="Пароль (мін. 6 символів)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            style={fieldStyle}
          />
        )}

        {error && (
          <div style={{ color: "#f87171", marginBottom: 12, fontSize: 14 }}>
            {error}
          </div>
        )}

        {info && (
          <div style={{ color: "#86efac", marginBottom: 12, fontSize: 14 }}>
            {info}
          </div>
        )}

        <button type="submit" disabled={loading} style={primaryBtn}>
          {loading
            ? "Зачекайте..."
            : forgot
            ? "Надіслати лист"
            : isRegister
            ? "Зареєструватися"
            : "Увійти"}
        </button>

        {!forgot && !isRegister && (
          <button
            type="button"
            onClick={() => {
              setForgot(true);
              setError("");
              setInfo("");
            }}
            style={secondaryBtn}
          >
            Забув пароль
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            if (forgot) {
              setForgot(false);
            } else {
              setIsRegister(!isRegister);
            }
            setError("");
            setInfo("");
          }}
          style={secondaryBtn}
        >
          {forgot
            ? "Назад до входу"
            : isRegister
            ? "Вже є акаунт? Увійти"
            : "Немає акаунту? Зареєструватися"}
        </button>
      </form>
    </div>
  );
}