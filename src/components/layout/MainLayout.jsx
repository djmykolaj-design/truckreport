import { useLocation } from "react-router-dom";
import "./MainLayout.css";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import "../../styles/page.css";

export default function MainLayout({ children }) {
  const location = useLocation();
  const hideNav =
    location.pathname === "/login" || location.pathname === "/setup";

  if (hideNav) {
    return <main className="layout-content">{children}</main>;
  }

  return (
    <div className="layout">
      <div className="desktop-only">
        <Sidebar />
      </div>

      <main className="layout-content">{children}</main>

      <div className="mobile-only">
        <BottomNav />
      </div>
    </div>
  );
}