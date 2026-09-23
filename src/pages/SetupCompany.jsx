import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createCompany,
  joinCompany,
  becomeSolo,
} from "../services/company";

export default function SetupCompany() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("choose");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const goHome = () => navigate("/", { replace: true });

  const onCreate = async () => {
    if (!name.trim()) return alert("Вкажи назву фірми");
    setLoading(true);
    const company = await createCompany(name);
    setLoading(false);
    if (company) goHome();
  };

  const onJoin = async () => {
    if (!code.trim()) return alert("Вкажи код фірми");
    setLoading(true);
    const company = await joinCompany(code);
    setLoading(false);
    if (company) goHome();
  };

  const onSolo = async () => {
    setLoading(true);
    await becomeSolo();
    setLoading(false);
    goHome();
  };

  const btn = {
    width: "100%",
    padding: "14px",
    borderRadius: 12,
    border: "1px solid #30363D",
    background: "#1F2937",
    color: "white",
    fontWeight: 700,
    cursor: "pointer",
    marginBottom: 12,
  };

  return (
    <div style={{ maxWidth: 420, margin: "40px auto", color: "white" }}>
      <h1 style={{ marginBottom: 8 }}>Як заходиш?</h1>
      <p style={{ color: "#94a3b8", marginBottom: 24 }}>
        Фірма, водій фірми або окремо
      </p>

      {mode === "choose" && (
        <>
          <button style={btn} onClick={() => setMode("create")}>
            Створити фірму (я шеф)
          </button>
          <button style={btn} onClick={() => setMode("join")}>
            Я водій фірми (є код)
          </button>
          <button style={btn} onClick={onSolo} disabled={loading}>
            Окремий водій
          </button>
        </>
      )}

      {mode === "create" && (
        <>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Назва фірми"
            style={{
              ...btn,
              fontWeight: 500,
              background: "#111827",
            }}
          />
          <button
            style={{ ...btn, background: "#22c55e", border: "none" }}
            onClick={onCreate}
            disabled={loading}
          >
            Створити
          </button>
          <button style={btn} onClick={() => setMode("choose")}>
            Назад
          </button>
        </>
      )}

      {mode === "join" && (
        <>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Код фірми"
            style={{
              ...btn,
              fontWeight: 500,
              background: "#111827",
            }}
          />
          <button
            style={{ ...btn, background: "#22c55e", border: "none" }}
            onClick={onJoin}
            disabled={loading}
          >
            Приєднатись
          </button>
          <button style={btn} onClick={() => setMode("choose")}>
            Назад
          </button>
        </>
      )}
    </div>
  );
}