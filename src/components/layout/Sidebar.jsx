import { NavLink } from "react-router-dom";
import {
    LayoutDashboard,
    Truck,
    Globe2,
} from "lucide-react";

import "./Sidebar.css";
import logo from "../../assets/truckreport-logo.png";

export default function Sidebar() {
    return (
        <aside className="sidebar">

            <div className="sidebar-header">
                <img
                    src={logo}
                    alt="TruckReport"
                    className="sidebar-brand"
                />
            </div>

            <nav className="sidebar-menu">

                <NavLink
                    to="/"
                    end
                    className={({ isActive }) =>
                        `sidebar-link ${isActive ? "active" : ""}`
                    }
                >
                    <LayoutDashboard size={22} />
                    <span>Головна</span>
                </NavLink>

                <NavLink
                    to="/trips"
                    className={({ isActive }) =>
                        `sidebar-link ${isActive ? "active" : ""}`
                    }
                >
                    <Truck size={22} />
                    <span>Рейси</span>
                </NavLink>

                <NavLink
                    to="/schengen"
                    className={({ isActive }) =>
                        `sidebar-link ${isActive ? "active" : ""}`
                    }
                >
                    <Globe2 size={22} />
                    <span>Шенген</span>
                </NavLink>

            </nav>

          
        </aside>
    );
}