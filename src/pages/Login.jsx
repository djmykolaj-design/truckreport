import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { getMyProfile } from "../services/profile";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const handled = useRef(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const afterAuth = async () => {
    if (handled.current) return;
    handled.current = true;

    try {
      const me = await getMyProfile();

      if (!me?.setup_done) {
        navigate("/setup", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch (err) {
      handled.current = false;
      setError(err.message || "Не вдалося завантажити профіль");
    }
  };

  // Повернення з Google (або вже відкрита сесія): продовжуємо як після звичайного входу
  useEffect(() => {
    let cancelled = false;

    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled && data?.session) afterAuth();
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) afterAuth();
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const onGoogle = async () => {
    setError("");
    setMessage("");
    setGoogleLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/login`,
          queryParams: { prompt: "select_account" },
        },
      });

      if (error) {
        setError(error.message);
        setGoogleLoading(false);
      }
      // при успіху браузер переходить на сторінку Google
    } catch (err) {
      setError(err.message || "Не вдалося увійти через Google");
      setGoogleLoading(false);
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

  const googleButton = {
    ...field,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    background: "transparent",
    fontWeight: 600,
    cursor: googleLoading ? "wait" : "pointer",
    marginBottom: 0,
  };

  const busy = loading || forgotLoading || googleLoading;

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
          disabled={busy}
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

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          margin: "16px 0",
          color: "#6b7684",
          fontSize: 13,
        }}
      >
        <div style={{ flex: 1, height: 1, background: "#262d38" }} />
        або
        <div style={{ flex: 1, height: 1, background: "#262d38" }} />
      </div>

      <button
        type="button"
        onClick={onGoogle}
        disabled={busy}
        style={googleButton}
      >
        <GoogleIcon />
              {googleLoading
          ? "Переходимо до Google..."
          : isRegister
            ? "Зареєструватись через Google"
            : "Увійти через Google"}
      </button>

      <div style={{ marginTop: 16 }}>
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
      </div>

      <div style={{ marginTop: 6 }}>
        <button
          type="button"
          onClick={() => navigate("/demo")}
          style={{ ...secondaryButton, color: "#22c55e" }}
        >
          Переглянути демо
        </button>
      </div>
          <div
        style={{
          marginTop: 28,
          display: "flex",
          flexWrap: "wrap",
          gap: 16,
          fontSize: 13,
        }}
      >
        <a href="/privacy" style={{ color: "#6b7684" }}>
          Політика конфіденційності
        </a>
        <a href="/terms" style={{ color: "#6b7684" }}>
          Умови користування
        </a>
      </div>
    </div>
  );
}