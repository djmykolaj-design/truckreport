import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getMyProfile } from "../services/profile";

export default function RequireCompany({ children }) {
  const [state, setState] = useState("loading");

  useEffect(() => {
    getMyProfile().then((profile) => {
      setState(profile?.company_id ? "ok" : "denied");
    });
  }, []);

  if (state === "loading") return null;
  if (state === "denied") return <Navigate to="/" replace />;

  return children;
}