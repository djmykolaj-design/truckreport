
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
  const [forgotLoading, setForgotLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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
    setError("");
    setMessage("");

    if (!email.trim() || !password) {
      setError("Вкажи email і пароль");
      return;
    }

    setLoading(true);

    try {
      if (isRegister) {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });

        if (error) {
          setError(error.message);
          return;
        }

        await afterAuth();
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      await afterAuth();
    } catch (err) {
      setError(err.message || "Сталася помилка");
    } finally {
      setLoading(false);
    }
  };

  const onForgotPassword = async () => {
    setError("");
    setMessage("");

    if (!email.trim()) {
      setError("Спочатку введи свій email");
      return;
    }

    setForgotLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

      if (error) {
        setError(error.message);
        return;
      }

      setMessage(
        "Якщо для цієї адреси доступне відновлення, перевір пошту та папку «Спам»."
      );
    } catch (err) {
      setError(err.message || "Не вдалося надіслати лист");
    } finally {
      setForgotLoading(false);
    }
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

  const secondaryButton = {
    background: "transparent",
    border: "none",
    color: "#94a3b8",
    cursor: "pointer",
    padding: "8px 0",
    textAlign: "left",
  };

  return (
    <div
      className="login-page"
      style={{
        maxWidth: 420,
        margin: "60px auto",
        padding: 16,
        color: "white",
      }}
    >
      <h1 style={{ marginBottom: 8 }}>TruckReport</h1>

      <p style={{ color: "#94a3b8", marginBottom: 24 }}>
        {isRegister ? "Реєстрація" : "Вхід"}
      </p>

      <form onSubmit={onSubmit}>
        <input
          type="email"
          placeholder="Email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={field}
          required
        />

        <input
          type="password"
          placeholder="Пароль"
          autoComplete={isRegister ? "new-password" : "current-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={field}
          required
        />

        {!isRegister && (
          <div style={{ marginTop: -5, marginBottom: 12 }}>
            <button
              type="button"
              onClick={onForgotPassword}
              disabled={forgotLoading}
              style={{
                ...secondaryButton,
                color: "#22c55e",
              }}
            >
              {forgotLoading ? "Надсилаємо лист..." : "Забули пароль?"}
            </button>
          </div>
        )}

        {error && (
          <p
            role="alert"
            style={{
              color: "#f87171",
              fontSize: 14,
              marginBottom: 12,
            }}
          >
            {error}
          </p>
        )}

        {message && (
          <p
            role="status"
            style={{
              color: "#22c55e",
              fontSize: 14,
              marginBottom: 12,
            }}
          >
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || forgotLoading}
          style={{
            ...field,
            background: "#22c55e",
            border: "none",
            fontWeight: 700,
            cursor: loading ? "wait" : "pointer",
            marginBottom: 12,
          }}
        >
          {loading
            ? "Зачекай..."
            : isRegister
              ? "Зареєструватись"
              : "Увійти"}
        </button>
      </form>

      <button
        type="button"
        onClick={() => {
          setIsRegister((v) => !v);
          setError("");
          setMessage("");
        }}
        style={secondaryButton}
      >
        {isRegister
          ? "Вже є акаунт? Увійти"
          : "Немає акаунта? Реєстрація"}
      </button>
           <div style={{ marginTop: 6 }}>
        <button
          type="button"
          onClick={() => navigate("/demo")}
          style={{ ...secondaryButton, color: "#22c55e" }}
        >
          Переглянути демо
        </button>
      </div>
    </div>
  );
}
