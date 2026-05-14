import styles from "./footerSection.module.css";
import { Mail, Phone, MapPin } from "lucide-react";
import Link from "next/link";
import DonationModalTrigger from "../DonationPage/DonationModalTrigger";
import { getFooterQuickLinks } from "@/lib/publicNavigation";

export default function Footer() {
  const quickLinks = getFooterQuickLinks();
  const volunteerFormUrl = process.env.NEXT_PUBLIC_VOLUNTEER_GOOGLE_FORM_URL;

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
          <h3 className={styles.heading}>Enlaces Rápidos</h3>
          <ul>
            {quickLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.column}>
          <h3 className={styles.heading}>Apoyo</h3>
          <ul>
            <li>
              <DonationModalTrigger className={styles.footerDonateButton}>
                Donar
              </DonationModalTrigger>
            </li>
            {volunteerFormUrl && (
              <li>
                <a
                  className={styles.footerVolunteerButton}
                  href={volunteerFormUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Ser voluntario
                </a>
              </li>
            )}
          </ul>
        </div>

        <div className={styles.column}>
          <h3 className={styles.heading}>Contacto</h3>

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
