import styles from "./missionVideoSection.module.css";

export default function MissionVideoSection() {
  return (
    <section className={styles.section}>
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
        <p className={styles.text}>
          Ciudadanos Pro Albergue de Animales de Aguadilla es una red de ayuda
          que se encarga de ayudar a cuidadores independientes, campañas de
          esterilización, y una fuente de información para la comunidad.
        </p>
      </div>
    </section>
  );
}
