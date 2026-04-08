"use client";

import { useRef } from "react";
import { useRevealOnIntersect } from "@/components/LandingPage/useRevealOnIntersect";
import styles from "./missionVideoSection.module.css";

const MISSION_HEADLINE =
  "Somos una organización sin fines de lucro impulsada por voluntarios que rescata, orienta y moviliza apoyo para animales vulnerables en Aguadilla y el área oeste.";

const MISSION_GROUPS = [
  {
    title: "Qué hace CPAAA",
    items: [
      "Apoya a cuidadores independientes y hogares temporeros.",
      "Organiza campañas de esterilización y castración.",
      "Orienta a la comunidad sobre cuidado responsable, adopción y protección animal.",
    ],
  },
  {
    title: "Objetivos principales",
    items: [
      "Reducir la cantidad de animales desamparados en Puerto Rico.",
      "Promover educación, trato humanitario y conciencia comunitaria.",
      "Avanzar hacia un albergue y centro comunitario de adopción y educación.",
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
    <section className={styles.section} ref={sectionRef}>
      <video
        className={styles.video}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      >
        <source src="/videos/Playa.mp4" type="video/mp4" />
      </video>

      <div className={styles.overlay} />

      <div className={styles.content}>
        <div className={`${styles.intro} ${styles.reveal}`}>
          <h2 className={styles.title}>{MISSION_HEADLINE}</h2>
        </div>

        <div className={`${styles.details} ${styles.reveal} ${styles.revealDelayed}`}>
          <div className={styles.listGroups}>
            {MISSION_GROUPS.map((group) => (
              <article key={group.title} className={styles.group}>
                <h3 className={styles.groupTitle}>{group.title}</h3>
                <ul className={styles.list}>
                  {group.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
