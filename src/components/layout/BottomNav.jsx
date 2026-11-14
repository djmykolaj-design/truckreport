import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Truck,
  Globe2,
  Warehouse,
  Briefcase,
  LogOut,
  AlertTriangle,
  Users,
  Crown,
} from "lucide-react";
import "./BottomNav.css";
import { supabase } from "../../lib/supabase";
import { getMyProfile, isBoss } from "../../services/profile";

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

  const boss = isBoss(profile);
  const driver = profile && !boss;
  const inCompany = Boolean(profile?.company_id);

  const itemClass = ({ isActive }) =>
    `bottom-nav-item ${isActive ? "active" : ""}`;

  return (
    <nav className="bottom-nav">
      <NavLink to="/" end className={itemClass}>
        <LayoutDashboard size={22} />
        <span>Головна</span>
      </NavLink>

      {driver && (
        <>
          <NavLink to="/trips" className={itemClass}>
            <Truck size={22} />
            <span>Рейси</span>
          </NavLink>

          <NavLink to="/schengen" className={itemClass}>
            <Globe2 size={22} />
            <span>Шенген</span>
          </NavLink>

          {inCompany ? (
            <NavLink to="/report-breakdown" className={itemClass}>
              <AlertTriangle size={22} />
              <span>Поломка</span>
            </NavLink>
          ) : (
            <NavLink to="/pricing" className={itemClass}>
              <Crown size={22} />
              <span>Тарифи</span>
            </NavLink>
          )}
        </>
      )}

      {boss && (
        <>
          <NavLink to="/fleet" className={itemClass}>
            <Warehouse size={22} />
            <span>Автопарк</span>
          </NavLink>

          <NavLink to="/office" className={itemClass}>
            <Users size={22} />
            <span>Водії</span>
          </NavLink>

          <NavLink to="/company" className={itemClass}>
            <Briefcase size={22} />
            <span>Офіс</span>
          </NavLink>
        </>
      )}

            <button
        type="button"
        className="bottom-nav-item"
        onClick={handleLogout}
      >
        <LogOut size={22} />
        <span>Вийти</span>
      </button>
    </nav>
  );
}