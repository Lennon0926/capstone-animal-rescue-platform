"use client";

import Image from "next/image";
import Link from "next/link";
import { getAnimalImageUrl } from "@/utils/animalImages";
import type { Animal } from "@/types/animal";
import styles from "./matchResultCard.module.css";

function capitalize(text: string) {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export interface PetMatch {
  animal: Animal;
  score: number;
  matchedAttributes: string[];
  componentScores?: {
    species: number;
    size: number;
    gender: number;
    embedding: number;
  };
}

export default function MatchResultCard({ match }: { match: PetMatch }) {
  const { animal, score, matchedAttributes } = match;
  const scorePercent = Math.round(Math.max(0, Math.min(1, score)) * 100);

  const subline = [capitalize(animal.size), capitalize(animal.gender)]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className={styles.card}>
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
          sizes="(max-width: 600px) 50vw, 280px"
          style={{ objectFit: "cover" }}
        />
        <span
          className={styles.scoreBadge}
          aria-label={`Compatibilidad ${scorePercent}%`}
        >
          {scorePercent}%
        </span>
      </div>

      <div className={styles.body}>
        <div className={styles.nameRow}>
          <h3 className={styles.name}>{animal.name}</h3>
          {subline && <span className={styles.subline}>{subline}</span>}
        </div>

        {matchedAttributes.length > 0 && (
          <div className={styles.chips} aria-label="Razones del match">
            {matchedAttributes.slice(0, 3).map((attr) => (
              <span key={attr} className={styles.chip}>
                {attr}
              </span>
            ))}
          </div>
        )}

        <Link href={`/adopt/${animal.aid}`} className={styles.cta}>
          Ver perfil
        </Link>
      </div>
    </article>
  );
}
