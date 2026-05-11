import Link from "next/link";
import { isAdoptCatalogVisible } from "@/lib/publicNavigation";
import styles from "./getInvolvedSection.module.css";

export default function GetInvolvedSection() {
  const showAdoptCatalog = isAdoptCatalogVisible();
  const ctaHref = showAdoptCatalog ? "/adopt" : "/recommendations";
  const ctaLabel = showAdoptCatalog ? "Ver animales disponibles →" : "Leer recomendaciones →";

  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.splitLayout}>
          <div className={styles.left}>
            <h2 className={styles.heading}>Conoce más sobre nuestro trabajo</h2>
          </div>
          <div className={styles.right}>
            <p className={styles.description}>
              Existen muchas formas de ayudar en nuestra misión. Puedes adoptar, ser voluntario,
              donar, o simplemente compartir información sobre nuestros animales. Tu participación
              es crucial para mejorar la calidad de vida de los animales sin hogar.
            </p>
            <p className={styles.description}>
              Al participar en nuestras iniciativas y contribuir, juegas un papel fundamental en
              darle una segunda oportunidad a los animales más vulnerables de nuestra comunidad.
            </p>
            <Link href={ctaHref} className={styles.cta}>
              {ctaLabel}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
