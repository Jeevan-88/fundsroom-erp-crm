import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";
import { LoadingState } from "./ui";

export function RoleGate({
  roles,
  children
}: {
  roles: Array<"ADMIN" | "SALES" | "WAREHOUSE" | "ACCOUNTS">;
  children: ReactNode;
}) {
  const { isHydrated, isAuthenticated, canAccess } = useAuth();

  if (!isHydrated) {
    return <LoadingState label="Loading permissions..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!canAccess(roles)) {
    return <Navigate to="/forbidden" replace />;
  }

  return children;
}