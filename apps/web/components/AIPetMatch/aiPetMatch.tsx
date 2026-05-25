"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, Loader2, SearchX } from "lucide-react";
import styles from "./aiPetMatch.module.css";
import MatchResultCard, { type PetMatch } from "./matchResultCard";
import HeroMatchCard from "./heroMatchCard";

interface AIPetMatchProps {
  onSkip: () => void;
}

export interface RequestedFields {
  species: boolean;
  size: boolean;
  gender: boolean;
}

interface AiMatchResponse {
  success: boolean;
  data: PetMatch[];
  alternatives?: PetMatch[];
  threshold: number;
  requestedFields?: RequestedFields;
  promptEcho: string;
  error?: { message?: string };
}

const MIN_LENGTH = 3;
const MAX_LENGTH = 500;

// Loading messages cycle every ~1.6s during the wait. Random selection keeps
// repeated submissions feeling fresh; we avoid showing the same message twice
// in a row so the UI feels active.
const LOADING_MESSAGES = [
  "Buscando a tu mejor amigo…",
  "Encontrando a tu compañero perfecto…",
  "Analizando perfiles peludos…",
  "Olfateando coincidencias…",
  "Comparando personalidades…",
  "Revisando candidatos peludos…",
  "Encontrando esa conexión especial…",
  "Calculando vibras de adopción…",
  "Casi listo, esto es importante…",
];

const LOADING_MESSAGE_INTERVAL_MS = 1600;
// Pad fast responses with a short random wait so the loading state feels
// considered rather than abrupt. Real (slower) responses pass through.
const MIN_LOADING_MS = 1500;
const MAX_LOADING_MS = 3500;

