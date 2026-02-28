import styles from "./footerSection.module.css";
import { Mail, Phone, MapPin } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>

        <div className={styles.brand}>
          <div className={styles.logo}>
            <span>Animal Rescue Platform</span>
          </div>
          <p className={styles.description}>
            Conectando animales rescatados con familias amorosas desde 1990
          </p>
        </div>

        <div className={styles.column}>
          <h4 className={styles.heading}>Enlaces Rápidos</h4>
          <ul>
            <li><Link href="/about">Sobre Nosotros</Link></li>
            <li><Link href="/animals">Animales Disponibles</Link></li>
            <li><Link href="/#adoption_process">Proceso de Adopción</Link></li>
          </ul>
        </div>

        <div className={styles.column}>
          <h4 className={styles.heading}>Apoyo</h4>
          <ul>
            <li><Link href="/donate">Donar</Link></li>
            <li><Link href="/volunteer">Ser Voluntario</Link></li>
            <li><Link href="/foster">Programa de Hogar Temporal</Link></li>
          </ul>
        </div>

        <div className={styles.column}>
          <h4 className={styles.heading}>Contacto</h4>

          <div className={styles.contactItem}>
            <Mail size={18} />
            <span>info@animalrescue.org</span>
          </div>

          <div className={styles.contactItem}>
            <Phone size={18} />
            <span>(787)-505-8255</span>
          </div>

          <div className={styles.contactItem}>
            <MapPin size={68} />
            <span>
              Ciudadanos Pro Albergue de Animales de Aguadilla, Inc.
              Box 4152
              Aguadilla, Puerto Rico 00605
            </span>
          </div>
        </div>

      </div>

      <div className={styles.bottom}>
        © {new Date().getFullYear()} Animal Rescue Platform. Todos los derechos reservados.
      </div>
    </footer>
  );
}