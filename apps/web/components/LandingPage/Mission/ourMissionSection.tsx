import styles from "./ourMissionSection.module.css";

export default function MissionSection() {
  return (
    <section className={styles.missionSection}>
      <div className={styles.missionInner}>
        
        <h2 className={styles.missionTitle}>
          Nuestra Misión
        </h2>

        <p className={styles.missionText}>
          Somos una organización sin fines de lucro que cuenta con el trabajo de voluntarios, 
          sus hogares y familia para brindar cuidados a aquellos animales que nuestra capacidad 
          económica y de espacio nos permite. A pesar del nombre no contamos todavía con un 
          albergue o santuario que pueda acoger a los animales abandonados. Aún así hemos 
          logrado ayudar a miles de animales rescatados.
        </p>

      </div>
    </section>
  );
}