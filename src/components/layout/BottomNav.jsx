import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Truck,
  Globe2,
  LogOut,
} from "lucide-react";
import "./BottomNav.css";
import { supabase } from "../../lib/supabase";

export default function BottomNav() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <nav className="bottom-nav">
      <NavLink
        to="/"
        end
        className={({ isActive }) =>
          `bottom-nav-item ${isActive ? "active" : ""}`
        }
      >
        <LayoutDashboard size={22} />
        <span>Головна</span>
      </NavLink>

      <NavLink
        to="/trips"
        className={({ isActive }) =>
          `bottom-nav-item ${isActive ? "active" : ""}`
        }
      >
        <Truck size={22} />
        <span>Рейси</span>
      </NavLink>

      <NavLink
        to="/schengen"
        className={({ isActive }) =>
          `bottom-nav-item ${isActive ? "active" : ""}`
        }
      >
        <Globe2 size={22} />
        <span>Шенген</span>
      </NavLink>

      <button
        type="button"
        className="bottom-nav-item"
        onClick={handleLogout}
        style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          color: "inherit",
        }}
      >
        <LogOut size={22} />
        <span>Вийти</span>
      </button>
    </nav>
  );
}