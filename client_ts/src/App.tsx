import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { LayoutProvider } from "./context/LayoutContext";
import { UXProvider } from "./context/UXContext";
import { SessionProvider, useSession } from "./context/SessionContext";
import AppLayout from "./layouts/AppLayout";
import AuthPage from "./pages/Auth/AuthPage";
import VerifyAccountPage from "./pages/Auth/VerifyAccountPage";
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

  if (!session) {
    return <Navigate to="/home" replace />;
  }

  return (
    <Navigate
      to={session.user?.isVerified === false ? "/settings" : "/dashboard"}
      replace
    />
  );
}

function RequireSignedIn() {
  const { session, checkingSession } = useSession();

  if (checkingSession) {
    return (
      <section className="rounded-3xl border border-border bg-white/90 p-6 shadow-soft backdrop-blur sm:p-8">
        <p className="text-sm text-bark">Checking session...</p>
      </section>
    );
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  return <Outlet />;
}

function RequireVerified() {
  const { session } = useSession();
  if (!session) {
    return <Navigate to="/auth" replace />;
  }
  if (session.user?.isVerified === false) {
    return <Navigate to="/settings" replace />;
  }
  return <Outlet />;
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
                <Route path="auth" element={<AuthPage />} />
                <Route path="auth/verify-account" element={<VerifyAccountPage />} />
                <Route element={<RequireSignedIn />}>
                  <Route path="settings" element={<SettingsPage />} />
                  <Route element={<RequireVerified />}>
                    <Route path="dashboard" element={<DashboardPage />} />
                    <Route path="roadmaps" element={<RoadmapsPage />} />
                    <Route path="tasks" element={<TasksPage />} />
                  </Route>
                </Route>
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </UXProvider>
        </LayoutProvider>
      </SessionProvider>
    </BrowserRouter>
  );
}