function pickRandomLoadingMessage(currentIndex: number): number {
  if (LOADING_MESSAGES.length <= 1) return 0;
  let next = currentIndex;
  while (next === currentIndex) {
    next = Math.floor(Math.random() * LOADING_MESSAGES.length);
  }
  return next;
}

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export default function AIPetMatch({ onSkip }: AIPetMatchProps) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matches, setMatches] = useState<PetMatch[] | null>(null);
  const [alternatives, setAlternatives] = useState<PetMatch[]>([]);
  const [requestedFields, setRequestedFields] = useState<RequestedFields>({
    species: false,
    size: false,
    gender: false,
  });
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const resultsAnchorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (matches !== null && resultsAnchorRef.current) {
      resultsAnchorRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [matches]);

  // Cycle the loading message while a request is in flight.
  useEffect(() => {
    if (!loading) return;
    const id = window.setInterval(() => {
      setLoadingMessageIndex((prev) => pickRandomLoadingMessage(prev));
    }, LOADING_MESSAGE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = prompt.trim();

    if (trimmed.length < MIN_LENGTH) {
      setError(`Cuéntanos un poco más (mínimo ${MIN_LENGTH} caracteres).`);
      return;
    }

    setLoading(true);
    setError(null);
    setMatches(null);
    setAlternatives([]);
    setLoadingMessageIndex(Math.floor(Math.random() * LOADING_MESSAGES.length));

    const minWait = delay(
      Math.floor(
        MIN_LOADING_MS + Math.random() * (MAX_LOADING_MS - MIN_LOADING_MS),
      ),
    );

    try {
      const fetchPromise = fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/animals/ai-match`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: trimmed, limit: 5 }),
        },
      );

      const [res] = await Promise.all([fetchPromise, minWait]);
      const json: AiMatchResponse = await res.json();

      if (!res.ok || !json.success) {
        const msg =
          json?.error?.message || "No pudimos procesar tu solicitud.";
        setError(msg);
        return;
      }

      setMatches(json.data || []);
      setAlternatives(json.alternatives || []);
      setRequestedFields(
        json.requestedFields || { species: false, size: false, gender: false },
      );
    } catch (err) {
      console.error("[AIPetMatch] request failed:", err);
      // Honour the minimum wait even on error so the spinner doesn't flash.
      await minWait;
      setError(
        "No pudimos conectarnos al servicio de match. Intenta de nuevo.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAdjust = () => {
    setMatches(null);
    setAlternatives([]);
    setError(null);
    setPrompt("");
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  const showEmptyState = matches !== null && matches.length === 0;
  const showResults = matches !== null && matches.length > 0;
  const showHero = !showResults && !showEmptyState;

  return (
    <div className={styles.page}>
      <div ref={resultsAnchorRef} aria-hidden="true" />
      {showHero && (
      <section
        className={`${styles.hero} ${styles.fadeInUp}`}
        aria-labelledby="ai-match-title"
      >
        <span className={styles.eyebrow}>
          <Sparkles size={12} aria-hidden="true" />
          AI Pet Match
        </span>
        <h1 id="ai-match-title" className={styles.title}>
          Encuentra a tu compañero ideal
        </h1>
        <p className={styles.subtitle}>
          Cuéntanos en tus propias palabras cómo es el animal que buscas y te
          mostraremos los mejores candidatos. ¿Prefieres explorar todo? Puedes
          ver el listado completo cuando quieras.
        </p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label htmlFor="ai-match-prompt" className="sr-only">
            Describe el animal que buscas
          </label>
          <textarea
            id="ai-match-prompt"
            ref={textareaRef}
            className={styles.textarea}
            placeholder="Ej: Quiero un perro mediano y tranquilo que sea bueno con niños."
            maxLength={MAX_LENGTH}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={loading}
            autoFocus
          />

          <div className={styles.actionsRow}>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading || prompt.trim().length < MIN_LENGTH}
            >
              {loading ? (
                <>
                  <Loader2
                    size={16}
                    className="animate-spin"
                    aria-hidden="true"
                  />
                  Buscando matches...
                </>
              ) : (
                <>
                  <Sparkles size={16} aria-hidden="true" />
                  Encontrar mi mejor match
                </>
              )}
            </button>

            <button
              type="button"
              className={styles.skipLink}
              onClick={onSkip}
              disabled={loading}
            >
              Ver todos los animales
            </button>
          </div>

          {error && (
            <div className={styles.error} role="alert">
              {error}
            </div>
          )}
        </form>
      </section>
      )}

      {loading && !showResults && !showEmptyState && (
        <div className={styles.loadingPanel} role="status" aria-live="polite">
          <div className={styles.loadingPaws} aria-hidden="true">
            <span className={styles.loadingPaw}>🐾</span>
            <span className={styles.loadingPaw}>🐾</span>
            <span className={styles.loadingPaw}>🐾</span>
          </div>
          <span
            key={loadingMessageIndex}
            className={styles.loadingText}
          >
            {LOADING_MESSAGES[loadingMessageIndex]}
          </span>
        </div>
      )}

      {showResults && (
        <section
          className={`${styles.resultsSection} ${styles.fadeInUp}`}
          aria-labelledby="ai-match-results-title"
        >
          <header className={styles.resultsHeader}>
            <h2
              id="ai-match-results-title"
              className={styles.resultsTitle}
            >
              Tus Mejores Matches
            </h2>
            <p className={styles.resultsSubtitle}>
              Basados en tus preferencias y estilo de vida.
            </p>
          </header>

          <HeroMatchCard
            match={matches![0]}
            requestedFields={requestedFields}
          />

          {matches!.length > 1 && (
            <div className={styles.othersBlock}>
              <h3 className={styles.othersTitle}>
                Otros matches compatibles
              </h3>
              <div className={styles.resultsGrid}>
                {matches!.slice(1).map((match, index) => (
                  <div
                    key={match.animal.aid}
                    className={styles.gridItem}
                    style={
                      { "--stagger-i": index } as React.CSSProperties
                    }
                  >
                    <MatchResultCard match={match} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {alternatives.length > 0 && (
            <div className={styles.othersBlock}>
              <div className={styles.othersHeader}>
                <h3 className={styles.othersTitle}>
                  Otros animales que también podrían gustarte
                </h3>
                <p className={styles.othersSubtitle}>
                  Sugerencias fuera de tu preferencia, por si te animas a
                  conocer más amigos.
                </p>
              </div>
              <div className={styles.resultsGrid}>
                {alternatives.map((match, index) => (
                  <div
                    key={match.animal.aid}
                    className={styles.gridItem}
                    style={
                      {
                        "--stagger-i":
                          (matches!.length - 1 + index) as number,
                      } as React.CSSProperties
                    }
                  >
                    <MatchResultCard match={match} />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={styles.resultsFooter}>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={handleAdjust}
            >
              Ajustar preferencias
            </button>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={onSkip}
            >
              Ver todos los animales
            </button>
          </div>
        </section>
      )}

      {showEmptyState && (
        <div className={styles.emptyStateWrap}>
          <section
            className={`${styles.emptyState} ${styles.fadeInUp}`}
            role="status"
          >
            <SearchX
              size={40}
              className={styles.emptyIcon}
              aria-hidden="true"
            />
            <h2 className={styles.emptyTitle}>
              No encontramos animales que coincidan con tu descripción
            </h2>
            <p className={styles.emptyText}>
              Puedes explorar el listado completo de animales disponibles o
              ajustar tu descripción.
            </p>
            <div className={styles.emptyActions}>
              <button
                type="button"
                className={styles.submitBtn}
                onClick={onSkip}
              >
                Ver todos los animales
              </button>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={handleAdjust}
              >
                Ajustar preferencias
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
