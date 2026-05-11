import styles from "./accessDenied.module.css";

export default function AccessDeniedScreen() {
  return (
    <div className={styles.access_denied_container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Acceso Denegado</h1>
        <p className={styles.sub_title}>
          No tienes permisos para acceder a esta página.
        </p>
      </div>
    </div>
  );
}
