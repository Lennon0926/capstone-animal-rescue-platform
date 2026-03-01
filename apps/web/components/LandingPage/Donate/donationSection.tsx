import Image from "next/image";
import Link from "next/link";
import styles from "./donationSection.module.css";

export default function DonationSection() {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.content}>
          <h2 className={styles.title}>
            Cada animal merece <br />
            una segunda oportunidad
          </h2>

          <p className={styles.description}>
            Ayudamos a animales abandonados y rescatados a encontrar familias
            que les brinden amor y un nuevo comienzo. Únete a nuestra misión
            para ofrecer cuidado, refugio y esperanza a quienes más lo
            necesitan.
          </p>

          <Link href="/donation" className={styles.donateButton}>
            Dona Ahora
          </Link>
        </div>

        <div className={styles.imageWrapper}>
          <Image
            src="/Animals/donationDogPicture.jpg"
            alt="Rescued dog being petted"
            className={styles.image}
            priority
            width={500}
            height={500}
          />
        </div>
      </div>
    </section>
  );
}
