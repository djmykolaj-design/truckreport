import "./MainLayout.css";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import "../../styles/page.css";
import { useLocation } from "react-router-dom";

export default function MainLayout({ children }) {
  const location = useLocation();
  const isLogin = location.pathname === "/login";

  // На сторінці логіну — без меню
  if (isLogin) {
    return <>{children}</>;
  }

  return (
    <div className="layout">
      <div className="desktop-only">
        <Sidebar />
      </div>

      <main className="layout-content">
        {children}
      </main>

      <div className="mobile-only">
        <BottomNav />
      </div>
    </div>
  );
}