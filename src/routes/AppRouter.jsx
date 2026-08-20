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

export default function AppRouter() {
    return (
        <BrowserRouter>
            <MainLayout>
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/trips" element={<TripsV4 />} />
                    <Route path="/schengen" element={<Schengen />} />
                    <Route path="/trip-fuel/:tripId" element={<TripFuel />} />
                    <Route path="/trip-expenses/:tripId" element={<TripExpenses />} />
                    <Route path="/trip/:tripId/finish" element={<TripFinish />} />
                    <Route path="/trip/:tripId/report" element={<TripReport />} />
                    <Route path="/trip-exchange/:tripId" element={<TripExchange />} />
                    <Route path="/trip-documents/:tripId" element={<TripDocuments />} />
                </Routes>
            </MainLayout>
        </BrowserRouter>
    );
}