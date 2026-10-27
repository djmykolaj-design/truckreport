import { useEffect, useState } from "react";
import { getMyProfile, isBoss } from "../services/profile";
import Dashboard from "./Dashboard";
import BossDashboard from "./BossDashboard";

// Головна: шеф бачить свій кабінет, водій — звичайну головну.
export default function Home() {
  const [profile, setProfile] = useState(undefined);

  useEffect(() => {
    getMyProfile().then(setProfile);
  }, []);

  if (profile === undefined) return <p style={{ color: "#94a3b8" }}>Завантаження…</p>;

  return isBoss(profile) ? <BossDashboard /> : <Dashboard />;
}