import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import DonationModalTrigger from "../DonationPage/DonationModalTrigger";
import { getPublicNavigationLinks } from "@/lib/publicNavigation";
import styles from "./headerSection.module.css";

const SCROLL_REVEAL_THRESHOLD = 16;

type HeaderProps = {
  revealOnFirstScroll?: boolean;
};

export default function Header({ revealOnFirstScroll = false }: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const navigationLinks = getPublicNavigationLinks();

  const isRevealed = !revealOnFirstScroll || hasScrolled;

  useEffect(() => {
    if (!revealOnFirstScroll) {
      return;
    }

    const initialScrollY = window.scrollY;

    const handleScroll = () => {
      if (Math.abs(window.scrollY - initialScrollY) < SCROLL_REVEAL_THRESHOLD) {
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
      data-revealed={isRevealed ? "true" : "false"}
    >
      <div className={styles.inner}>
        <div className={styles.logoContainer}>
          <Link href="/admin/login" aria-label="Go to admin login">
            <Image
              src="/org-logo.png"
              className={styles.logoImage}
              width={50}
              height={42}
              alt="CPAAA Logo"
              sizes="50px"
            />
          </Link>
          <div className={styles.logo}>
            <Link href="/">Ciudadanos Pro Albergue de Animales de Aguadilla</Link>
          </div>
        </div>

        <nav className={styles.navDesktop}>
          {navigationLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
          <DonationModalTrigger className={styles.donateButton}>Donar</DonationModalTrigger>
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
          {navigationLinks.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setIsOpen(false)}>
              {link.label}
            </Link>
          ))}
          <DonationModalTrigger
            className={styles.donateButtonMobile}
            onOpen={() => setIsOpen(false)}
          >
            Donar
          </DonationModalTrigger>
        </nav>
      )}
    </header>
  );
}
