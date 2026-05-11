"use client";

import { useRef } from "react";
import { useRevealOnIntersect } from "@/components/LandingPage/useRevealOnIntersect";
import styles from "./missionVideoSection.module.css";

const MISSION_HEADLINE =
  "Somos la red de ayuda mas importante del area Oeste en el cuidado de animales callejeros.";

const MISSION_SUPPORT =
  "Trabajamos con voluntarios, hogares temporeros y orientación comunitaria para que cada caso tenga continuidad.";

const MISSION_GROUPS = [
  {
    index: "01",
    title: "Lo que hacemos",
    description:
      "Respondemos con apoyo directo y coordinación comunitaria.",
    items: [
      "Apoyo a rescatistas y hogares temporeros.",
      "Campañas de esterilización y castración.",
      "Orientación sobre cuidado responsable y adopción.",
    ],
  },
  {
    index: "02",
    title: "Hacia dónde vamos",
    description:
      "Queremos ampliar la red de apoyo y crear una base más estable para rescatar más vidas.",
    items: [
      "Reducir la cantidad de animales desamparados en Puerto Rico.",
      "Avanzar hacia un albergue y centro comunitario de adopción y educación.",
      "Fortalecer una red sostenible de voluntariado y apoyo.",
    ],
  },
] as const;

export default function MissionVideoSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useRevealOnIntersect({
    rootRef: sectionRef,
    selector: `.${styles.reveal}`,
    visibleClassName: styles.isVisible,
  });

  return (
    <section
      className={styles.section}
      ref={sectionRef}
      aria-labelledby="mission-heading"
    >
      <video
        className={styles.video}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster="/videos/playa-poster.jpg"
        aria-hidden="true"
      >
        <source src="/videos/Playa.mp4" type="video/mp4" />
      </video>

      <div className={styles.overlay} aria-hidden="true" />

      <div className={styles.content}>
        <div className={styles.layout}>
          <div className={`${styles.leadColumn} ${styles.reveal}`}>
            <h2 id="mission-heading" className={styles.sectionHeading}>
              Nuestra misión
            </h2>
            <p className={styles.headline}>{MISSION_HEADLINE}</p>
            <p className={styles.supportingText}>{MISSION_SUPPORT}</p>
          </div>

          <div
            className={`${styles.groups} ${styles.reveal} ${styles.revealDelayed}`}
          >
            {MISSION_GROUPS.map((group) => (
              <article key={group.title} className={styles.group}>
                <span className={styles.groupIndex} aria-hidden="true">
                  {group.index}
                </span>
                <div className={styles.groupBody}>
                  <h3 className={styles.groupTitle}>{group.title}</h3>
                  <p className={styles.groupDescription}>{group.description}</p>
                  <ul className={styles.groupItems}>
                    {group.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
