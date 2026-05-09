import styles from "./accessDenied.module.css";

export default function AccessDeniedScreen() {
  return (
    <div className={styles.access_denied_container}>
      <h1 className={styles.title}>Access Denied</h1>
      <p className={styles.sub_title}>
        You do not have permission to access this page.
      </p>
    </div>
  );
}
