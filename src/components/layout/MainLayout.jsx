import "./MainLayout.css";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import "../../styles/page.css";

export default function MainLayout({ children }) {
  return (
    <div className="layout">
      {/* Сайдбар тільки для десктопу */}
      <div className="desktop-only">
        <Sidebar />
      </div>

      <main className="layout-content">
        {children}
      </main>

      {/* Нижня навігація тільки для мобільних */}
      <div className="mobile-only">
        <BottomNav />
      </div>
    </div>
  );
}