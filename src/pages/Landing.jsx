import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Truck,
  Globe2,
  Wallet,
  Wrench,
  Users,
  BarChart3,
  AlertTriangle,
  FileText,
  Download,
} from "lucide-react";
import logo from "../assets/truckreport-logo.png";
import "./Landing.css";

function useInstall() {
  const [promptEvent, setPromptEvent] = useState(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;
    if (standalone) setInstalled(true);

    const onPrompt = (event) => {
      event.preventDefault();
      setPromptEvent(event);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = async () => {
    if (!promptEvent) return false;
    promptEvent.prompt();
    try {
      await promptEvent.userChoice;
    } catch {
      /* користувач закрив вікно */
    }
    setPromptEvent(null);
    return true;
  };

  return { canInstall: Boolean(promptEvent), installed, install };
}

function detectPlatform() {
  const ua = navigator.userAgent || "";
  if (/iPhone|iPad|iPod/i.test(ua)) return "iphone";
  if (/Android/i.test(ua)) return "android";
  return "windows";
}

const DRIVER_ITEMS = [
  {
    icon: Wallet,
    title: "Рейси й витрати",
    text: "Активний рейс, заправки, витрати в євро, злотих, гривнях і доларах, документи та PDF-звіт по рейсу.",
  },
  {
    icon: Globe2,
    title: "Шенген 90/180",
    text: "Лічильник днів, відмітка в'їзду й виїзду одним дотиком, дата, до якої треба виїхати, планувальник поїздки.",
  },
  {
    icon: AlertTriangle,
    title: "Поломки",
    text: "Повідомте шефа про поломку прямо з додатка, без дзвінків і повідомлень у месенджерах.",
  },
];

const BOSS_ITEMS = [
  {
    icon: Wrench,
    title: "Автопарк",
    text: "Машини зі статусами, ТО за пробігом і датою, прострочене обслуговування видно на головній.",
  },
  {
    icon: BarChart3,
    title: "Ремонти й гроші",
    text: "Ремонти в гривнях, злотих, євро й доларах, графіки пробігу й витрат за 6 і 12 місяців.",
  },
  {
    icon: Users,
    title: "Водії й рейси",
    text: "Хто зараз у дорозі, рейси всіх водіїв фірми, шенген кожного водія, документи з датами закінчення.",
  },
];

const INSTALL_STEPS = {
  android: {
    label: "Android",
    note: "У браузері Chrome.",
    steps: [
      "Відкрийте цю сторінку в Chrome.",
      "Натисніть меню ⋮ праворуч угорі й виберіть «Встановити програму» (або «Додати на головний екран»).",
      "Підтвердьте. Іконка Truckreport з'явиться серед ваших додатків.",
    ],
  },
  iphone: {
    label: "iPhone",
    note: "Тільки в Safari: інші браузери на iPhone не вміють додавати додатки.",
    steps: [
      "Відкрийте цю сторінку в Safari.",
      "Натисніть кнопку «Поділитись» (квадрат зі стрілкою) унизу екрана.",
      "Виберіть «На початковий екран» і натисніть «Додати».",
    ],
  },
  windows: {
    label: "Windows",
    note: "У браузері Edge або Chrome.",
    steps: [
      "Відкрийте цю сторінку в Edge або Chrome.",
      "Натисніть значок встановлення в кінці адресного рядка (монітор зі стрілкою) або меню → «Встановити».",
      "Truckreport відкриється в окремому вікні, і його можна закріпити на панелі завдань.",
    ],
  },
};

function PhoneMockup() {
  return (
    <div className="lp-phone" aria-hidden="true">
      <div className="lp-phone-note">Приклад</div>

      <div className="lp-mock-card">
        <div className="lp-mock-top">
          <span className="lp-mock-title">
            <Truck size={14} /> Активний рейс
          </span>
          <span className="lp-mock-badge">У дорозі</span>
        </div>
        <div className="lp-mock-route">Київ → Стокгольм</div>
        <div className="lp-mock-stats">
          <div>
            <b>400 000 км</b>
            <span>На старті</span>
          </div>
          <div>
            <b>312 л</b>
            <span>Пальне</span>
          </div>
          <div>
            <b>240 €</b>
            <span>Витрати</span>
          </div>
        </div>
      </div>

      <div className="lp-mock-card lp-mock-schengen">
        <div className="lp-mock-top">
          <span className="lp-mock-title">Шенгенські дні</span>
          <span className="lp-mock-big">
            34<small>/90</small>
          </span>
        </div>
        <div className="lp-mock-sub">Використано 56 з 90</div>
        <div className="lp-mock-bar">
          <i style={{ width: "62%" }} />
        </div>
        <div className="lp-mock-exit">Виїхати до 28.12.2026</div>
      </div>
    </div>
  );
}

function FeatureColumn({ title, subtitle, items }) {
  return (
    <section className="lp-col">
      <h3>{title}</h3>
      <p className="lp-col-sub">{subtitle}</p>
      {items.map(({ icon: Icon, title: itemTitle, text }) => (
        <div className="lp-row" key={itemTitle}>
          <Icon size={20} className="lp-row-icon" />
          <div>
            <b>{itemTitle}</b>
            <p>{text}</p>
          </div>
        </div>
      ))}
    </section>
  );
}

export default function Landing() {
  const { canInstall, installed, install } = useInstall();
  const [platform, setPlatform] = useState("windows");

  useEffect(() => {
    setPlatform(detectPlatform());
  }, []);

  const handleInstall = async () => {
    const done = await install();
    if (!done) {
      document
        .getElementById("install")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const guide = INSTALL_STEPS[platform];

  return (
    <div className="lp">
      <div className="lp-wrap">
        <header className="lp-header">
          <img src={logo} alt="Truckreport" className="lp-logo" />
          <Link to="/login" className="lp-link">
            Увійти
          </Link>
        </header>

        <section className="lp-hero">
          <div className="lp-hero-text">
            <h1>
              Рейси, витрати і шенген — у телефоні водія. Автопарк — на екрані
              шефа.
            </h1>
            <p className="lp-lead">
              Truckreport веде облік рейсів, заправок і документів, рахує
              шенгенські дні 90/180 і показує шефу автопарк, ТО та ремонти.
              Працює в браузері й встановлюється на телефон як додаток.
            </p>

            <div className="lp-actions">
              {!installed && (
                <button
                  type="button"
                  className="lp-btn lp-btn--primary"
                  onClick={handleInstall}
                >
                  <Download size={18} />
                  Встановити додаток
                </button>
              )}
              <Link
                to="/login"
                className={`lp-btn ${installed ? "lp-btn--primary" : "lp-btn--ghost"}`}
              >
                Увійти через Google
              </Link>
            </div>

            <Link to="/demo" className="lp-demo-link">
              Подивитись демо без реєстрації
            </Link>
          </div>

          <PhoneMockup />
        </section>
      </div>

      <section className="lp-section">
        <div className="lp-wrap">
          <h2>Що вміє Truckreport</h2>
          <div className="lp-cols">
            <FeatureColumn
              title="Для водія"
              subtitle="Усе, що потрібно в рейсі."
              items={DRIVER_ITEMS}
            />
            <FeatureColumn
              title="Для шефа"
              subtitle="Усе, що потрібно в офісі."
              items={BOSS_ITEMS}
            />
          </div>
        </div>
      </section>

      <section className="lp-section lp-section--alt">
        <div className="lp-wrap">
          <h2>Скільки це коштує</h2>
          <p className="lp-section-lead">
            Починайте безкоштовно. Платні плани з'являться найближчим часом, а
            те, що ви вже ведете, нікуди не зникне.
          </p>

          <div className="lp-plans">
            <div className="lp-plan lp-plan--now">
              <h3>Безкоштовний</h3>
              <p>
                Активний рейс, шенген і 3 останні рейси в історії. Без картки й
                без терміну.
              </p>
            </div>
            <div className="lp-plan">
              <h3>Pro для водія</h3>
              <p>Уся історія рейсів, експорт і аналітика. Скоро.</p>
            </div>
            <div className="lp-plan">
              <h3>Business для фірми</h3>
              <p>
                Ціна за машину зменшується, чим більший автопарк. Причепи не
                рахуються. Скоро.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-section" id="install">
        <div className="lp-wrap">
          <h2>Як встановити</h2>
          <p className="lp-section-lead">
            Магазин не потрібен: додаток ставиться прямо з браузера й
            оновлюється сам.
          </p>

          <div className="lp-tabs" role="tablist" aria-label="Платформа">
            {Object.entries(INSTALL_STEPS).map(([key, value]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={platform === key}
                className={`lp-tab ${platform === key ? "is-active" : ""}`}
                onClick={() => setPlatform(key)}
              >
                {value.label}
              </button>
            ))}
          </div>

          <p className="lp-install-note">{guide.note}</p>

          <ol className="lp-steps">
            {guide.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>

          {canInstall && (
            <button
              type="button"
              className="lp-btn lp-btn--primary"
              onClick={handleInstall}
            >
              <Download size={18} />
              Встановити зараз
            </button>
          )}
        </div>
      </section>

      <section className="lp-section lp-section--alt">
        <div className="lp-wrap lp-final">
          <h2>Спробуйте на наступному рейсі</h2>
          <p className="lp-section-lead">
            Вхід через Google займає кілька секунд. Налаштувати нічого не треба.
          </p>
          <div className="lp-actions">
            <Link to="/login" className="lp-btn lp-btn--primary">
              Увійти через Google
            </Link>
            <Link to="/demo" className="lp-btn lp-btn--ghost">
              Демо
            </Link>
          </div>
        </div>
      </section>

      <footer className="lp-footer">
        <div className="lp-wrap lp-footer-row">
          <span>© {new Date().getFullYear()} Truckreport</span>
          <nav className="lp-footer-links">
            <Link to="/terms">Умови користування</Link>
            <Link to="/privacy">Політика конфіденційності</Link>
            <Link to="/login">Вхід</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}