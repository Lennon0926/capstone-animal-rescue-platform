import { ArrowUpRight, CheckCircle, HeartHandshake } from "lucide-react";
import styles from "./volunteerIntakeSection.module.css";

const volunteerOptions = [
  "Transportación",
  "Recaudación de fondos",
  "Cuidado animal",
  "Hogar temporero",
  "Eventos",
  "Charlas educativas",
  "Puedo transportar, pero no ofrecer hogar temporero",
  "Todo lo anterior",
];

export default function VolunteerIntakeSection() {
  const volunteerFormUrl = process.env.NEXT_PUBLIC_VOLUNTEER_GOOGLE_FORM_URL;

  return (
    <section className={styles.section} aria-labelledby="volunteer-intake-title">
      <div className={styles.inner}>
        <div className={styles.content}>
          <div className={styles.iconWrap} aria-hidden="true">
            <HeartHandshake size={28} strokeWidth={2} />
          </div>

          <div className={styles.copy}>
            <p className={styles.eyebrow}>Voluntariado</p>
            <h2 id="volunteer-intake-title" className={styles.title}>
              Hazte voluntario
            </h2>
            <p className={styles.description}>
              ¿Quieres ayudar a los animales rescatados? Completa nuestro formulario de voluntariado
              y cuéntanos sobre tus destrezas, tu disponibilidad y cómo te gustaría apoyar al
              albergue. Puedes ayudar con transportación, recaudación de fondos, cuidado animal,
              eventos, charlas educativas u otras oportunidades de servicio. Aunque no puedas
              ofrecer hogar temporero, todavía hay muchas maneras de hacer la diferencia.
            </p>
          </div>
        </div>

        <div className={styles.actionPanel}>
          <ul className={styles.optionList} aria-label="Oportunidades de voluntariado">
            {volunteerOptions.map((option) => (
              <li key={option} className={styles.option}>
                <CheckCircle size={17} strokeWidth={2.4} aria-hidden="true" />
                <span>{option}</span>
              </li>
            ))}
          </ul>

          {volunteerFormUrl ? (
            <a
              className={styles.cta}
              href={volunteerFormUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Completa el formulario de voluntariado
              <ArrowUpRight size={18} strokeWidth={2.4} aria-hidden="true" />
            </a>
          ) : (
            <p className={styles.unavailable}>
              El formulario de voluntariado no está disponible en este momento.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
