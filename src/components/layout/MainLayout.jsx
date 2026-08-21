import "./MainLayout.css";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import MobileHeader from "./MobileHeader";
import "../../styles/page.css";
import { useLocation } from "react-router-dom";

export default function MainLayout({ children }) {
  const location = useLocation();
  const isLogin = location.pathname === "/login";

  // На сторінці логіну — без меню і шапки
  if (isLogin) {
    return <>{children}</>;
  }

  return (
    <div className="layout">
      {/* Сайдбар тільки на десктопі */}
      <div className="desktop-only">
        <Sidebar />
      </div>

      <main className="layout-content">
        {/* Шапка тільки на мобільному */}
        <MobileHeader />
        {children}
      </main>

      {/* Нижнє меню тільки на мобільному */}
      <div className="mobile-only">
        <BottomNav />
      </div>
    </div>
  );
}