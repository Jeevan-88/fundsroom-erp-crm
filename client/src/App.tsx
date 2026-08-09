import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import type { ReactElement } from "react";
import { AppShell } from "./components/layout";
import { LoadingState } from "./components/ui";
import { useAuth } from "./context/AuthContext";
import { RoleGate } from "./components/guards";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { CustomersPage } from "./pages/CustomersPage";
import { CustomerDetailPage } from "./pages/CustomerDetailPage";
import { ProductsPage } from "./pages/ProductsPage";
import { InventoryPage } from "./pages/InventoryPage";
import { ChallansPage } from "./pages/ChallansPage";
import { ChallanCreatePage } from "./pages/ChallanCreatePage";
import { ChallanDetailPage } from "./pages/ChallanDetailPage";
import { FollowUpsPage } from "./pages/FollowUpsPage";
import { ErrorPage } from "./pages/ErrorPage";
import { ForbiddenPage } from "./pages/ForbiddenPage";

function AuthGate({ children }: { children: ReactElement }) {
  const { isAuthenticated, isHydrated } = useAuth();

  if (!isHydrated) {
    return <LoadingState label="Loading session..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  const location = useLocation();
  const onLoginRoute = location.pathname === "/login";

  if (onLoginRoute) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <AuthGate>
      <AppShell>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/customers/:id" element={<CustomerDetailPage />} />
          <Route path="/follow-ups" element={<RoleGate roles={["ADMIN", "SALES"]}><FollowUpsPage /></RoleGate>} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/inventory" element={<RoleGate roles={["ADMIN", "WAREHOUSE"]}><InventoryPage /></RoleGate>} />
          <Route path="/challans" element={<ChallansPage />} />
          <Route path="/challans/new" element={<RoleGate roles={["ADMIN", "SALES"]}><ChallanCreatePage mode="create" /></RoleGate>} />
          <Route path="/challans/:id" element={<ChallanDetailPage />} />
          <Route path="/challans/:id/edit" element={<RoleGate roles={["ADMIN", "SALES"]}><ChallanCreatePage mode="edit" /></RoleGate>} />
          <Route path="/forbidden" element={<ForbiddenPage />} />
          <Route path="/error" element={<ErrorPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
    </AuthGate>
  );
}