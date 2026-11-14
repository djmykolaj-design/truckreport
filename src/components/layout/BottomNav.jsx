import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import "./BottomNav.css";
import { supabase } from "../../lib/supabase";
import { getMyProfile } from "../../services/profile";
import { getNavItems } from "../../services/navigation";

export default function BottomNav() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    getMyProfile().then(setProfile);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const items = getNavItems(profile).filter((item) => item.mobile !== false);

  // Унизу вміщається п'ять пунктів. Якщо їх п'ять, «Вийти» переходить в «Офіс → Фірма».
  const showLogout = items.length <= 4;

  const itemClass = ({ isActive }) =>
    `bottom-nav-item ${isActive ? "active" : ""}`;

  return (
    <nav className="bottom-nav">
      {items.map(({ to, label, icon: Icon, end }) => (
        <NavLink key={to} to={to} end={end} className={itemClass}>
          <Icon size={22} />
          <span>{label}</span>
        </NavLink>
      ))}

      {showLogout && (
        <button
          type="button"
          className="bottom-nav-item"
          onClick={handleLogout}
        >
          <LogOut size={22} />
          <span>Вийти</span>
        </button>
      )}
    </nav>
  );
}