import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";

import "./Sidebar.css";
import logo from "../../assets/truckreport-logo.png";
import { supabase } from "../../lib/supabase";
import { getMyProfile } from "../../services/profile";
import { getNavItems } from "../../services/navigation";

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

  const items = getNavItems(profile);

  const linkClass = ({ isActive }) =>
    `sidebar-link ${isActive ? "active" : ""}`;

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <img src={logo} alt="TruckReport" className="sidebar-brand" />
      </div>

      <nav className="sidebar-menu">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={linkClass}>
            <Icon size={22} />
            <span>{label}</span>
          </NavLink>
        ))}
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