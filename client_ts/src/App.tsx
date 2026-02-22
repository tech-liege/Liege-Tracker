import { BrowserRouter, Route, Routes } from "react-router-dom";
import { LayoutProvider } from "./context/LayoutContext";
import { SessionProvider } from "./context/SessionContext";
import AppLayout from "./layouts/AppLayout";
import AuthPage from "./pages/AuthPage";
import NotFoundPage from "./pages/NotFoundPage";
import TodosPage from "./pages/TodosPage";

export default function App() {
  return (
    <BrowserRouter>
      <SessionProvider>
        <LayoutProvider>
          <Routes>
            <Route element={<AppLayout />}>
              <Route index element={<TodosPage />} />
              <Route path="auth" element={<AuthPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </LayoutProvider>
      </SessionProvider>
    </BrowserRouter>
  );
}
