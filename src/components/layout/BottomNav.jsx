import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Truck,
  Globe2,
} from "lucide-react";
import "./BottomNav.css";

export default function BottomNav() {
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
    </nav>
  );
}