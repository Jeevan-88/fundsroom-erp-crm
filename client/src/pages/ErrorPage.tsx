import { Link, useSearchParams } from "react-router-dom";
import { Button, Card } from "../components/ui";

export function ErrorPage() {
  const [searchParams] = useSearchParams();
  const message = searchParams.get("message") ?? "The requested page could not be loaded.";

  return (
    <div className="center-page">
      <Card className="auth-card narrow-card">
        <div className="hero-badge">!</div>
        <h1>Something went wrong</h1>
        <p className="muted-text">{message}</p>
        <Link to="/">
          <Button>Return home</Button>
        </Link>
      </Card>
    </div>
  );
}