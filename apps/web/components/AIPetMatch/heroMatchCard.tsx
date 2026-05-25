"use client";

import Image from "next/image";
import Link from "next/link";
import { getAnimalImageUrl } from "@/utils/animalImages";
import type { PetMatch } from "./matchResultCard";
import type { RequestedFields } from "./aiPetMatch";
import styles from "./heroMatchCard.module.css";

function capitalize(text: string) {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
}

const RADIUS = 36;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function ScoreGauge({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(1, score));
  const percent = Math.round(clamped * 100);
  const offset = CIRCUMFERENCE * (1 - clamped);

  return (
    <div
      className={styles.gauge}
      role="img"
      aria-label={`Compatibilidad ${percent}%`}
    >
      <svg className={styles.gaugeSvg} viewBox="0 0 84 84">
        <circle className={styles.gaugeTrack} cx="42" cy="42" r={RADIUS} />
        <circle
          className={styles.gaugeFill}
          cx="42"
          cy="42"
          r={RADIUS}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
        />
      </svg>
      <span className={styles.gaugeText}>{percent}%</span>
    </div>
  );
}

type ComponentKey = "species" | "size" | "gender" | "embedding";

const BAR_LABELS: Record<ComponentKey, string> = {
  species: "Especie",
  size: "Tamaño",
  gender: "Género",
  embedding: "Etiquetas",
};

function CompatibilityBars({
  scores,
  visibleKeys,
}: {
  scores: NonNullable<PetMatch["componentScores"]>;
  visibleKeys: ComponentKey[];
}) {
  return (
    <div className={styles.bars}>
      {visibleKeys.map((key, index) => {
        const value = Math.max(0, Math.min(1, scores[key] ?? 0));
        const percent = Math.round(value * 100);
        return (
          <div key={key} className={styles.barRow}>
            <span className={styles.barLabel}>{BAR_LABELS[key]}</span>
            <div
              className={styles.barTrack}
              role="progressbar"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={BAR_LABELS[key]}
            >
              <span
                className={styles.barFill}
                style={
                  {
                    width: `${percent}%`,
                    "--bar-i": index,
                  } as React.CSSProperties
                }
              />
            </div>
            <span className={styles.barValue}>{percent}%</span>
          </div>
        );
      })}
    </div>
  );
}

export default function HeroMatchCard({
  match,
  requestedFields,
}: {
  match: PetMatch;
  requestedFields: RequestedFields;
}) {
  const { animal, score, matchedAttributes, componentScores } = match;

  const subline = [
    capitalize(animal.species),
    capitalize(animal.size),
    capitalize(animal.gender),
  ]
    .filter(Boolean)
    .join(" · ");

  // Only show bars that carry information: the components the user
  // explicitly mentioned, plus the embedding bar when the animal has
  // tags (i.e. the embedding score isn't its silent-baseline of 0.5).
  const visibleKeys: ComponentKey[] = componentScores
    ? ([
        requestedFields.species ? ("species" as const) : null,
        requestedFields.size ? ("size" as const) : null,
        requestedFields.gender ? ("gender" as const) : null,
        Array.isArray(animal.tags) && animal.tags.length > 0
          ? ("embedding" as const)
          : null,
      ].filter(Boolean) as ComponentKey[])
    : [];

  return (
    <article className={styles.card} aria-label={`Mejor match: ${animal.name}`}>
      <div className={styles.imageWrapper}>
        <Image
          src={getAnimalImageUrl(
            animal.image_url,
            animal.species,
            animal.aid,
            animal.image_object_key,
          )}
          alt={animal.name}
          fill
          sizes="(max-width: 760px) 100vw, 480px"
          style={{ objectFit: "cover" }}
          priority
        />
      </div>

      <div className={styles.body}>
        <div className={styles.headerRow}>
          <div className={styles.nameBlock}>
            <h3 className={styles.name}>{animal.name}</h3>
            {subline && <span className={styles.subline}>{subline}</span>}
          </div>
          <ScoreGauge score={score} />
        </div>

        {matchedAttributes.length > 0 && (
          <div className={styles.attrs} aria-label="Razones del match">
            {matchedAttributes.map((attr) => (
              <span key={attr} className={styles.attrChip}>
                {attr}
              </span>
            ))}
          </div>
        )}

        {componentScores && visibleKeys.length > 0 && (
          <CompatibilityBars
            scores={componentScores}
            visibleKeys={visibleKeys}
          />
        )}

        <div className={styles.ctas}>
          <Link href={`/adopt/${animal.aid}`} className={styles.primaryCta}>
            Conocer a {animal.name}
          </Link>
          <Link
            href={`/adopt/${animal.aid}#adoptar`}
            className={styles.secondaryCta}
          >
            Iniciar Adopción
          </Link>
        </div>
      </div>
    </article>
  );
}
