import { BrowserRouter, Routes, Route } from "react-router-dom";

import MainLayout from "../components/layout/MainLayout";

import Dashboard from "../pages/Dashboard";
import Schengen from "../pages/Schengen";
import TripsV4 from "../pages/TripsV4";
import TripFuel from "../pages/TripFuel";
import TripExpenses from "../pages/TripExpenses";
import TripExchange from "../pages/TripExchange";
import TripFinish from "../pages/TripFinish";
import TripDocuments from "../pages/TripDocuments";
import TripReport from "../pages/TripReport";

import AuthGuard from "../components/AuthGuard";
import Login from "../pages/Login";
import ResetPassword from "../pages/ResetPassword";
import Office from "../pages/Office";
import OfficeTrip from "../pages/OfficeTrip";
import SetupCompany from "../pages/SetupCompany";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <MainLayout>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route
            path="/"
            element={
              <AuthGuard>
                <Dashboard />
              </AuthGuard>
            }
          />

          <Route
            path="/trips"
            element={
              <AuthGuard>
                <TripsV4 />
              </AuthGuard>
            }
          />

          <Route
            path="/schengen"
            element={
              <AuthGuard>
                <Schengen />
              </AuthGuard>
            }
          />

          <Route
            path="/trip-fuel/:tripId"
            element={
              <AuthGuard>
                <TripFuel />
              </AuthGuard>
            }
          />

          <Route
            path="/trip-expenses/:tripId"
            element={
              <AuthGuard>
                <TripExpenses />
              </AuthGuard>
            }
          />

          <Route
            path="/trip-exchange/:tripId"
            element={
              <AuthGuard>
                <TripExchange />
              </AuthGuard>
            }
          />

          <Route
            path="/trip-documents/:tripId"
            element={
              <AuthGuard>
                <TripDocuments />
              </AuthGuard>
            }
          />

          <Route
            path="/trip/:tripId/finish"
            element={
              <AuthGuard>
                <TripFinish />
              </AuthGuard>
            }
          />

          <Route
            path="/trip/:tripId/report"
            element={
              <AuthGuard>
                <TripReport />
              </AuthGuard>
            }
          />

                    <Route
            path="/office"
            element={
              <AuthGuard>
                <Office />
              </AuthGuard>
            }
          />

                    <Route
            path="/office/:tripId"
            element={
              <AuthGuard>
                <OfficeTrip />
              </AuthGuard>
            }
          />
          <Route path="/setup" element={<SetupCompany />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
}