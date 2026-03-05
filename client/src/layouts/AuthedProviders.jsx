import { Outlet } from "react-router-dom";
import { LayoutProvider } from "../context/LayoutContext";
import { UXProvider } from "../context/UXContext";

export default function AuthedProviders() {
  return (
    <LayoutProvider>
      <UXProvider>
        <Outlet />
      </UXProvider>
    </LayoutProvider>
  );
}
