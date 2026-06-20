import { useState, type FormEvent } from "react";
import { ApiRequestError, NetworkError } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import {
  getStoredLoginEmail,
  setStoredLoginEmail,
} from "../../lib/workspaceStorage";

type AuthMode = "login" | "register";

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof NetworkError) {
    return err.message;
  }
  if (err instanceof ApiRequestError) {
    return err.message;
  }
  return fallback;
}

export function LoginPage() {
  const { login, register } = useAuth();
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState(() => getStoredLoginEmail());
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function switchMode(mode: AuthMode): void {
    setAuthMode(mode);
    setError(null);
    setConfirmPassword("");
  }

  async function handleLoginSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const trimmedEmail = email.trim();

    try {
      await login(trimmedEmail, password);
      setStoredLoginEmail(trimmedEmail);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to sign in. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRegisterSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    const trimmedEmail = email.trim();
    const trimmedDisplayName = displayName.trim();

    try {
      await register(trimmedEmail, trimmedDisplayName, password);
      setStoredLoginEmail(trimmedEmail);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to create account. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  }

  const subtitle =
    authMode === "login"
      ? "Sign in to your tutoring workspace"
      : "Create an account to get started";

  const submitLabel =
    authMode === "login"
      ? isSubmitting
        ? "Signing in…"
        : "Sign in"
      : isSubmitting
        ? "Creating account…"
        : "Create account";

  return (
    <div className="login-page">
      <div className="login-card card">
        <h1 className="login-title">Agentic Academic Assistant</h1>
        <p className="login-subtitle">{subtitle}</p>

        <div className="auth-tabs" role="tablist" aria-label="Authentication">
          <button
            type="button"
            role="tab"
            className={authMode === "login" ? "auth-tab active" : "auth-tab"}
            aria-selected={authMode === "login"}
            onClick={() => switchMode("login")}
            disabled={isSubmitting}
          >
            Sign in
          </button>
          <button
            type="button"
            role="tab"
            className={authMode === "register" ? "auth-tab active" : "auth-tab"}
            aria-selected={authMode === "register"}
            onClick={() => switchMode("register")}
            disabled={isSubmitting}
          >
            Create account
          </button>
        </div>

        {authMode === "login" ? (
          <form className="login-form" onSubmit={handleLoginSubmit}>
            <label className="form-label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="form-input"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={isSubmitting}
            />

            <label className="form-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="form-input"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isSubmitting}
            />

            {error !== null && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
            >
              {submitLabel}
            </button>
          </form>
        ) : (
          <form className="login-form" onSubmit={handleRegisterSubmit}>
            <label className="form-label" htmlFor="register-email">
              Email
            </label>
            <input
              id="register-email"
              type="email"
              className="form-input"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={isSubmitting}
            />

            <label className="form-label" htmlFor="display-name">
              Display name
            </label>
            <input
              id="display-name"
              type="text"
              className="form-input"
              autoComplete="name"
              required
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              disabled={isSubmitting}
            />

            <label className="form-label" htmlFor="register-password">
              Password
            </label>
            <input
              id="register-password"
              type="password"
              className="form-input"
              autoComplete="new-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isSubmitting}
            />

            <label className="form-label" htmlFor="confirm-password">
              Confirm password
            </label>
            <input
              id="confirm-password"
              type="password"
              className="form-input"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              disabled={isSubmitting}
            />

            {error !== null && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
            >
              {submitLabel}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
