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

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <img src={logo} alt="TruckReport" className="sidebar-brand" />
      </div>

      <nav className="sidebar-menu">
        <NavLink to="/" end className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}>
          <LayoutDashboard size={22} />
          <span>Головна</span>
        </NavLink>

        {driver && (
          <>
            <NavLink to="/trips" className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}>
              <Truck size={22} />
              <span>Рейси</span>
            </NavLink>

            <NavLink to="/schengen" className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}>
              <Globe2 size={22} />
              <span>Шенген</span>
            </NavLink>

            <NavLink to="/report-breakdown" className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}>
              <AlertTriangle size={22} />
              <span>Поломка</span>
            </NavLink>
          </>
        )}

        {boss && (
          <>
            <NavLink to="/fleet" className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}>
              <Wrench size={22} />
              <span>Автопарк</span>
            </NavLink>

            <NavLink to="/office" className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}>
              <Users size={22} />
              <span>Водії</span>
            </NavLink>

            <NavLink to="/company" className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}>
              <Briefcase size={22} />
              <span>Офіс</span>
            </NavLink>
          </>
        )}
      </nav>

      <button
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