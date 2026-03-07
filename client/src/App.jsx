import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { SessionProvider, useSession } from "./context/SessionContext";
import AuthedLayout from "./layouts/AuthedLayout";
import AuthedProviders from "./layouts/AuthedProviders";
import PublicLayout from "./layouts/PublicLayout";
import AuthPage from "./pages/Authentication/AuthPage";
import ForgotPasswordPage from "./pages/Authentication/ForgotPasswordPage";
import ResetPasswordPage from "./pages/Authentication/ResetPasswordPage";
import VerifyAccountPage from "./pages/Authentication/VerifyAccountPage";
import HomePage from "./pages/Home/HomePage";
import DashboardPage from "./pages/Dashboard/DashboardPage";
import NotFoundPage from "./pages/NotFound/NotFoundPage";
import RoadmapsPage from "./pages/Roadmaps/RoadmapsPage";
import SettingsPage from "./pages/Settings/SettingsPage";
import TasksPage from "./pages/Tasks/TasksPage";
import RequireAuth from "./routes/RequireAuth";
import RequireGuest from "./routes/RequireGuest";
import RequireVerified from "./routes/RequireVerified";

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

  return <Navigate to={session.user?.isVerified === false ? "/settings" : "/dashboard"} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <SessionProvider>
        <Routes>
          <Route path="/" element={<RootRedirect />} />

          <Route element={<RequireGuest />}>
            <Route element={<PublicLayout />}>
              <Route path="home" element={<HomePage />} />
              <Route path="auth" element={<AuthPage />} />
              <Route path="auth/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="auth/reset-password" element={<ResetPasswordPage />} />
            </Route>
          </Route>

          <Route element={<PublicLayout />}>
            <Route path="auth/verify-account" element={<VerifyAccountPage />} />
          </Route>

          <Route element={<RequireAuth />}>
            <Route element={<AuthedProviders />}>
              <Route element={<AuthedLayout />}>
                <Route path="settings" element={<SettingsPage />} />
                <Route element={<RequireVerified />}>
                  <Route path="dashboard" element={<DashboardPage />} />
                  <Route path="roadmaps" element={<RoadmapsPage />} />
                  <Route path="tasks" element={<TasksPage />} />
                </Route>
              </Route>
            </Route>
          </Route>

          <Route element={<PublicLayout />}>
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </SessionProvider>
    </BrowserRouter>
  );
}
