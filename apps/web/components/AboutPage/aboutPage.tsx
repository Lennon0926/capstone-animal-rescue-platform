"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  Target,
  Eye,
  Users,
  Shield,
  HandHeart,
  Phone,
  Mail,
  MapPin,
  Facebook,
  Calendar,
  ArrowRight,
} from "lucide-react";
import styles from "./aboutPage.module.css";

// Hook for scroll-reveal animation
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(styles.visible);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px",
      }
    );

    const elements = ref.current?.querySelectorAll(
      `.${styles.fadeInUp}, .${styles.fadeInLeft}, .${styles.fadeInRight}`
    );

    elements?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return ref;
}

// Team members data
const teamMembers = [
  {
    name: "Voluntarios CPAAA",
    role: "Equipo de Rescate",
    bio: "Grupo de voluntarios dedicados al rescate y cuidado de animales abandonados en Aguadilla y el área oeste de Puerto Rico.",
  },
  {
    name: "Hogares Temporeros",
    role: "Red de Apoyo",
    bio: "Familias que abren sus hogares para brindar cuidado temporal a animales rescatados mientras se preparan para adopción.",
  },
  {
    name: "Comunidad",
    role: "Colaboradores",
    bio: "Ciudadanos comprometidos que apoyan nuestra misión a través de donaciones, difusión y participación activa.",
  },
];

// Values data
const values = [
  {
    icon: <Shield size={24} />,
    title: "Protección",
    text: "Defendemos los derechos de los animales y promovemos la Ley 154 de Puerto Rico.",
  },
  {
    icon: <Heart size={24} />,
    title: "Compasión",
    text: "Actuamos con amor y empatía hacia todas las criaturas que necesitan ayuda.",
  },
  {
    icon: <HandHeart size={24} />,
    title: "Compromiso",
    text: "Trabajamos incansablemente para mejorar la calidad de vida de los animales.",
  },
];

// Gallery images from community events
const galleryImages = [
  { src: "/about/img-1.jpg", alt: "Feria de Mascotas - Comunidad" },
  { src: "/about/img-2.jpg", alt: "Feria de Mascotas - Actividades" },
  { src: "/about/img-3.jpg", alt: "Programa de Educación" },
  { src: "/about/img-4.jpg", alt: "Rescate de Animales" },
  { src: "/about/img-5.jpg", alt: "Evento Comunitario" },
  { src: "/about/img-6.jpg", alt: "Voluntarios en Acción" },
  { src: "/about/img-7.jpg", alt: "Adopciones Exitosas" },
];

