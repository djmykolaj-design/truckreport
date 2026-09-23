import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { getMyProfile } from "../services/profile";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);

  const afterAuth = async () => {
    const me = await getMyProfile();
    if (!me?.setup_done) {
      navigate("/setup", { replace: true });
    } else {
      navigate("/", { replace: true });
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      alert("Вкажи email і пароль");
      return;
    }

    setLoading(true);

    if (isRegister) {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });
      setLoading(false);
      if (error) {
        alert(error.message);
        return;
      }
      await afterAuth();
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (error) {
      alert(error.message);
      return;
    }
    await afterAuth();
  };

  const field = {
    width: "100%",
    padding: "14px",
    marginBottom: 12,
    borderRadius: 12,
    border: "1px solid #30363D",
    background: "#111827",
    color: "white",
    boxSizing: "border-box",
  };

  return (
    <div style={{ maxWidth: 420, margin: "60px auto", color: "white" }}>
      <h1 style={{ marginBottom: 8 }}>TruckReport</h1>
      <p style={{ color: "#94a3b8", marginBottom: 24 }}>
        {isRegister ? "Реєстрація" : "Вхід"}
      </p>

      <form onSubmit={onSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={field}
        />
        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={field}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            ...field,
            background: "#22c55e",
            border: "none",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          {loading ? "..." : isRegister ? "Зареєструватись" : "Увійти"}
        </button>
      </form>

      <button
        type="button"
        onClick={() => setIsRegister((v) => !v)}
        style={{
          background: "transparent",
          border: "none",
          color: "#94a3b8",
          cursor: "pointer",
        }}
      >
        {isRegister ? "Вже є акаунт? Увійти" : "Немає акаунта? Реєстрація"}
      </button>
    </div>
  );
}