import { useState } from "react";
import Link from "next/link";
import styles from "./headerContainer.module.css";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.logo}>
          <Link href="/">Animal Rescue Platform</Link>
        </div>

        <nav className={styles.navDesktop}>
          <Link href="/">Home</Link>
          <Link href="/animals">Animals</Link>
          <Link href="/about">About</Link>
          <Link href="/donate" className={styles.donateButton}>
            Donate
          </Link>
        </nav>

        <button
          className={styles.menuButton}
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle Menu"
        >
          ☰
        </button>
      </div>

      {isOpen && (
        <nav className={styles.navMobile}>
          <Link href="/about">About</Link>
          <Link href="/animals">Animals</Link>
          <Link href="/how-it-works">How It Works</Link>
          <Link href="/donate" className={styles.donateButtonMobile}>
            Donate
          </Link>
        </nav>
      )}
    </header>
  );
}