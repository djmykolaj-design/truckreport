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
  Download,
  MessageCircle,
  Phone,
  Check,
} from "lucide-react";
import logo from "../assets/truckreport-logo.png";
import "./Landing.css";

const CONTACT_PHONE_DISPLAY = "+380 68 026 94 78";
const CONTACT_PHONE_DIGITS = "380680269478";
const WHATSAPP_URL = `https://wa.me/${CONTACT_PHONE_DIGITS}?text=${encodeURIComponent(
  "Доброго дня! Питання щодо Truckreport"
)}`;
const VIBER_URL = `viber://chat?number=%2B${CONTACT_PHONE_DIGITS}`;

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
    text: "Повідомте керівника про поломку прямо з додатка, без дзвінків і повідомлень у месенджерах.",
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

// Скріни лежать у public/screens/. Якщо файлу ще немає, картка не показується.
const SHOTS = [
  {
    file: "dashboard.png",
    title: "Головна",
    text: "Активний рейс, пальне, витрати й шенгенські дні на одному екрані.",
  },
  {
    file: "new-trip.png",
    title: "Новий рейс",
    text: "Стартовий пробіг підставляється сам з останнього рейсу машини.",
  },
  {
    file: "trip-menu.png",
    title: "Рейс",
    text: "Пальне, обмін валют, витрати, документи й завершення рейсу.",
  },
  {
    file: "expenses.png",
    title: "Витрати",
    text: "Витрати по категоріях у кожній валюті окремо.",
  },
  {
    file: "schengen.png",
    title: "Шенген",
    text: "Скільки днів залишилось і до якої дати треба виїхати.",
  },
  {
    file: "report.png",
    title: "PDF-звіт",
    text: "Готовий звіт по рейсу: пальне, гроші й витрати.",
  },
  {
    file: "report2.png",
    title: "PDF-звіт, друга сторінка",
    text: "Підсумки по пальному, рефрижератору й витратах у кожній валюті.",
  },
  {
    file: "fleet.png",
    title: "Автопарк",
    text: "Машини зі статусами та ТО для керівника фірми.",
  },
  {
    file: "boss.png",
    title: "Кабінет керівника",
    text: "Усі машини, водії та ТО фірми на одному екрані. Видно, хто вільний, хто в рейсі, а кому час на ТО.",
  },
];

const PLANS = [
  {
    name: "Безкоштовний",
    price: "0 грн",
    period: "без терміну й без картки",
    audience: "Щоб спробувати й вести рейси щодня",
    now: true,
    features: [
      "Активний рейс, заправки й витрати в євро, злотих, гривнях і доларах",
      "Лічильник Шенгену 90/180 з відміткою в'їзду й виїзду",
      "PDF-звіт по рейсу",
      "Документи рейсу й хмарне збереження даних",
      "У списку видно активні та 3 останні рейси, решта збережена",
    ],
  },
  {
    name: "Pro для водія",
    price: "150 грн",
    period: "на місяць",
    audience: "Для водія, який їздить постійно",
    features: [
      "Усе з безкоштовного плану",
      "Уся історія рейсів без обмежень",
      "Планувальник поїздки: чи вкладаєтесь у 90/180",
      "Експорт рейсу в Excel",
      "Аналітика та графіки по рейсах",
    ],
  },
  {
    name: "Business для фірми",
    price: "від 250 грн",
    period: "за авто на місяць, у великих парках дешевше",
    audience: "Для фірми з кількома машинами",
    features: [
      "Усе з Pro для кожного працівника фірми, без окремої оплати",
      "Автопарк: статуси машин, ТО за пробігом і датою, ремонти",
      "Кабінет керівника: водії, рейси, шенген кожного водія",
      "Ролі: заступник, логіст, механік, водій",
      "Перші 20 авто по 250 грн, з 21-го по 50-те по 210 грн, з 51-го по 100-те по 170 грн",
      "Причепи та працівники не рахуються: платите лише за машини",
      "Перший місяць безкоштовно",
    ],
  },
];

