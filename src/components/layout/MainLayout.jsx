import { useLocation } from "react-router-dom";
import "./MainLayout.css";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import "../../styles/page.css";

const NO_NAV_PATHS = ["/login", "/setup", "/demo", "/privacy", "/terms"];

export default function MainLayout({ children }) {
  const location = useLocation();
  const hideNav = NO_NAV_PATHS.includes(location.pathname);

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