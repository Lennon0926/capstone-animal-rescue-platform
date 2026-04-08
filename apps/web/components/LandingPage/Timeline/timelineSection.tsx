import styles from "./timelineSection.module.css";

const timelineData = [
  {
    year: "2015",
    title: "Fundación",
    description:
      "Ciudadanos Pro Albergue de Animales de Aguadilla fue fundada por un grupo de voluntarios comprometidos con el bienestar animal en la comunidad de Aguadilla.",
  },
  {
    year: "2017",
    title: "Primera campaña de esterilización",
    description:
      "Se llevó a cabo la primera campaña masiva de esterilización, atendiendo a más de 200 animales en comunidades vulnerables del área oeste.",
  },
  {
    year: "2019",
    title: "Expansión de la red de cuidadores",
    description:
      "La organización expandió su red de cuidadores independientes, estableciendo alianzas con voluntarios en múltiples municipios de Puerto Rico.",
  },
  {
    year: "2021",
    title: "Centro de información comunitaria",
    description:
      "Se inauguró el centro de información y recursos para la comunidad, ofreciendo orientación sobre cuidado responsable de mascotas y procesos de adopción.",
  },
  {
    year: "2023",
    title: "Plataforma digital",
    description:
      "Lanzamiento de la plataforma digital para facilitar adopciones, donaciones y conectar a la comunidad con los animales que necesitan un hogar.",
  },
];

export default function TimelineSection() {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <h2 className={styles.sectionTitle}>Nuestra Historia</h2>

        <div className={styles.timeline}>
          {timelineData.map((item, index) => (
            <div key={item.year} className={styles.entry}>
              <div className={styles.yearColumn}>
                <span className={styles.year}>{item.year}</span>
              </div>
              <div className={styles.descriptionColumn}>
                <h3 className={styles.entryTitle}>{item.title}</h3>
                <p className={styles.entryText}>{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
