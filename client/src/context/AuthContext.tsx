import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import { useNavigate } from "react-router-dom";
import { ApiError, requestJson } from "../lib/api";
import type { AuthUser, UserRole } from "../lib/models";
import { useToast } from "./ToastContext";

type LoginResponse = {
  success: true;
  message: string;
  data: {
    token: string;
    user: AuthUser;
  };
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  request: <T>(path: string, options?: { method?: string; headers?: HeadersInit; body?: unknown }) => Promise<T>;
  canAccess: (roles: UserRole[]) => boolean;
};

const TOKEN_KEY = "fundsroom-token";
const USER_KEY = "fundsroom-user";

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    const storedToken = window.localStorage.getItem(TOKEN_KEY);
    const storedUser = window.localStorage.getItem(USER_KEY);

    if (storedToken) {
      setToken(storedToken);
    }

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser) as AuthUser);
      } catch {
        window.localStorage.removeItem(USER_KEY);
      }
    }

    setIsHydrated(true);
  }, []);

  const logout = () => {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
    navigate("/login", { replace: true });
  };

  const request = async <T,>(path: string, options: { method?: string; headers?: HeadersInit; body?: unknown } = {}) => {
    try {
      return await requestJson<T>(path, {
        ...options,
        token
      });
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 401) {
          logout();
        }
        throw error;
      }

      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    const response = await requestJson<LoginResponse>("/api/auth/login", {
      method: "POST",
      body: { email, password }
    });

    window.localStorage.setItem(TOKEN_KEY, response.data.token);
    window.localStorage.setItem(USER_KEY, JSON.stringify(response.data.user));
    setToken(response.data.token);
    setUser(response.data.user);
    toast.success("Login successful", `Welcome back, ${response.data.user.name}`);
    navigate("/", { replace: true });
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token),
      isHydrated,
      login,
      logout,
      request,
      canAccess: (roles) => Boolean(user && roles.includes(user.role))
    }),
    [isHydrated, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}