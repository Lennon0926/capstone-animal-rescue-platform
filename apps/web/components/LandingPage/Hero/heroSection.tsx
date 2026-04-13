import styles from "./heroSection.module.css";

export default function HeroSection() {
  return (
    <section className={styles.hero}>
      <div className={styles.videoReveal}>
        <video
          className={styles.video}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        >
          <source src="/videos/close-up-dog.mp4" type="video/mp4" />
        </video>

        <div className={styles.overlay} aria-hidden="true" />
      </div>

      <div className={styles.revealFrame} aria-hidden="true" />

      <div className={styles.content}>
        <h1 className={styles.title}>
          Una donación{" "}
          <span className={styles.accent}>rescata</span>,{" "}
          <span className={styles.accent}>ayuda</span>, y{" "}
          <span className={styles.accent}>salva</span>{" "}
          las vidas más vulnerables
        </h1>

        <p className={styles.subtitle}>
          Sé parte de una de las redes de ayuda para animales sin hogar más
          importantes
        </p>
      </div>
    </section>
  );
}
