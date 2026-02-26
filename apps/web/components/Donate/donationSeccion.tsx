import Image from "next/image";
import styles from "./donationSeccion.module.css";

export default function DonationSection() {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        
        <div className={styles.content}>
          <h1 className={styles.title}>
            Giving Every Animal <br /> a Second Chance
          </h1>

          <p className={styles.description}>
            We connect abandoned and rescued animals with loving families.
            Join our mission to provide care, shelter, and hope to animals in need.
          </p>

          <button className={styles.donateButton}>
            Donate Now
          </button>
        </div>

        <div className={styles.imageWrapper}>
          <Image
            src="/donationDogPicture.jpeg"
            alt="Rescued dog being petted"
            className={styles.image}
            width={500}
            height={500}
          />
        </div>

      </div>
    </section>
  );
}