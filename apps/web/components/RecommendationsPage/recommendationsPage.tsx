import Image from "next/image";
import Link from "next/link";
import DonationModalTrigger from "@/components/DonationPage/DonationModalTrigger";
import { isAdoptCatalogVisible } from "@/lib/publicNavigation";
import {
  CalendarCheck,
  HeartHandshake,
  Home,
  PawPrint,
  ShieldCheck,
  Stethoscope,
  Wallet,
} from "lucide-react";
import styles from "./recommendationsPage.module.css";

const questions = [
  "¿Por qué quieres adoptar y qué esperas de esa relación a largo plazo?",
  "¿Tienes tiempo diario para alimento, agua, ejercicio, compañía y cuidado?",
  "¿Puedes cubrir comida, vacunas, esterilización, veterinario y emergencias?",
  "¿Tu vivienda permite mascotas y es segura para el animal que tienes en mente?",
  "¿Tu rutina, viajes y responsabilidades actuales permiten un compromiso estable?",
  "¿Estás listo para cuidar a ese animal por toda su vida?",
];

const careCommitments = [
  {
    icon: <CalendarCheck size={28} />,
    title: "Tiempo todos los días",
    text: "Un animal no puede esperar a que sobre tiempo. Necesita rutina, atención, ejercicio, socialización y paciencia mientras se adapta.",
  },
  {
    icon: <Wallet size={28} />,
    title: "Gastos reales",
    text: "La adopción responsable incluye comida, vacunas, desparasitación, esterilización, medicamentos, juguetes y cuidado veterinario.",
  },
  {
    icon: <Home size={28} />,
    title: "Hogar adecuado",
    text: "Antes de adoptar, confirma reglas de alquiler o comunidad, espacio disponible, seguridad del patio y convivencia con otras mascotas.",
  },
  {
    icon: <Stethoscope size={28} />,
    title: "Salud y seguimiento",
    text: "Los animales rescatados pueden necesitar citas, tratamientos o cambios de conducta. La constancia hace la diferencia.",
  },
];

const helpOptions = [
  {
    title: "Hogar temporero",
    text: "Abrir tu casa de forma temporal ayuda a que un animal rescatado tenga un ambiente seguro mientras se recupera y se prepara para adopción.",
  },
  {
    title: "Donaciones",
    text: "Las aportaciones monetarias apoyan atención veterinaria, medicamentos, vacunas, esterilizaciones, alimentos y transportación.",
  },
  {
    title: "Suministros",
    text: "Comida, artículos de limpieza, jaulas, correas, medicamentos y tarjetas de regalo ayudan a cubrir necesidades diarias.",
  },
  {
    title: "Difusión y educación",
    text: "Compartir información, colocar flyers y promover la Ley 154 ayuda a prevenir maltrato, abandono y sobrepoblación.",
  },
];

export default function RecommendationsPage() {
  const showAdoptCatalog = isAdoptCatalogVisible();

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroImage}>
          <Image
            src="/about/img-7.jpg"
            alt="Persona compartiendo con un animal rescatado"
            fill
            priority
            sizes="(max-width: 900px) 100vw, 46vw"
          />
        </div>
        <div className={styles.heroContent}>
          <p className={styles.kicker}>Recomendaciones</p>
          <h1>Antes de adoptar, piensa en el compromiso completo</h1>
          <p className={styles.heroText}>
            Adoptar puede cambiar una vida, pero también requiere tiempo, estabilidad, recursos y
            responsabilidad. Esta guía te ayuda a evaluar si es el momento correcto y cómo puedes
            ayudar si todavía no puedes adoptar.
          </p>
          <div className={styles.heroActions}>
            {showAdoptCatalog && (
              <Link href="/adopt" className={styles.primaryAction}>
                Ver animales disponibles
              </Link>
            )}
            <a href="#help" className={styles.secondaryAction}>
              Cómo ayudar
            </a>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <p className={styles.kicker}>Preguntas importantes</p>
          <h2>Una adopción responsable empieza antes de llenar una solicitud</h2>
          <p>
            Tomarte unos minutos para responder con honestidad puede evitar frustración para la
            familia y, sobre todo, para el animal que dependerá completamente de su nuevo hogar.
          </p>
        </div>

        <div className={styles.questionGrid}>
          {questions.map((question, index) => (
            <article key={question} className={styles.questionCard}>
              <span className={styles.questionNumber}>{index + 1}</span>
              <p>{question}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={`${styles.section} ${styles.surfaceSection}`}>
        <div className={styles.sectionHeader}>
          <p className={styles.kicker}>Preparación</p>
          <h2>Lo que debes tener listo</h2>
          <p>
            Perros y gatos pueden vivir muchos años. El compromiso incluye cuidados diarios, gastos
            recurrentes y decisiones responsables por toda su vida.
          </p>
        </div>

        <div className={styles.commitmentGrid}>
          {careCommitments.map((item) => (
            <article key={item.title} className={styles.commitmentCard}>
              <div className={styles.iconBadge}>{item.icon}</div>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="help" className={styles.section}>
        <div className={styles.splitSection}>
          <div>
            <p className={styles.kicker}>Cómo ayudar</p>
            <h2>Si ahora no puedes adoptar, todavía puedes salvar vidas</h2>
            <p className={styles.leadText}>
              La organización depende de voluntarios, hogares temporeros, donaciones y apoyo
              comunitario. Nadie está obligado a hacer más de lo que puede, pero cada aportación
              ayuda a rescatar, rehabilitar y preparar animales para hogares permanentes.
            </p>
          </div>

          <div className={styles.helpList}>
            {helpOptions.map((option) => (
              <article key={option.title} className={styles.helpItem}>
                <h3>{option.title}</h3>
                <p>{option.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.calloutSection}`}>
        <div className={styles.calloutGrid}>
          <article className={styles.calloutCard}>
            <div className={styles.calloutIcon}>
              <HeartHandshake size={30} />
            </div>
            <h2>Hogares temporeros</h2>
            <p>
              Un hogar temporero ofrece seguridad, amor y cuidado por un tiempo definido. Es una
              forma concreta de ayudar cuando un animal rescatado necesita recuperarse antes de
              encontrar una familia permanente.
            </p>
          </article>

          <article className={styles.calloutCard}>
            <div className={styles.calloutIcon}>
              <ShieldCheck size={30} />
            </div>
            <h2>Protección animal</h2>
            <p>
              Conocer y compartir la Ley 154 fortalece la respuesta comunitaria contra el maltrato,
              la negligencia, el abandono y la sobrepoblación de animales.
            </p>
          </article>
        </div>
      </section>

      <section className={styles.finalCta}>
        <div className={styles.finalCtaContent}>
          <PawPrint size={36} />
          <h2>Haz el próximo paso con responsabilidad</h2>
          <p>
            Si ya evaluaste el compromiso y puedes ofrecer un hogar estable, revisa los animales
            disponibles. Si no es el momento, puedes ayudar con tiempo, donativos, suministros o
            difusión.
          </p>
          <div className={styles.finalActions}>
            {showAdoptCatalog && (
              <Link href="/adopt" className={styles.finalPrimary}>
                Ver animales disponibles
              </Link>
            )}
            <DonationModalTrigger className={styles.finalSecondary}>Donar</DonationModalTrigger>
            <Link href="/about" className={styles.finalSecondary}>
              Conocer CPAAA
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
