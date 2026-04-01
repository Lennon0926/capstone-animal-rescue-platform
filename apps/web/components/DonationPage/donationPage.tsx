import styles from "./donationPage.module.css";

export default function DonationPage() {
  const monthlyGoal = 2000;
  const currentRaised = 1250;
  const progressPercent = Math.round((currentRaised / monthlyGoal) * 100);

  const donationTiers = [
    {
      amount: "$10",
      title: "Alimento",
      text: "Ayuda a cubrir comida y agua para un animal rescatado.",
    },
    {
      amount: "$25",
      title: "Cuidado basico",
      text: "Apoya vacunas, higiene y atencion veterinaria inicial.",
    },
    {
      amount: "$50",
      title: "Atencion medica",
      text: "Contribuye a tratamientos, medicamentos y recuperacion.",
    },
  ];

  const donationUses = [
    "Rescate y transporte de animales abandonados",
    "Atencion veterinaria y medicamentos",
    "Alimento, higiene y cuidado diario",
    "Apoyo al proceso de adopcion y recuperacion",
  ];

  return (
    <main className={styles.page} aria-label="Seccion de donaciones">
      <section className={styles.heroSection}>
        <div className={styles.heroInner}>
          <div className={styles.heroContent}>
            <p className={styles.eyebrow}>Ciudadanos Pro Albergue de Animales</p>
            <h1 className={styles.heroTitle}>Ayudanos a salvar mas vidas</h1>
            <p className={styles.heroText}>
              Tu donacion apoya directamente rescate animal, atencion medica,
              refugio temporal y procesos de adopcion responsable.
            </p>

            <ul className={styles.trustList}>
              <li>100% destinado a los animales</li>
              <li>Pago seguro</li>
              <li>Impacto local en Puerto Rico</li>
            </ul>

            <div className={styles.ctaRow}>
              <a
                href="https://www.paypal.com/donate?token=5BAeWqvP7cLCKMnV4H6uKYb_Arfr-I08PdcS8HsHL4SX0ubZoTW6uRkrBez8VuQWn-NqN9sdZpVEHNSk"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.paypalButton}
              >
                Donar con PayPal
              </a>

              <a
                href="https://stripe.com/payments/payment-links"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.stripeButton}
              >
                Stripe (proximamente)
              </a>
            </div>

            <div className={styles.athCard}>
              <span className={styles.athLabel}>ATH Movil</span>
              <span className={styles.athNumber}>787-689-5512</span>
            </div>
          </div>

          <aside className={styles.tiersPanel} aria-label="Niveles de donacion">
            <h2 className={styles.tiersTitle}>Aportes sugeridos</h2>
            <div className={styles.tiersGrid}>
              {donationTiers.map((tier) => (
                <article key={tier.amount} className={styles.tierCard}>
                  <p className={styles.tierAmount}>{tier.amount}</p>
                  <h3 className={styles.tierHeading}>{tier.title}</h3>
                  <p className={styles.tierText}>{tier.text}</p>
                </article>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className={styles.impactSection}>
        <div className={styles.impactInner}>
          <div className={styles.impactIntro}>
            <h2 className={styles.impactTitle}>Como ayuda tu donacion</h2>
            <p className={styles.impactText}>
              Cada contribucion nos permite seguir ayudando a animales
              rescatados y abandonados. Tu apoyo se convierte en alimento,
              tratamiento y nuevas oportunidades de vida.
            </p>
          </div>

          <div className={styles.impactList}>
            {donationUses.map((item) => (
              <div key={item} className={styles.impactItem}>
                <span className={styles.impactBullet} aria-hidden="true">
                  ✓
                </span>
                <p>{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.goalCard}>
          <div className={styles.goalHeader}>
            <div>
              <h3 className={styles.goalTitle}>Meta mensual de apoyo</h3>
              <p className={styles.goalText}>
                Ayudanos a continuar con rescates, tratamientos y adopciones.
              </p>
            </div>
            <p className={styles.goalAmount}>
              ${currentRaised.toLocaleString("en-US")} de ${monthlyGoal.toLocaleString("en-US")}
            </p>
          </div>

          <div className={styles.progressTrack} role="progressbar" aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100} aria-label="Progreso de meta mensual">
            <div
              className={styles.progressFill}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <p className={styles.progressMeta}>{progressPercent}% completado este mes</p>
        </div>
      </section>
    </main>
  );
}
