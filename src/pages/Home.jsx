import { useEffect, useState } from "react";
import { getMyProfile, isManager } from "../services/profile";
import Dashboard from "./Dashboard";
import BossDashboard from "./BossDashboard";
import StaffDashboard from "./StaffDashboard";
import NamePrompt from "../components/NamePrompt";

// Головна залежить від ролі:
// керівник і заступник бачать кабінет керівника, логіст і механік свою головну,
// водій і самостійний водій звичайну.
// Угорі, якщо в профілі немає імені, показується картка «Вкажіть прізвище та ім'я».
export default function Home() {
  const [profile, setProfile] = useState(undefined);

  useEffect(() => {
    getMyProfile().then(setProfile);
  }, []);

  if (profile === undefined) return <p style={{ color: "#94a3b8" }}>Завантаження…</p>;

  let page;

  if (isManager(profile)) page = <BossDashboard />;
  else if (profile?.role === "logist" || profile?.role === "mechanic") page = <StaffDashboard />;
  else page = <Dashboard />;

  return (
    <>
      <NamePrompt />
      {page}
    </>
  );
}