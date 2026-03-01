import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { LayoutProvider } from "./context/LayoutContext";
import { UXProvider } from "./context/UXContext";
import { SessionProvider, useSession } from "./context/SessionContext";
import AppLayout from "./layouts/AppLayout";
import AuthPage from "./pages/Auth/AuthPage";
import HomePage from "./pages/Home/HomePage";
import DashboardPage from "./pages/Dashboard/DashboardPage";
import NotFoundPage from "./pages/NotFound/NotFoundPage";
import RoadmapsPage from "./pages/Roadmap/RoadmapsPage";
import SettingsPage from "./pages/Settings/SettingsPage";
import TasksPage from "./pages/Tasks/TasksPage";

function RootRedirect() {
  const { session, checkingSession } = useSession();

  if (checkingSession) {
    return (
      <section className="rounded-3xl border border-border bg-white/90 p-6 shadow-soft backdrop-blur sm:p-8">
        <p className="text-sm text-bark">Checking session...</p>
      </section>
    );
  }

  return <Navigate to={session ? "/dashboard" : "/home"} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <SessionProvider>
        <LayoutProvider>
          <UXProvider>
            <Routes>
              <Route element={<AppLayout />}>
                <Route index element={<RootRedirect />} />
                <Route path="home" element={<HomePage />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="roadmaps" element={<RoadmapsPage />} />
                <Route path="tasks" element={<TasksPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="auth" element={<AuthPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </UXProvider>
        </LayoutProvider>
      </SessionProvider>
    </BrowserRouter>
  );
}
