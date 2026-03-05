import { Outlet } from "react-router-dom";

export default function PublicLayout() {
  return (
    <div className="relative isolate min-h-screen overflow-hidden text-ink">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_10%_0%,rgba(176,220,255,0.85),transparent_45%),radial-gradient(circle_at_90%_20%,rgba(255,255,255,0.8),transparent_35%),linear-gradient(180deg,#f4faff_0%,#eaf3fc_45%,#f8fcff_100%)]" />
      <div className="pointer-events-none absolute -left-24 top-16 -z-10 h-80 w-80 rounded-full bg-ember/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-12 -z-10 h-72 w-72 rounded-full bg-[#cbe8ff] blur-3xl" />
      <main className="mx-auto flex min-h-screen w-full max-w-6xl items-start px-4 py-10 sm:px-6 lg:px-10">
        <div className="w-full space-y-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
