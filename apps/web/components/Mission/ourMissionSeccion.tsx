import styles from "./ourMissionSeccion.module.css";

export default function OurMissionSeccion () {
  return (
    <section className={styles.missionSection}>
      <div className={styles.missionInner}>
        
        <h2 className={styles.missionTitle}>
          Nuestra Misión
        </h2>

        <p className={styles.missionText}>
          Somos una organización sin fines de lucro impulsada por voluntarios 
          que abren las puertas de sus hogares y familias para brindar cuidado 
          y protección a animales rescatados.
        </p>

        <p className={styles.missionText}>
          Actualmente no contamos con un albergue físico. Cada rescate es posible 
          gracias a nuestra red de hogares temporales y al apoyo de personas comprometidas.
        </p>

        <p className={styles.missionText}>
          A pesar de nuestras limitaciones de espacio y recursos, hemos logrado 
          ayudar a miles de animales a encontrar una segunda oportunidad.
        </p>

      </div>
    </section>
  );
}