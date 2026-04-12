import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./headerSection.module.css";

const SCROLL_REVEAL_THRESHOLD = 16;

type HeaderProps = {
  revealOnFirstScroll?: boolean;
};

export default function Header({
  revealOnFirstScroll = false,
}: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);

  const isRevealed = !revealOnFirstScroll || hasScrolled;

  useEffect(() => {
    if (!revealOnFirstScroll) {
      return;
    }

    const initialScrollY = window.scrollY;

    const handleScroll = () => {
      if (
        Math.abs(window.scrollY - initialScrollY) <
        SCROLL_REVEAL_THRESHOLD
      ) {
        return;
      }

      setHasScrolled(true);
      setIsOpen(false);
      window.removeEventListener("scroll", handleScroll);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, [revealOnFirstScroll]);

  return (
    <header
      className={[
        styles.header,
        revealOnFirstScroll ? styles.headerOverlay : "",
        isRevealed ? styles.headerVisible : styles.headerHidden,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className={styles.inner}>
        <div className={styles.logoContainer}>
          <Image
            src="/org-logo.png"
            className={styles.logoImage}
            width={50}
            height={42}
            alt="CPAAA Logo"
            sizes="50px"
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
          aria-expanded={isOpen}
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