export default function AboutPage() {
  const containerRef = useScrollReveal();

  return (
    <div className={styles.page} ref={containerRef}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <p className={`${styles.heroTagline} ${styles.fadeInUp}`}>
            Desde 1990 Protegiendo Vidas
          </p>
          <h1 className={`${styles.heroTitle} ${styles.fadeInUp}`}>
            Ciudadanos Pro Albergue de Animales de Aguadilla
          </h1>
          <p className={`${styles.heroSubtitle} ${styles.fadeInUp}`}>
            Somos un grupo de voluntarios trabajando arduamente en pro del
            bienestar de animales maltratados o abandonados. Les proveemos
            atención médica, alimento y albergue mientras buscamos hogares
            permanentes y amorosos.
          </p>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className={`${styles.section} ${styles.sectionAlt}`}>
        <div className={styles.sectionInner}>
          <div className={`${styles.sectionHeader} ${styles.fadeInUp}`}>
            <h2 className={styles.sectionTitle}>Nuestra Razón de Ser</h2>
            <p className={styles.sectionSubtitle}>
              Guiados por nuestros valores, trabajamos para crear una sociedad
              más justa y compasiva con los animales.
            </p>
          </div>

          <div className={styles.missionVisionGrid}>
            <div className={`${styles.missionCard} ${styles.fadeInLeft}`}>
              <div className={styles.cardIcon}>
                <Target size={32} />
              </div>
              <h3 className={styles.cardTitle}>Nuestra Misión</h3>
              <p className={styles.cardText}>
                Estamos comprometidos con el establecimiento de programas que
                mejoren la calidad de vida de los animales en Puerto Rico y
                ayuden a reducir la cantidad de animales desamparados. Nos
                proponemos crear consciencia entre la comunidad de las
                necesidades, cuidado y trato humanitario y leyes para la
                protección de animales. Esto lo lograremos con programas de
                esterilización y educación así como promoviendo la adopción de
                mascotas.
              </p>
            </div>

            <div className={`${styles.visionCard} ${styles.fadeInRight}`}>
              <div className={styles.cardIcon}>
                <Eye size={32} />
              </div>
              <h3 className={styles.cardTitle}>Nuestra Visión</h3>
              <p className={styles.cardText}>
                Lograr alcanzar una reducción significativa en el maltrato y
                negligencia hacia los animales para convertirnos en una sociedad
                ejemplar en su atención hacia estas criaturas. Nuestra meta es
                establecer un albergue que se convierta en un centro comunitario
                de adopción y educación donde podamos atender, rehabilitar y
                esterilizar animales para ser dados en adopción.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className={styles.section}>
        <div className={styles.sectionInner}>
          <div className={styles.storySection}>
            <div className={`${styles.storyContent} ${styles.fadeInLeft}`}>
              <h2 className={styles.storyTitle}>Nuestra Historia</h2>
              <p className={styles.storyText}>
                En noviembre de 1990, un grupo de ciudadanos de Aguadilla,
                conscientes del problema de maltrato y de la falta de control en
                la población de animales, decidieron crear una organización
                protectora para buscar soluciones a esta problemática.
              </p>
              <p className={styles.storyText}>
                Ciudadanos Pro Albergue de Animales de Aguadilla se incorpora el
                3 de diciembre de 1990 bajo las leyes del Departamento de Estado
                de Puerto Rico. Desde entonces, hemos ofrecido servicios de
                esterilización y castración de mascotas, educación, rescate y
                adopción de animales no solo en nuestro pueblo, sino también en
                toda el área oeste.
              </p>
              <p className={styles.storyText}>
                Aunque la organización se llama Ciudadanos Pro Albergue de
                Animales de Aguadilla, lamentablemente no contamos todavía con
                un albergue físico. Solo disponemos de nuestros hogares y
                familia para brindar cuidados a aquellos que nuestra capacidad
                de espacio y económica nos permite.
              </p>
              <div className={styles.storyHighlight}>
                <Calendar size={20} />
                <span className={styles.highlightText}>
                  Más de 30 años ayudando a miles de animales en Puerto Rico
                </span>
              </div>
            </div>

            <div className={`${styles.storyImage} ${styles.fadeInRight}`}>
              <Image
                src="/about/historia-cpaaa.jpg"
                alt="Historia de CPAAA - Comunidad ayudando animales"
                fill
                style={{ objectFit: "cover" }}
                sizes="(max-width: 900px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className={`${styles.section} ${styles.sectionAlt}`}>
        <div className={styles.sectionInner}>
          <div className={`${styles.sectionHeader} ${styles.fadeInUp}`}>
            <h2 className={styles.sectionTitle}>Nuestros Valores</h2>
            <p className={styles.sectionSubtitle}>
              Nuestros valores se fundamentan en que creemos en el deber del
              hombre de cuidar y proteger todas las criaturas del mundo.
            </p>
          </div>

          <div className={styles.valuesGrid}>
            {values.map((value, index) => (
              <div
                key={value.title}
                className={`${styles.valueCard} ${styles.fadeInUp}`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className={styles.valueIcon}>{value.icon}</div>
                <h3 className={styles.valueTitle}>{value.title}</h3>
                <p className={styles.valueText}>{value.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Image Gallery Section */}
      <section className={styles.section}>
        <div className={styles.sectionInner}>
          <div className={`${styles.sectionHeader} ${styles.fadeInUp}`}>
            <h2 className={styles.sectionTitle}>Nuestra Comunidad en Acción</h2>
            <p className={styles.sectionSubtitle}>
              Momentos de nuestras ferias de mascotas, programas educativos y
              actividades comunitarias.
            </p>
          </div>

          <div className={styles.imageGallery}>
            {galleryImages.map((image, index) => (
              <div
                key={image.src}
                className={`${styles.galleryImage} ${styles.fadeInUp}`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  style={{ objectFit: "cover" }}
                  sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 25vw"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className={`${styles.section} ${styles.sectionAlt}`}>
        <div className={styles.sectionInner}>
          <div className={`${styles.sectionHeader} ${styles.fadeInUp}`}>
            <h2 className={styles.sectionTitle}>Nuestro Equipo</h2>
            <p className={styles.sectionSubtitle}>
              Un grupo dedicado de voluntarios que trabajan incansablemente por
              el bienestar animal.
            </p>
          </div>

          <div className={styles.teamGrid}>
            {teamMembers.map((member, index) => (
              <div
                key={member.name}
                className={`${styles.teamCard} ${styles.fadeInUp}`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className={styles.teamImageWrapper}>
                  <div className={styles.teamPlaceholder}>
                    <Users size={64} />
                  </div>
                </div>
                <div className={styles.teamInfo}>
                  <h3 className={styles.teamName}>{member.name}</h3>
                  <p className={styles.teamRole}>{member.role}</p>
                  <p className={styles.teamBio}>{member.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className={styles.section}>
        <div className={styles.sectionInner}>
          <div className={`${styles.sectionHeader} ${styles.fadeInUp}`}>
            <h2 className={styles.sectionTitle}>Contáctenos</h2>
            <p className={styles.sectionSubtitle}>
              Estamos aquí para ayudarte. Somos una organización de voluntarios,
              por lo que te pedimos paciencia con cualquier solicitud.
            </p>
          </div>

          <div className={styles.contactGrid}>
            <div className={`${styles.contactCard} ${styles.fadeInUp}`}>
              <div className={styles.contactIcon}>
                <Phone size={24} />
              </div>
              <div className={styles.contactDetails}>
                <h4>Teléfono</h4>
                <p>
                  <a href="tel:787-505-8255">787-505-8255</a>
                </p>
              </div>
            </div>

            <div
              className={`${styles.contactCard} ${styles.fadeInUp}`}
              style={{ transitionDelay: "100ms" }}
            >
              <div className={styles.contactIcon}>
                <Mail size={24} />
              </div>
              <div className={styles.contactDetails}>
                <h4>Correo Electrónico</h4>
                <p>
                  <a href="mailto:info@cpaaa.org">info@cpaaa.org</a>
                </p>
              </div>
            </div>

            <div
              className={`${styles.contactCard} ${styles.fadeInUp}`}
              style={{ transitionDelay: "200ms" }}
            >
              <div className={styles.contactIcon}>
                <MapPin size={24} />
              </div>
              <div className={styles.contactDetails}>
                <h4>Dirección Postal</h4>
                <p>
                  Ciudadanos Pro Albergue de Animales de Aguadilla, Inc.
                  <br />
                  Box 4152
                  <br />
                  Aguadilla, Puerto Rico 00605
                </p>
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className={`${styles.socialSection} ${styles.fadeInUp}`}>
            <h3 className={styles.socialTitle}>Síguenos en Redes Sociales</h3>
            <div className={styles.socialLinks}>
              <a
                href="https://www.facebook.com/Ciudadanos-Pro-Albergue-de-Animales-de-Aguadilla-Inc-147815628577682/"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialLink}
                aria-label="Visita nuestra página de Facebook"
              >
                <Facebook size={28} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <div className={`${styles.ctaContent} ${styles.fadeInUp}`}>
          <h2 className={styles.ctaTitle}>Tú También Puedes Hacer la Diferencia</h2>
          <p className={styles.ctaText}>
            Actívate, esteriliza tus mascotas, respeta la Ley 154 y contribuye
            con tus ideas, comentarios y donativos. Juntos podemos ayudar a más
            animales.
          </p>
          <Link href="/donation" className={styles.ctaButton}>
            Ayúdanos a Ayudar
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>
    </div>
  );
}
