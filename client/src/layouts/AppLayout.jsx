import { Outlet } from "react-router-dom";
import BottomStatusBar from "../components/Layout/BottomStatusBar";
import MobileNav from "../components/Layout/MobileNav";
import Sidebar from "../components/Layout/Sidebar";

export default function AppLayout() {
  return (
    <div className="relative z-10 min-h-screen text-ink">
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 px-4 pb-24 pt-10 sm:px-6 lg:px-10 lg:ml-64">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
            <MobileNav />
            <Outlet />
          </div>
        </main>
      </div>
      <BottomStatusBar />
    </div>
  );
}
