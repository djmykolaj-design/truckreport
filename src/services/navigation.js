import {
  LayoutDashboard,
  Truck,
  Globe2,
  Warehouse,
  Briefcase,
  AlertTriangle,
  Users,
  CreditCard,
} from "lucide-react";
import { hasCompany } from "./profile";

const HOME = { to: "/", label: "Головна", icon: LayoutDashboard, end: true };
const TRIPS = { to: "/trips", label: "Рейси", icon: Truck };
const SCHENGEN = { to: "/schengen", label: "Шенген", icon: Globe2 };
const FLEET = { to: "/fleet", label: "Автопарк", icon: Warehouse };
const DRIVERS = { to: "/office", label: "Водії", icon: Users };
const TEAM = { to: "/office", label: "Команда", icon: Users };
const OFFICE = { to: "/company", label: "Офіс", icon: Briefcase };
const PRICING = { to: "/pricing", label: "Тарифи", icon: CreditCard };

// mobile: false = пункт є лише в бічній панелі на комп'ютері
export function getNavItems(profile) {
  if (!profile) return [HOME];

  switch (profile.role) {
    case "boss":
      return [HOME, FLEET, TEAM, OFFICE, { ...PRICING, mobile: false }];

    case "deputy":
      return [HOME, FLEET, TEAM, OFFICE];

    case "logist":
      return [
        HOME,
        DRIVERS,
        FLEET,
        { to: "/report-breakdown", label: "Поломка", icon: AlertTriangle },
        OFFICE,
      ];

    case "mechanic":
      return [
        HOME,
        FLEET,
        { to: "/report-breakdown", label: "Поломки", icon: AlertTriangle },
        OFFICE,
      ];

    // driver і solo
    default:
      if (hasCompany(profile)) {
        return [
          HOME,
          TRIPS,
          SCHENGEN,
          { to: "/report-breakdown", label: "Поломка", icon: AlertTriangle },
          { ...PRICING, mobile: false },
        ];
      }
      return [HOME, TRIPS, SCHENGEN, PRICING];
  }
}