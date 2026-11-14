import { useCallback, useEffect, useState } from "react";
import "./Dashboard.css";
import useDashboard from "../hooks/useDashboard";
import { useNavigate } from "react-router-dom";
import {
  Truck,
  Fuel,
  Wallet,
  FileText,
  ArrowRight,
} from "lucide-react";
import {
  requestJoinCompany,
  getMyJoinRequest,
  cancelJoinRequest,
  getMyCompany,
  leaveCompany,
} from "../services/company";
import { getMyPlan } from "../services/plan";
import { getMyProfile } from "../services/profile";

export default function Dashboard() {
  const navigate = useNavigate();

  const {
    totalTrips,
    activeTrips,
    completedTrips,
    activeTrip,
    activeTripStats,
    totalFuel,
    expenses,
    documentsCount,
    schengen,
    schengenColor,
    schengenInfo,
    schengenBusy,
    enterSchengen,
    leaveSchengen,
  } = useDashboard();

  const [firmCode, setFirmCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [myCompany, setMyCompany] = useState(null);
  const [joinRequest, setJoinRequest] = useState(null);
  const [planInfo, setPlanInfo] = useState(null);
  const [isOwnerPlan, setIsOwnerPlan] = useState(false);
  const [schengenError, setSchengenError] = useState("");

  const refreshFirm = useCallback(async () => {
    const [company, request] = await Promise.all([
      getMyCompany(),
      getMyJoinRequest(),
    ]);
    setMyCompany(company);
    setJoinRequest(request);
    return { company, request };
  }, []);

  useEffect(() => {
    let cancelled = false;

    refreshFirm();

    getMyPlan().then((info) => {
      if (!cancelled) setPlanInfo(info);
    });

    getMyProfile().then((profile) => {
      if (!cancelled) setIsOwnerPlan(profile?.plan === "owner");
    });

    return () => {
      cancelled = true;
    };
  }, [refreshFirm]);

  // Поки заявка очікує: перевіряємо, чи її підтвердили
  useEffect(() => {
    if (!joinRequest) return undefined;

    const check = async () => {
      if (document.visibilityState === "hidden") return;
      const { company } = await refreshFirm();
      // Роль змінилась: перезавантажуємо, щоб меню оновилось
      if (company) window.location.reload();
    };

    document.addEventListener("visibilitychange", check);
    const timer = setInterval(check, 30000);

    return () => {
      document.removeEventListener("visibilitychange", check);
      clearInterval(timer);
    };
  }, [joinRequest, refreshFirm]);

  const formatExpense = () => {
    if (!activeTripStats) return "0";

    const e = activeTripStats.expenses || {};
    const parts = [];

    if (e.EUR > 0) parts.push(`${Math.round(e.EUR)} €`);
    if (e.UAH > 0) parts.push(`${Math.round(e.UAH)} ₴`);
    if (e.PLN > 0) parts.push(`${Math.round(e.PLN)} zł`);
    if (e.USD > 0) parts.push(`${Math.round(e.USD)} $`);

    return parts.length ? parts.join(" · ") : "0";
  };

  const handleJoin = async () => {
    if (!firmCode.trim() || joining || leaving) return;

    setJoining(true);

    try {
      const result = await requestJoinCompany(firmCode);

      if (!result) return;

      setFirmCode("");

      if (result.status === "member") {
        // Ви вже в цій фірмі
        await refreshFirm();
        return;
      }

      setJoinRequest({
        company_id: result.company_id,
        company_name: result.company_name,
      });
    } finally {
      setJoining(false);
    }
  };

  const handleCancelRequest = async () => {
    if (joining || leaving) return;
    if (!window.confirm("Скасувати заявку на вступ у фірму?")) return;

    setJoining(true);

    try {
      const ok = await cancelJoinRequest();
      if (ok) setJoinRequest(null);
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async () => {
    if (leaving || joining) return;

    const confirmed = window.confirm(
      `Від'єднатися від фірми «${myCompany?.name}»?\n\nТвій профіль перейде в особистий режим. Рейси фірми більше не будуть їй видимі.`
    );

    if (!confirmed) return;

    setLeaving(true);

    try {
      const result = await leaveCompany();

      if (result) {
        setMyCompany(null);
        alert("Ти від'єднався від фірми. Тепер ти в особистому режимі.");
      }
    } finally {
      setLeaving(false);
    }
  };

  const todayLabel = new Date().toLocaleDateString("uk-UA");

  const handleEnterSchengen = async () => {
    if (schengenBusy) return;
    if (!window.confirm(`Відмітити в'їзд у Шенген сьогодні (${todayLabel})?`)) return;

    setSchengenError("");
    const result = await enterSchengen();
    if (!result.ok && result.error) setSchengenError(result.error);
  };

  const handleLeaveSchengen = async () => {
    if (schengenBusy) return;
    if (!window.confirm(`Відмітити виїзд із Шенгену сьогодні (${todayLabel})?`)) return;

    setSchengenError("");
    const result = await leaveSchengen();
    if (!result.ok && result.error) setSchengenError(result.error);
  };

  return (
    <div className="dashboard">
      <section className="hero-card">
        <div className="hero-top">
          <div className="hero-title">
            <Truck size={18} />
            <span>Активний рейс</span>
          </div>

          {activeTrip && <div className="hero-badge">У дорозі</div>}
        </div>

        {activeTrip ? (
          <>
            <div className="hero-route">
              {activeTrip.fromCity || "—"}
              <span className="hero-arrow">→</span>
              {activeTrip.toCity || "—"}
            </div>

            <div className="hero-meta">TR-{activeTrip.tripNumber}</div>

            <div className="hero-stats">
              <div className="hero-stat">
                <div className="hero-stat-value">
                  {Math.round(activeTripStats.startMileage || 0)} км
                </div>
                <div className="hero-stat-label">На старті</div>
              </div>

              <div className="hero-stat">
                <div className="hero-stat-value">
                  {Math.round(activeTripStats.fuelAdded || 0)} л
                </div>
                <div className="hero-stat-label">Пальне</div>
              </div>

              <div className="hero-stat">
                <div className="hero-stat-value hero-stat-expense">
                  {formatExpense()}
                </div>
                <div className="hero-stat-label">Витрати</div>
              </div>
            </div>

            <button
              className="hero-btn"
              onClick={() => navigate(`/trips?trip=${activeTrip.id}`)}
            >
              Відкрити рейс
              <ArrowRight size={18} />
            </button>
          </>
        ) : (
          <>
            <div className="hero-empty">Немає активного рейсу</div>

            <button className="hero-btn" onClick={() => navigate("/trips")}>
              Створити рейс
              <ArrowRight size={18} />
            </button>
          </>
        )}
      </section>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon">
            <Truck size={18} />
          </div>
          <div className="kpi-value">{totalTrips}</div>
          <div className="kpi-title">Рейси</div>
          <div className="kpi-sub">
            Активних {activeTrips} · Завершених {completedTrips}
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon">
            <Fuel size={18} />
          </div>
          <div className="kpi-value">
            {Math.round(activeTrip ? activeTripStats.fuelAdded : totalFuel)} л
          </div>
          <div className="kpi-title">Пальне</div>
          <div className="kpi-sub">{activeTrip ? "За цей рейс" : "Всього"}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon">
            <Wallet size={18} />
          </div>
          <div className="kpi-value kpi-expense">
            {activeTrip
              ? formatExpense()
              : `${Math.round(expenses.EUR || 0)} €`}
          </div>
          <div className="kpi-title">Витрати</div>
          <div className="kpi-sub">{activeTrip ? "За цей рейс" : "EUR"}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon">
            <FileText size={18} />
          </div>
          <div className="kpi-value">
            {activeTrip ? activeTripStats.documentsCount : documentsCount}
          </div>
          <div className="kpi-title">Документи</div>
          <div className="kpi-sub">
            {activeTrip ? "За цей рейс" : "Файлів"}
          </div>
        </div>
      </div>

      <section className="schengen-card">
        <div className="schengen-left">
          <div className="schengen-title">Шенгенські дні</div>
          <div className="schengen-sub">
            Використано {schengen.usedDays} з 90
          </div>
        </div>

        <div className="schengen-number" style={{ color: schengenColor }}>
          {schengen.remaining}
          <span>/90</span>
        </div>

        <div className="schengen-bar">
          <div
            className="schengen-bar-fill"
            style={{
              width: `${Math.min((schengen.usedDays / 90) * 100, 100)}%`,
              background: schengenColor,
            }}
          />
        </div>
      </section>

      <section className="hero-card" style={{ marginTop: 8 }}>
        <div className="hero-title">Шенген: швидка відмітка</div>

        <div className="hero-empty" style={{ marginTop: 10 }}>
          {schengenInfo.inZone
            ? `Ви в Шенгені з ${schengenInfo.since} · ${schengenInfo.dayInZone}-й день`
            : "Ви поза Шенгеном"}
        </div>

        {schengenInfo.inZone && schengenInfo.exitBy && (
          <div
            style={{
              marginTop: 6,
              fontSize: 14,
              color: schengenInfo.exitInDays <= 5 ? "#ef4444" : "#94a3b8",
            }}
          >
            Виїхати до {schengenInfo.exitBy}
            {schengenInfo.exitInDays === 0
              ? " (сьогодні останній день)"
              : ` (ще ${schengenInfo.exitInDays} дн.)`}
          </div>
        )}

        {schengenInfo.inZone && !schengenInfo.exitBy && (
          <div style={{ marginTop: 6, fontSize: 14, color: "#ef4444" }}>
            Ліміт 90 днів перевищено. Виїжджайте якнайшвидше.
          </div>
        )}

        {schengenError && (
          <div role="alert" style={{ marginTop: 8, fontSize: 13, color: "#ef4444" }}>
            {schengenError}
          </div>
        )}

        {schengenInfo.inZone ? (
          <button
            className="hero-btn"
            style={{ marginTop: 12, background: "#c0392b" }}
            disabled={schengenBusy}
            onClick={handleLeaveSchengen}
          >
            {schengenBusy ? "Зберігаю…" : "Виїхав із Шенгену"}
          </button>
        ) : (
          <button
            className="hero-btn"
            style={{ marginTop: 12 }}
            disabled={schengenBusy}
            onClick={handleEnterSchengen}
          >
            {schengenBusy ? "Зберігаю…" : "Я в'їхав у Шенген"}
            <ArrowRight size={18} />
          </button>
        )}
      </section>

      <section className="hero-card" style={{ marginTop: 8 }}>
        <div className="hero-title">Фірма</div>

        {myCompany ? (
          <>
            <div className="hero-empty" style={{ marginTop: 10 }}>
              Ти в фірмі «{myCompany.name}»
            </div>

            <button
              className="hero-btn"
              style={{
                marginTop: 12,
                background: "#c0392b",
              }}
              disabled={leaving || joining}
              onClick={handleLeave}
            >
              {leaving ? "Від'єдную…" : "Від'єднатися від фірми"}
            </button>
          </>
        ) : joinRequest ? (
          <>
            <div className="hero-empty" style={{ marginTop: 10 }}>
              Заявку надіслано у фірму «{joinRequest.company_name}».
              Чекайте підтвердження керівника.
            </div>

            <button
              className="hero-btn"
              style={{ marginTop: 12, background: "#475569" }}
              disabled={joining}
              onClick={handleCancelRequest}
            >
              {joining ? "Скасовую…" : "Скасувати заявку"}
            </button>
          </>
        ) : (
          <>
            <div className="hero-empty" style={{ marginTop: 10 }}>
              Ще не в фірмі
            </div>

            <input
              value={firmCode}
              onChange={(e) => setFirmCode(e.target.value.toUpperCase())}
              placeholder="Код фірми, наприклад SMTR1988"
              style={{
                width: "100%",
                marginTop: 12,
                padding: "12px",
                borderRadius: 10,
                border: "1px solid #334155",
                background: "#1e293b",
                color: "white",
                boxSizing: "border-box",
              }}
            />

            <button
              className="hero-btn"
              style={{ marginTop: 12 }}
              disabled={joining || leaving || !firmCode.trim()}
              onClick={handleJoin}
            >
              {joining ? "Надсилаю…" : "Надіслати заявку"}
            </button>
          </>
        )}
      </section>

      <section className="hero-card" style={{ marginTop: 8 }}>
        <div className="hero-title">Мій план</div>

        <div className="hero-empty" style={{ marginTop: 10 }}>
          {planInfo ? planInfo.label : "Завантаження…"}
        </div>

        <button
          className="hero-btn"
          style={{ marginTop: 12 }}
          onClick={() => navigate("/pricing")}
        >
          Тарифи
          <ArrowRight size={18} />
        </button>

        {isOwnerPlan && (
          <button
            className="hero-btn"
            style={{ marginTop: 8, background: "#475569" }}
            onClick={() => navigate("/admin/requests")}
          >
            Заявки на тарифи
            <ArrowRight size={18} />
          </button>
        )}
      </section>
    </div>
  );
}