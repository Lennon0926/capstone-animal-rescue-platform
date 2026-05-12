import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import styles from '@/components/Admin/Login/login.module.css';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);

  useEffect(() => {
    let mounted = true;

    const validateRecoverySession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) {
        return;
      }

      setHasRecoverySession(Boolean(session));
      if (!session) {
        setError('Abre esta página desde el enlace del correo para restablecer contraseña.');
      }
    };

    void validateRecoverySession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) {
        return;
      }

      if (event === 'PASSWORD_RECOVERY' || Boolean(session)) {
        setHasRecoverySession(true);
        setError(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!hasRecoverySession) {
      setError('El enlace para restablecer contraseña es inválido o expiró. Solicita uno nuevo.');
      return;
    }

    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      setError(updateError.message || 'No se pudo restablecer la contraseña. Inténtalo de nuevo.');
      setLoading(false);
      return;
    }

    setLoading(false);
    setSuccessMessage('Contraseña actualizada. Redirigiendo al inicio de sesión...');
    setTimeout(() => {
      void router.push('/admin/login');
    }, 1500);
  };

  return (
    <div className={styles.container}>
      <Link href="/admin/login" className={styles.backButton}>
        ← Volver al inicio de sesión
      </Link>
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <h1 className={styles.title}>Restablecer contraseña</h1>
          <p className={styles.subtitle}>Define tu nueva contraseña de administrador para continuar.</p>
        </div>

        {error && <div className={styles.errorMessage}>{error}</div>}
        {successMessage && <div className={styles.successMessage}>{successMessage}</div>}

        <form onSubmit={handleResetPassword} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="new-password" className={styles.label}>
              Nueva contraseña
            </label>
            <input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={styles.input}
              placeholder="Ingresa la nueva contraseña"
              disabled={loading}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="confirm-password" className={styles.label}>
              Confirmar contraseña
            </label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={styles.input}
              placeholder="Confirma la nueva contraseña"
              disabled={loading}
              required
            />
          </div>

          <button type="submit" className={styles.submitButton} disabled={loading}>
            {loading ? 'Actualizando contraseña...' : 'Actualizar contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
}
