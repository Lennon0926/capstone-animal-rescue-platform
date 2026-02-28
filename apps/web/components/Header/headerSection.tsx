import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./headerSection.module.css";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.logoContainer}>
          <Image
            src="/org-logo.png"
            width={50}
            height={50}
            className={styles.logoImage}
            alt="CPAAA Logo"
          />
          <div className={styles.logo}>
            <Link href="/">Ciudadanos Pro Albergue de Animales de Aguadilla</Link>
          </div>
        </div>

        <nav className={styles.navDesktop}>
          <Link href="/">Home</Link>
          <Link href="/adopt">Adoptar</Link>
          <Link href="/about">About</Link>
          <Link href="/blog">Blog</Link>
          <Link href="/donation" className={styles.donateButton}>
            Donar
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
          <Link href="/">Home</Link>
          <Link href="/adopt">Adoptar</Link>
          <Link href="/about">About</Link>
          <Link href="/blog">Blog</Link>
          <Link href="/donation" className={styles.donateButtonMobile}>
            Donar
          </Link>
        </nav>
      )}
    </header>
  );
}
