import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getMyProfile, roleCan, isOfficeRole } from "../services/profile";

// Пускає на сторінку лише ті ролі, яким вона дозволена.
//   <RequireRole perm="fleet.view">…</RequireRole>        — одне право
//   <RequireRole any={["breakdown.report", "breakdown.view"]}>…</RequireRole> — будь-яке з прав
//   <RequireRole office>…</RequireRole>                   — будь-яка роль фірми (керівник, заступник, логіст, механік)
// Інші бачать головну. Це лише інтерфейс, справжній захист — у базі.
export default function RequireRole({ perm, any, office, children }) {
  const [profile, setProfile] = useState(undefined);

  useEffect(() => {
    getMyProfile().then(setProfile);
  }, []);

  if (profile === undefined) {
    return <p style={{ color: "var(--text-secondary)" }}>Завантаження…</p>;
  }

  let allowed = false;

  if (office) allowed = isOfficeRole(profile);
  else if (any) allowed = any.some((p) => roleCan(profile, p));
  else if (perm) allowed = roleCan(profile, perm);

  return allowed ? children : <Navigate to="/" replace />;
}