"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";
import { useRevealOnIntersect } from "@/components/LandingPage/useRevealOnIntersect";
import styles from "./storiesSection.module.css";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const PARALLAX_RANGE_PX = 72;
const STORY_REVEAL_DELAY_MS = 85;

const STORIES = [
  {
    id: "alma",
    imageSrc: "/about/img-1.jpg",
    imageAlt: "Voluntario con un perro rescatado",
    ctaLabel: "Conocer mas",
    href: "/about",
    parallaxSpeed: -0.45,
    desktopPosition: "topLeft",
  },
  {
    id: "nilo",
    imageSrc: "/about/img-3.jpg",
    imageAlt: "Perro rescatado recibiendo cuidado",
    ctaLabel: "Conocer mas",
    href: "/about",
    parallaxSpeed: 0.62,
    desktopPosition: "topRight",
  },
  {
    id: "luna",
    imageSrc: "/about/img-5.jpg",
    imageAlt: "Equipo y animal rescatado en una actividad comunitaria",
    ctaLabel: "Conocer mas",
    href: "/about",
    parallaxSpeed: -0.7,
    desktopPosition: "bottomLeft",
  },
  {
    id: "max",
    imageSrc: "/about/img-7.jpg",
    imageAlt: "Perro en proceso de recuperación y adopción",
    ctaLabel: "Conocer mas",
    href: "/about",
    parallaxSpeed: 0.52,
    desktopPosition: "bottomRight",
  },
] as const;

type Story = (typeof STORIES)[number];
type StoryId = Story["id"];
type StoryOffsetMap = Record<StoryId, number>;

const INITIAL_OFFSETS = Object.fromEntries(
  STORIES.map((story) => [story.id, 0]),
) as StoryOffsetMap;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function useStoryParallax(sectionRef: RefObject<HTMLElement | null>) {
  const [offsets, setOffsets] = useState<StoryOffsetMap>(INITIAL_OFFSETS);

  useEffect(() => {
    const section = sectionRef.current;

    if (!section || typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);
    let frameId = 0;

    const updateOffsets = () => {
      if (mediaQuery.matches) {
        setOffsets(INITIAL_OFFSETS);
        return;
      }

      const rect = section.getBoundingClientRect();
      const viewportHeight = window.innerHeight || 1;
      const progress = clamp(
        (viewportHeight - rect.top) / (rect.height + viewportHeight),
        0,
        1,
      );
      const normalizedProgress = (progress - 0.5) * 2;

      setOffsets(
        Object.fromEntries(
          STORIES.map((story) => [
            story.id,
            Math.round(normalizedProgress * PARALLAX_RANGE_PX * story.parallaxSpeed),
          ]),
        ) as StoryOffsetMap,
      );
    };

    const requestUpdate = () => {
      if (frameId !== 0) {
        return;
      }

      frameId = window.requestAnimationFrame(() => {
        frameId = 0;
        updateOffsets();
      });
    };

    requestUpdate();

    const handleMotionPreferenceChange = () => {
      requestUpdate();
    };

    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    mediaQuery.addEventListener?.("change", handleMotionPreferenceChange);

    return () => {
      if (frameId !== 0) {
        window.cancelAnimationFrame(frameId);
      }

      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      mediaQuery.removeEventListener?.("change", handleMotionPreferenceChange);
    };
  }, [sectionRef]);

  return offsets;
}

export default function StoriesSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const offsets = useStoryParallax(sectionRef);

  useRevealOnIntersect({
    rootRef: sectionRef,
    selector: `.${styles.reveal}`,
    visibleClassName: styles.isVisible,
  });

  return (
    <section
      className={styles.section}
      aria-labelledby="stories-heading"
      ref={sectionRef}
    >
      <div className={styles.inner}>
        <div className={styles.stage}>
          <div className={`${styles.headingWrap} ${styles.reveal}`}>
            <h2 id="stories-heading" className={styles.title}>
              <span className={styles.titleLine}>Conoce algunas de</span>
              <span className={styles.titleLine}>nuestras historias</span>
            </h2>
          </div>

          {STORIES.map((story, index) => (
            <article
              key={story.id}
              data-testid="story-card"
              className={[
                styles.card,
                styles[story.desktopPosition],
                styles.reveal,
              ].join(" ")}
              style={
                {
                  "--story-shift": `${offsets[story.id]}px`,
                  "--story-delay": `${index * STORY_REVEAL_DELAY_MS}ms`,
                } as CSSProperties
              }
            >
              <div className={styles.media}>
                <Image
                  src={story.imageSrc}
                  alt={story.imageAlt}
                  fill
                  sizes="(max-width: 900px) min(100vw - 40px, 28rem), 20rem"
                  className={styles.mediaImage}
                />
                <Link
                  href={story.href}
                  className={styles.learnMore}
                  aria-label={`${story.ctaLabel} sobre esta historia`}
                >
                  {story.ctaLabel}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
