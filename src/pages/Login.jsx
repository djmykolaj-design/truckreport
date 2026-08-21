import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isRegister) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        alert("Перевір пошту для підтвердження (якщо увімкнено) або одразу увійди.");
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
      setError(err.message || "Помилка входу");
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
        <h1 style={{ marginTop: 0, marginBottom: 8 }}>
          TruckReport
        </h1>
        <p style={{ color: "#94a3b8", marginTop: 0 }}>
          {isRegister ? "Реєстрація" : "Вхід у акаунт"}
        </p>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{
            width: "100%",
            padding: 12,
            marginBottom: 12,
            borderRadius: 10,
            border: "1px solid #334155",
            background: "#1e293b",
            color: "white",
            boxSizing: "border-box",
          }}
        />

        <input
          type="password"
          placeholder="Пароль (мін. 6 символів)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          style={{
            width: "100%",
            padding: 12,
            marginBottom: 12,
            borderRadius: 10,
            border: "1px solid #334155",
            background: "#1e293b",
            color: "white",
            boxSizing: "border-box",
          }}
        />

        {error && (
          <div style={{ color: "#f87171", marginBottom: 12, fontSize: 14 }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 10,
            border: "none",
            background: "#22c55e",
            color: "white",
            fontWeight: 700,
            cursor: "pointer",
            marginBottom: 12,
          }}
        >
          {loading
            ? "Зачекайте..."
            : isRegister
            ? "Зареєструватися"
            : "Увійти"}
        </button>

        <button
          type="button"
          onClick={() => {
            setIsRegister(!isRegister);
            setError("");
          }}
          style={{
            width: "100%",
            padding: 10,
            borderRadius: 10,
            border: "1px solid #334155",
            background: "transparent",
            color: "#94a3b8",
            cursor: "pointer",
          }}
        >
          {isRegister
            ? "Вже є акаунт? Увійти"
            : "Немає акаунту? Зареєструватися"}
        </button>
      </form>
    </div>
  );
}