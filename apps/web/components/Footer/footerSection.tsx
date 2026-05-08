import styles from "./footerSection.module.css";
import { Mail, Phone, MapPin } from "lucide-react";
import Link from "next/link";
import DonationModalTrigger from "../DonationPage/DonationModalTrigger";
import { getFooterQuickLinks } from "@/lib/publicNavigation";

export default function Footer() {
  const quickLinks = getFooterQuickLinks();

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <div className={styles.logo}>
            <span>Ciudadanos Pro Albergue de Animales de Aguadilla</span>
          </div>
          <p className={styles.description}>
            Trabajando por el bienestar y la protección animal desde 1990
          </p>
        </div>

        <div className={styles.column}>
          <h4 className={styles.heading}>Enlaces Rápidos</h4>
          <ul>
            {quickLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.column}>
          <h4 className={styles.heading}>Apoyo</h4>
          <ul>
            <li>
              <DonationModalTrigger className={styles.footerDonateButton}>
                Donar
              </DonationModalTrigger>
            </li>
            {/* <li><Link href="/volunteer">Ser Voluntario</Link></li>
            <li><Link href="/foster">Programa de Hogar Temporal</Link></li> */}
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
            <MapPin className={styles.mapIcon} />
            <span>
              Ciudadanos Pro Albergue de Animales de Aguadilla, Inc. Box 4152 Aguadilla, Puerto Rico
              00605
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
