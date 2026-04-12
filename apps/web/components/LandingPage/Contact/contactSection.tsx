import { Mail, Phone, MapPin } from "lucide-react";
import styles from "./contactSection.module.css";

export default function ContactSection() {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <h2 className={styles.heading}>Contáctanos</h2>
        <p className={styles.description}>
          ¿Tienes preguntas o quieres saber cómo puedes ayudar? No dudes en
          comunicarte con nosotros.
        </p>

        <div className={styles.contactGrid}>
          <div className={styles.contactItem}>
            <Mail size={24} className={styles.icon} />
            <div>
              <h4 className={styles.contactLabel}>Email</h4>
              <a href="mailto:info@animalrescue.org" className={styles.contactValue}>
                info@animalrescue.org
              </a>
            </div>
          </div>

          <div className={styles.contactItem}>
            <Phone size={24} className={styles.icon} />
            <div>
              <h4 className={styles.contactLabel}>Teléfono</h4>
              <a href="tel:+17875058255" className={styles.contactValue}>
                (787) 505-8255
              </a>
            </div>
          </div>

          <div className={styles.contactItem}>
            <MapPin size={24} className={styles.icon} />
            <div>
              <h4 className={styles.contactLabel}>Dirección</h4>
              <p className={styles.contactValue}>
                Box 4152, Aguadilla, Puerto Rico 00605
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
