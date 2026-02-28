import styles from "./howItWorksSection.module.css";
import { Search, ClipboardList, Home } from "lucide-react";

const steps = [
  {
    id: 1,
    title: "Explora los Animales",
    description:
      "Descubre los animales rescatados que buscan un hogar. Filtra por especie, edad, tamaño y personalidad para encontrar tu compañero ideal.",
    icon: <Search size={28} />,
  },
  {
    id: 2,
    title: "Envía tu Solicitud",
    description:
      "Completa nuestro sencillo formulario de adopción. Revisaremos tu información y coordinaremos un encuentro con tu posible nuevo amigo.",
    icon: <ClipboardList size={28} />,
  },
  {
    id: 3,
    title: "Dale la Bienvenida a Casa",
    description:
      "Una vez aprobada la solicitud, finaliza el proceso de adopción y lleva a tu nuevo miembro de la familia a casa. Te acompañamos para asegurar una transición tranquila.",
    icon: <Home size={28} />,
  },
];

export default function HowItWorks() {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <h1 className={styles.title}>Proceso de Adopción</h1>
        <p className={styles.subtitle}>
          Nuestro proceso de adopción es simple y transparente. Sigue estos pasos para darle a un animal rescatado la oportunidad de encontrar un hogar amoroso.
        </p>

        <div className={styles.steps}>
          <div className={styles.line}></div>

          {steps.map((step) => (
            <div key={step.id} className={styles.step}>
              <div className={styles.number}>{step.id}</div>

              <div className={styles.iconWrapper}>
                {step.icon}
              </div>

              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepDescription}>{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}