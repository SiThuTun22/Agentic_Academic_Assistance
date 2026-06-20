import { AuthProvider, useAuth } from "./context/AuthContext";
import { LoginPage } from "./components/auth/LoginPage";
import { Workspace } from "./components/workspace/Workspace";
import "./app.css";

function AppLoading() {
  return (
    <div className="login-page">
      <div className="login-card card app-loading-card">
        <div className="loading-skeleton loading-skeleton-title" />
        <div className="loading-skeleton loading-skeleton-line" />
        <div className="loading-skeleton loading-skeleton-line short" />
        <p className="column-status">Loading your workspace…</p>
      </div>
    </div>
  );
}

function AppContent() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <AppLoading />;
  }

  if (user === null) {
    return <LoginPage />;
  }

  return <Workspace />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
