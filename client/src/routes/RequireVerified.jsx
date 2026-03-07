import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSession } from "@/context/SessionContext";

export default function RequireVerified() {
  const { session } = useSession();
  const location = useLocation();

  if (!session) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  if (session.user?.isVerified === false) {
    return <Navigate to="/settings" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
