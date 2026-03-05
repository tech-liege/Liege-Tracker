import { Outlet } from "react-router-dom";
import MobileNav from "../components/Layout/MobileNav";
import Sidebar from "../components/Layout/Sidebar";

export default function AuthedLayout() {
  return (
    <div className="relative isolate min-h-screen overflow-hidden text-ink">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(180deg,#f3f9ff_0%,#e8f2fb_100%)]" />
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 px-4 pb-28 pt-6 sm:px-6 sm:pb-32 lg:ml-64 lg:px-10 lg:pb-10">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
            <MobileNav />
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
