import { useEffect, useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../lib/api";
import { Button, Card, Input } from "../components/ui";

export function LoginPage() {
  const { login, isAuthenticated, isHydrated } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "FundsRoom ERP CRM | Login";
  }, []);

  if (isHydrated && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
    } catch (caughtError) {
      if (caughtError instanceof ApiError) {
        setError(caughtError.message);
      } else {
        setError("Unable to sign in right now.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-grid">
        <div className="login-brand-panel">
          <div className="brand-mark large">FR</div>
          <h1>FundsRoom Mini ERP + CRM</h1>
          <p className="support-copy brand-story">While you work, FundsRoom keeps customers, stock, and challans in order.</p>
          <div className="brand-tags">
            <span>Customers</span>
            <span>Stock Control</span>
            <span>Challans</span>
          </div>
        </div>

        <Card className="auth-card">
          <h2>Sign in</h2>
          <p className="muted-text">Use your internal role account to continue.</p>

          <form className="form-grid" onSubmit={handleSubmit}>
            <label>
              <span>Email</span>
              <Input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
            </label>

            <label>
              <span>Password</span>
              <div className="input-with-action">
                <Input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type={showPassword ? "text" : "password"}
                  required
                />
                <button type="button" className="inline-action" onClick={() => setShowPassword((value) => !value)}>
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </label>

            {error ? <div className="form-error">{error}</div> : null}

            <Button type="submit" disabled={loading} className="full-width">
              {loading ? "Signing in..." : "Login"}
            </Button>
          </form>

          <div className="login-note support-copy">Internal access only. Use your assigned role account.</div>
        </Card>
      </div>
    </div>
  );
}