const FREE = "Безкоштовний";
const COMPARE_ROWS = [
  { label: "Активний рейс, заправки, витрати в 4 валютах", values: [true, true, true] },
  { label: "Лічильник Шенгену 90/180", values: [true, true, true] },
  { label: "PDF-звіт по рейсу", values: [true, true, true] },
  { label: "Історія рейсів", values: ["3 останні", "Уся", "Уся"] },
  { label: "Планувальник поїздки в Шенген", values: [false, true, true] },
  { label: "Експорт в Excel", values: [false, true, true] },
  { label: "Аналітика та графіки", values: [false, true, true] },
  { label: "Автопарк, ТО, ремонти", values: [false, false, true] },
  { label: "Кабінет керівника та ролі", values: [false, false, true] },
  { label: "Повна версія для всіх працівників фірми", values: [false, false, true] },
];

const PRICING_NOTES = [
  {
    title: "Картка не потрібна",
    text: "Безкоштовний план працює без терміну. Платити нікого не змушуємо.",
  },
  {
    title: "Дані нікуди не зникають",
    text: "Якщо платний план закінчився, ваші рейси лишаються збереженими. Ви бачите менше, поки не продовжите, але нічого не втрачаєте.",
  },
  {
    title: "За фірму платить керівник",
    text: "Водії, яких він додав, отримують повну версію без окремої оплати. Водій може мати й власний платний план: береться вищий.",
  },
  {
    title: "Знижка діє на діапазон, а не на весь парк",
    text: "Перші 20 машин коштують по 250 грн, наступні до 50-ї по 210 грн, далі по 170 грн. Парк із 21 машини не отримує 210 грн за кожну: 21-а машина коштує 210 грн, а перші 20 лишаються по 250.",
  },
  {
    title: "Ціни в гривнях",
    text: "Без конвертації за курсом і без прихованих платежів.",
  },
  {
    title: "Оплату ще не підключено",
    text: "Залиште заявку на сторінці тарифів або напишіть нам, і ми повідомимо, коли платні плани запрацюють.",
  },
];

