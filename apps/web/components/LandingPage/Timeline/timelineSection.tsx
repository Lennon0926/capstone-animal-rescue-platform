"use client";

import type { CSSProperties } from "react";
import { useRef } from "react";
import { useRevealOnIntersect } from "@/components/LandingPage/useRevealOnIntersect";
import styles from "./timelineSection.module.css";

const TIMELINE_ENTRY_DELAY_MS = 90;

const TIMELINE_ENTRIES = [
  {
    year: "2015",
    title: "Fundación",
    description:
      "Ciudadanos Pro Albergue de Animales de Aguadilla fue fundada por un grupo de voluntarios comprometidos con el bienestar animal en la comunidad de Aguadilla.",
  },
  {
    year: "2017",
    title: "Primera campaña de esterilización",
    description:
      "Se llevó a cabo la primera campaña masiva de esterilización, atendiendo a más de 200 animales en comunidades vulnerables del área oeste.",
  },
  {
    year: "2019",
    title: "Expansión de la red de cuidadores",
    description:
      "La organización expandió su red de cuidadores independientes, estableciendo alianzas con voluntarios en múltiples municipios de Puerto Rico.",
  },
  {
    year: "2021",
    title: "Centro de información comunitaria",
    description:
      "Se inauguró el centro de información y recursos para la comunidad, ofreciendo orientación sobre cuidado responsable de mascotas y procesos de adopción.",
  },
  {
    year: "2023",
    title: "Plataforma digital",
    description:
      "Lanzamiento de la plataforma digital para facilitar adopciones, donaciones y conectar a la comunidad con los animales que necesitan un hogar.",
  },
] as const;

export default function TimelineSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useRevealOnIntersect({
    rootRef: sectionRef,
    selector: `.${styles.revealEntry}`,
    visibleClassName: styles.isVisible,
  });

  return (
    <section
      className={styles.section}
      aria-labelledby="timeline-heading"
      ref={sectionRef}
    >
      <div className={styles.inner}>
        <h2 id="timeline-heading" className={styles.sectionLabel}>
          Nuestra historia
        </h2>

        <div className={styles.timeline}>
          {TIMELINE_ENTRIES.map((item, index) => (
            <article
              key={item.year}
              className={`${styles.entry} ${styles.revealEntry}`}
              style={
                {
                  "--timeline-delay": `${index * TIMELINE_ENTRY_DELAY_MS}ms`,
                } as CSSProperties
              }
            >
              <p className={styles.year}>{item.year}</p>
              <div className={styles.copyColumn}>
                <h3 className={styles.entryTitle}>{item.title}</h3>
                <p className={styles.entryText}>{item.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
