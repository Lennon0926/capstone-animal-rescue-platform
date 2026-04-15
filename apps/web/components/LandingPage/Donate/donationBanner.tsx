import styles from "./donationBanner.module.css";
import { CheckCircle } from "lucide-react";
import DonationModalTrigger from "../../DonationPage/DonationModalTrigger";

export default function DonationBanner() {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>

        <div className={styles.content}>
          <h2 className={styles.title}>Ayúdanos a Salvar Más Vidas</h2>

          <p className={styles.description}>
            Tu donación apoya directamente el rescate animal, atención médica,
            refugio y procesos de adopción. Cada aporte hace una diferencia real
            en la vida de un animal.
          </p>

          <div className={styles.benefits}>
            <div className={styles.benefit}>
              <CheckCircle size={18} />
              <span>100% destinado a los animales</span>
            </div>

            <div className={styles.benefit}>
              <CheckCircle size={18} />
              <span>Pago seguro</span>
            </div>
          </div>
        </div>

        <div className={styles.actions}>
          <DonationModalTrigger className={styles.primaryButton}>
            Donar Ahora
          </DonationModalTrigger>
        </div>

      </div>
    </section>
  );
}
