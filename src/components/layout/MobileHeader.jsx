import logo from "../../assets/truckreport-logo.png";
import "./MobileHeader.css";

export default function MobileHeader() {
  return (
    <header className="mobile-header">
      <img
        src={logo}
        alt="TruckReport"
        className="mobile-header-logo"
      />
      <div className="mobile-header-text">
        <div className="mobile-header-title">TruckReport</div>
        <div className="mobile-header-sub">Для далекобійників</div>
      </div>
    </header>
  );
}