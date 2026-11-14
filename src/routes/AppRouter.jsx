import { BrowserRouter, Routes, Route } from "react-router-dom";

import MainLayout from "../components/layout/MainLayout";

import Home from "../pages/Home";
import Schengen from "../pages/Schengen";
import TripsV4 from "../pages/TripsV4";
import TripFuel from "../pages/TripFuel";
import TripExpenses from "../pages/TripExpenses";
import TripExchange from "../pages/TripExchange";
import TripFinish from "../pages/TripFinish";
import TripDocuments from "../pages/TripDocuments";
import TripReport from "../pages/TripReport";
import ReportBreakdown from "../pages/ReportBreakdown";

import AuthGuard from "../components/AuthGuard";
import RequireCompany from "../components/RequireCompany";
import RequireRole from "../components/RequireRole";
import Login from "../pages/Login";
import ResetPassword from "../pages/ResetPassword";
import Office from "../pages/Office";
import OfficeTrip from "../pages/OfficeTrip";
import SetupCompany from "../pages/SetupCompany";
import Fleet from "../pages/Fleet";
import CompanyOffice from "../pages/CompanyOffice";
import Demo from "../pages/Demo";
import Legal from "../pages/Legal";
import Pricing from "../pages/Pricing";
import Landing from "../pages/Landing";
import AdminRequests from "../pages/AdminRequests";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <MainLayout>
        <Routes>
          <Route path="/welcome" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/demo" element={<Demo />} />
          <Route path="/privacy" element={<Legal type="privacy" />} />
          <Route path="/terms" element={<Legal type="terms" />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route
            path="/"
            element={
              <AuthGuard>
                <Home />
              </AuthGuard>
            }
          />

          <Route
            path="/trips"
            element={
              <AuthGuard>
                <RequireRole perm="trips.own">
                  <TripsV4 />
                </RequireRole>
              </AuthGuard>
            }
          />

          <Route
            path="/schengen"
            element={
              <AuthGuard>
                <RequireRole perm="trips.own">
                  <Schengen />
                </RequireRole>
              </AuthGuard>
            }
          />

          <Route
            path="/pricing"
            element={
              <AuthGuard>
                <Pricing />
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
                <RequireRole office>
                  <Office />
                </RequireRole>
              </AuthGuard>
            }
          />

          <Route
            path="/company"
            element={
              <AuthGuard>
                <RequireRole office>
                  <CompanyOffice />
                </RequireRole>
              </AuthGuard>
            }
          />

          <Route
            path="/office/:tripId"
            element={
              <AuthGuard>
                <RequireRole office>
                  <OfficeTrip />
                </RequireRole>
              </AuthGuard>
            }
          />

          <Route
            path="/fleet"
            element={
              <AuthGuard>
                <RequireRole perm="fleet.view">
                  <Fleet />
                </RequireRole>
              </AuthGuard>
            }
          />

          <Route
            path="/report-breakdown"
            element={
              <AuthGuard>
                <RequireCompany>
                  <RequireRole any={["breakdown.report", "breakdown.view"]}>
                    <ReportBreakdown />
                  </RequireRole>
                </RequireCompany>
              </AuthGuard>
            }
          />
           <Route
            path="/admin/requests"
            element={
              <AuthGuard>
                <AdminRequests />
              </AuthGuard>
            }
          />

          <Route path="/setup" element={<SetupCompany />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
}