const FAQ = [
  {
    q: "Чи платити зараз?",
    a: "Ні. Безкоштовний план працює без терміну й без картки. Оплату платних планів ми ще не підключили: на сторінці тарифів можна залишити заявку, і ми напишемо, коли вони запрацюють.",
  },
  {
    q: "Чи замінює лічильник Шенгену офіційний облік?",
    a: "Ні. Це допоміжний інструмент, який рахує дні за правилом 90/180 за датами, що ви внесли. Остаточне рішення завжди за прикордонною службою, тому звіряйте дати зі штампами в паспорті.",
  },
  {
    q: "Чи треба ставити додаток із магазину?",
    a: "Ні. Truckreport працює в браузері й встановлюється на телефон прямо зі сторінки, а оновлюється сам. Покрокова інструкція для Android, iPhone та Windows вище.",
  },
  {
    q: "Хто бачить мої дані?",
    a: "Ви й ваша фірма. Рейси водія бачить сам водій та керівник фірми, до якої він приєднаний. Заступник, логіст і механік бачать лише те, що потрібно для їхньої роботи: логіст рейси й документи, механік автопарк і ремонти. Водій без фірми працює сам, і його дані ніхто більше не бачить.",
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

function CompareCell({ value }) {
  if (value === true) {
    return (
      <span className="lp-yes">
        <Check size={18} aria-hidden="true" />
        <span className="lp-sr">Так</span>
      </span>
    );
  }

  if (value === false) {
    return (
      <span className="lp-no" aria-label="Ні">
        —
      </span>
    );
  }

  return <span className="lp-cell-text">{value}</span>;
}

export default function Landing() {
  const { canInstall, installed, install } = useInstall();
  const [platform, setPlatform] = useState("windows");
  const [missingShots, setMissingShots] = useState({});

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

  const hideShot = (file) =>
    setMissingShots((prev) => ({ ...prev, [file]: true }));

  const visibleShots = SHOTS.filter((shot) => !missingShots[shot.file]);

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
              керівника.
            </h1>
            <p className="lp-lead">
              Truckreport веде облік рейсів, заправок і документів, рахує
              шенгенські дні 90/180 і показує керівнику автопарк, ТО та ремонти.
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
              title="Для керівника"
              subtitle="Усе, що потрібно в офісі."
              items={BOSS_ITEMS}
            />
          </div>
        </div>
      </section>

      {visibleShots.length > 0 && (
        <section className="lp-section lp-section--alt" id="screens">
          <div className="lp-wrap">
            <h2>Як це виглядає</h2>
            <p className="lp-section-lead">
              Справжні екрани з додатка: те, що водій бачить у рейсі, і те, що
              отримує керівник.
            </p>

            <div className="lp-shots">
              {visibleShots.map((shot) => (
                <figure className="lp-shot" key={shot.file}>
                  <img
                    src={`/screens/${shot.file}`}
                    alt={shot.title}
                    loading="lazy"
                    onError={() => hideShot(shot.file)}
                  />
                  <figcaption>
                    <b>{shot.title}</b>
                    <span>{shot.text}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="lp-section" id="pricing">
        <div className="lp-wrap">
          <h2>Скільки це коштує</h2>
          <p className="lp-section-lead">
            Починайте безкоштовно. Те, що ви вже ведете, нікуди не зникне, коли
            з'являться платні плани. Ціни в гривнях, без конвертації за курсом.
          </p>

          <div className="lp-plans">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`lp-plan ${plan.now ? "lp-plan--now" : ""}`}
              >
                <h3>{plan.name}</h3>
                <p className="lp-plan-for">{plan.audience}</p>
                <div className="lp-plan-price">
                  {plan.price}
                  <small>{plan.period}</small>
                </div>
                <ul className="lp-plan-list">
                  {plan.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <h3 className="lp-subtitle">Що входить у кожен план</h3>

          <div className="lp-compare-wrap">
            <table className="lp-compare">
              <thead>
                <tr>
                  <th scope="col">Можливість</th>
                  <th scope="col">{FREE}</th>
                  <th scope="col">Pro</th>
                  <th scope="col">Business</th>
                </tr>
              </thead>
              <tbody>
                {COMPARE_ROWS.map((row) => (
                  <tr key={row.label}>
                    <th scope="row">{row.label}</th>
                    {row.values.map((value, index) => (
                      <td key={index}>
                        <CompareCell value={value} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="lp-example">
            <b>Приклад для Business</b>
            <p>
              Фірма з 25 тягачами, 8 причепами, заступником і логістом платить
              лише за 25 машин: 20 × 250 + 5 × 210 = 6 050 грн на місяць.
              Причепи й працівники не рахуються, а перший місяць безкоштовно.
            </p>
          </div>

          <h3 className="lp-subtitle">Важливо знати</h3>

          <div className="lp-notes">
            {PRICING_NOTES.map((note) => (
              <div className="lp-note" key={note.title}>
                <b>{note.title}</b>
                <p>{note.text}</p>
              </div>
            ))}
          </div>

          <div className="lp-actions">
            <Link to="/pricing" className="lp-btn lp-btn--ghost">
              Дивитись тарифи
            </Link>
            <a href="#contacts" className="lp-btn lp-btn--ghost">
              Запитати нас
            </a>
          </div>
        </div>
      </section>

      <section className="lp-section lp-section--alt" id="install">
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

      <section className="lp-section" id="faq">
        <div className="lp-wrap">
          <h2>Поширені питання</h2>

          <div className="lp-faq">
            {FAQ.map((item) => (
              <details className="lp-faq-item" key={item.q}>
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-section lp-section--alt" id="contacts">
        <div className="lp-wrap lp-final">
          <h2>Зв'язатися</h2>
          <p className="lp-section-lead">
            Питання по додатку, підключення фірми чи пропозиція: напишіть у
            Viber або WhatsApp, відповімо особисто.
          </p>

          <div className="lp-contact-phone">
            <Phone size={18} />
            <a href={`tel:+${CONTACT_PHONE_DIGITS}`}>{CONTACT_PHONE_DISPLAY}</a>
          </div>

          <div className="lp-actions lp-contact-actions">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="lp-btn lp-btn--primary"
            >
              <MessageCircle size={18} />
              WhatsApp
            </a>
            <a href={VIBER_URL} className="lp-btn lp-btn--ghost">
              <MessageCircle size={18} />
              Viber
            </a>
          </div>
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-wrap lp-final">
          <h2>Спробуйте в наступному рейсі</h2>
          <p className="lp-section-lead">
            Вхід через Google займає кілька секунд. Налаштовувати нічого не
            потрібно.
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
            <a href="#contacts">Контакти</a>
            <Link to="/terms">Умови користування</Link>
            <Link to="/privacy">Політика конфіденційності</Link>
            <Link to="/login">Вхід</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}