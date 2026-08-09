import { Link } from "react-router-dom";
import { Button, Card } from "../components/ui";

export function ForbiddenPage() {
  return (
    <div className="center-page">
      <Card className="auth-card narrow-card">
        <div className="hero-badge danger">403</div>
        <h1>Permission denied</h1>
        <p className="muted-text">Your current role does not allow access to this area.</p>
        <Link to="/">
          <Button>Go to dashboard</Button>
        </Link>
      </Card>
    </div>
  );
}