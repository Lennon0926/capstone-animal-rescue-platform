import Link from "next/link";
import styles from "./headerContainer.module.css";

export default function HeaderContainer() {
  return (
    <header className={styles.header}>
      <div className={styles.wrapper}>
        <div className={styles.inner}>
          
          <div className={styles.logo}>
            <Link href="/">Animal Rescue Platform</Link>
          </div>

          <nav className={styles.nav}>
            <Link href="/" className={styles.navLink}>
              Home
            </Link>
            <Link href="/animals" className={styles.navLink}>
              Animals
            </Link>
            <Link href="/about" className={styles.navLink}>
              About
            </Link>

            <Link href="/donate" className={styles.donateButton}>
              Donate
            </Link>
          </nav>

        </div>
      </div>
    </header>
  );
}