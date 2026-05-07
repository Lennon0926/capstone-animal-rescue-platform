import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Image from "next/image";
import { signOut } from "@/lib/auth";
import styles from "./adminHeader.module.css";

export default function AdminHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut();
      router.push("/home");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.logoContainer}>
          <Image
            src="/org-logo.png"
            className={styles.logoImage}
            width={45}
            height={45}
            alt="CPAAA Logo"
            sizes="45px"
          />
          <div className={styles.logo}>
            <Link href="/">Ciudadanos Pro Albergue de Animales de Aguadilla</Link>
          </div>
        </div>

        <nav className={styles.navDesktop}>
          <Link href="/home" className={styles.navLink}>
            Home
          </Link>
          <Link href="/admin/home" className={styles.navLink}>
            Dashboard
          </Link>
          <Link href="/admin/animals" className={styles.navLink}>
            Animales
          </Link>
          <Link href="/admin/createUser" className={styles.navLink}>
            Usuarios
          </Link>
          <button onClick={handleLogout} className={styles.logoutButton}>
            Logout
          </button>
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
          <Link href="/admin/home" className={styles.navLinkMobile}>
            Dashboard
          </Link>
          <Link href="/admin/animals" className={styles.navLinkMobile}>
            Animals
          </Link>
          <Link href="/admin/createUser" className={styles.navLinkMobile}>
            Users
          </Link>
          <button onClick={handleLogout} className={styles.logoutButtonMobile}>
            Logout
          </button>
        </nav>
      )}
    </header>
  );
}
