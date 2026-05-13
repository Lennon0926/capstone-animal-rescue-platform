import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase";
import styles from "./login.module.css";

const PASSWORD_RESET_PATH = "/admin/reset-password";

function buildPasswordResetRedirectUrl() {
  const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();

  return configuredAppUrl
    ? `${configuredAppUrl.replace(/\/+$/, "")}${PASSWORD_RESET_PATH}`
    : undefined;
}


export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setResetMessage(null);
      setError("Please enter both email and password");
      return;
    }

    if (email.length < 5) {
      setResetMessage(null);
      setError("Please enter a valid email address");
      return;
    }

    if (password.length < 6) {
      setResetMessage(null);
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    setError(null);
    setResetMessage(null);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      // Handle Supabase errors - don't throw, just set error state
      if (signInError) {
        console.error("Sign in error:", signInError.message);

        if (signInError.message === "Invalid login credentials") {
          setError("Invalid email or password. Please try again.");
        } else {
          setError(signInError.message || "Failed to sign in. Please try again.");
        }

        setLoading(false);
        return;
      }

      if (!data?.session) {
        setError("Login successful but session could not be created. Please try again.");
        setLoading(false);
        return;
      }

      await router.push("/admin/home");
    } catch (err) {
      // Catch any unexpected errors
      const errorMessage =
        err instanceof Error ? err.message : "An unexpected error occurred. Please try again.";
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setResetMessage(null);
      setError("Primero ingresa tu correo para recibir el enlace de restablecimiento.");
      return;
    }

    if (normalizedEmail.length < 5) {
      setResetMessage(null);
      setError("Please enter a valid email address.");
      return;
    }

    setSendingReset(true);
    setError(null);
    setResetMessage(null);

    const redirectTo = buildPasswordResetRedirectUrl();

    if (!redirectTo) {
      setError("Falta configurar NEXT_PUBLIC_APP_URL para enviar el enlace de restablecimiento.");
      setSendingReset(false);
      return;
    }

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      ...(redirectTo ? { redirectTo } : {}),
    });

    if (resetError) {
      setResetMessage(null);
      setError(
        resetError.message || "No se pudo enviar el correo de restablecimiento. Inténtalo de nuevo."
      );
      setSendingReset(false);
      return;
    }

    setSendingReset(false);
    setError(null);
    setResetMessage("Enlace de restablecimiento enviado. Revisa tu correo.");
  };

  return (
    <div className={styles.container}>
      <Link href="/" className={styles.backButton}>
        ← Back to home
      </Link>
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <h1 className={styles.title}>Admin Login</h1>
          <p className={styles.subtitle}>
            Sign para acceder al panel de administración. Asegúrate de usar tus credenciales de
            administrador para iniciar sesión.
          </p>
        </div>

        {error && <div className={styles.errorMessage}>{error}</div>}
        {resetMessage && <div className={styles.successMessage}>{resetMessage}</div>}

        <form onSubmit={handleEmailLogin} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={styles.input}
              required
              disabled={loading}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>
              Contraseña
            </label>
            <div className={styles.passwordWrapper}>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className={styles.input}
                required
                disabled={loading}
              />
              <button
                type="button"
                className={styles.togglePassword}
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <button
              type="button"
              className={styles.forgotPasswordButton}
              onClick={handleForgotPassword}
              disabled={loading || sendingReset}
            >
              {sendingReset ? "Enviando enlace..." : "¿Olvidaste tu contraseña?"}
            </button>
          </div>

          <button type="submit" className={styles.submitButton} disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
