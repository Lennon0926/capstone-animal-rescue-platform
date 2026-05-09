import { ArrowUpRight, CheckCircle, HeartHandshake } from "lucide-react";
import styles from "./volunteerIntakeSection.module.css";

const volunteerOptions = [
  "Transportación",
  "Fundraising",
  "Cuidado animal",
  "Hogar temporero",
  "Eventos",
  "Charlas educativas",
  "Transporto sin foster",
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
              Become a Volunteer
            </h2>
            <p className={styles.description}>
              Want to help rescued animals? Complete our volunteer form and tell
              us your skills, availability, and how you would like to support
              the shelter. You can help with transportation, fundraising, animal
              care, events, educational talks, or other volunteer opportunities.
              Even if you cannot foster animals, there are still many ways to
              make a difference.
            </p>
          </div>
        </div>

        <div className={styles.actionPanel}>
          <ul className={styles.optionList} aria-label="Volunteer opportunities">
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
              Fill Out Volunteer Form
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
