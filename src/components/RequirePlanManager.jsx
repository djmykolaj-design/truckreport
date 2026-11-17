import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getMyProfile, roleCan } from "../services/profile";

// Тарифи бачать ті, хто сам за них відповідає:
//  - користувачі без фірми (самостійний водій);
//  - керівник фірми (право plan.manage).
// Заступник, логіст, механік і водій у складі фірми тариф не оплачують,
// тому їх повертаємо на головну. Це лише інтерфейс, справжній захист у базі.
export default function RequirePlanManager({ children }) {
  const [profile, setProfile] = useState(undefined);

  useEffect(() => {
    getMyProfile().then(setProfile);
  }, []);

  if (profile === undefined) {
    return <p style={{ color: "var(--text-secondary)" }}>Завантаження…</p>;
  }

  const allowed = !profile?.company_id || roleCan(profile, "plan.manage");

  return allowed ? children : <Navigate to="/" replace />;
}