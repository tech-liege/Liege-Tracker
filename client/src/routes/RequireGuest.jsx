import { Navigate, Outlet } from "react-router-dom";
import { useSession } from "../context/SessionContext";

export default function RequireGuest() {
  const { session, checkingSession } = useSession();

  if (checkingSession) {
    return (
      <section className="rounded-3xl border border-border bg-white/90 p-6 shadow-soft backdrop-blur sm:p-8">
        <p className="text-sm text-bark">Checking session...</p>
      </section>
    );
  }

  if (session) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
