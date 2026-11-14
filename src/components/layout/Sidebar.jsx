import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Truck,
  Globe2,
  Briefcase,
  LogOut,
  Wrench,
  AlertTriangle,
  Users,
  CreditCard,
} from "lucide-react";

import "./Sidebar.css";
import logo from "../../assets/truckreport-logo.png";
import { supabase } from "../../lib/supabase";
import { getMyProfile, isBoss } from "../../services/profile";

export default function Sidebar() {
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

  const linkClass = ({ isActive }) =>
    `sidebar-link ${isActive ? "active" : ""}`;

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <img src={logo} alt="TruckReport" className="sidebar-brand" />
      </div>

      <nav className="sidebar-menu">
        <NavLink to="/" end className={linkClass}>
          <LayoutDashboard size={22} />
          <span>Головна</span>
        </NavLink>

        {driver && (
          <>
            <NavLink to="/trips" className={linkClass}>
              <Truck size={22} />
              <span>Рейси</span>
            </NavLink>

            <NavLink to="/schengen" className={linkClass}>
              <Globe2 size={22} />
              <span>Шенген</span>
            </NavLink>

            {inCompany && (
              <NavLink to="/report-breakdown" className={linkClass}>
                <AlertTriangle size={22} />
                <span>Поломка</span>
              </NavLink>
            )}
          </>
        )}

        {boss && (
          <>
            <NavLink to="/fleet" className={linkClass}>
              <Wrench size={22} />
              <span>Автопарк</span>
            </NavLink>

            <NavLink to="/office" className={linkClass}>
              <Users size={22} />
              <span>Водії</span>
            </NavLink>

            <NavLink to="/company" className={linkClass}>
              <Briefcase size={22} />
              <span>Офіс</span>
            </NavLink>
          </>
        )}

        {profile && (
          <NavLink to="/pricing" className={linkClass}>
            <CreditCard size={22} />
            <span>Тарифи</span>
          </NavLink>
        )}
      </nav>

      <button
        type="button"
        onClick={handleLogout}
        className="sidebar-link"
        style={{
          marginTop: "auto",
          width: "100%",
          border: "none",
          background: "transparent",
          cursor: "pointer",
          color: "#94a3b8",
        }}
      >
        <LogOut size={22} />
        <span>Вийти</span>
      </button>
    </aside>
  );
}