"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, RotateCcw, PawPrint, Ruler, Users } from "lucide-react";
import styles from "./adoptPage.module.css";

// Types - matching what comes from Supabase API
interface Animal {
  aid: number;
  name: string;
  description: string;
  species: string;
  size: string;
  gender: string;
  status: string;
  image_url: string;
  created_at: string;
  record_id: number | null;
}

interface AdoptPageProps {
  animals: Animal[];
}

// Helper function to capitalize first letter
function capitalize(text: string) {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// Filter tags
const FILTER_TAGS = [
  { id: "all", label: "Todos" },
  { id: "Perro", label: "Perros" },
  { id: "Gato", label: "Gatos" },
  { id: "Grande", label: "Grandes" },
  { id: "Mediano", label: "Medianos" },
  { id: "Pequeño", label: "Pequeños" },
];

// Flip Card Component
function FlipCard({ animal }: { animal: Animal }) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => setIsFlipped(!isFlipped);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleFlip();
    }
  };

  return (
    <div
      className={styles.cardContainer}
      onClick={handleFlip}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`Ver información de ${animal.name}`}
    >
      <div className={`${styles.card} ${isFlipped ? styles.cardFlipped : ""}`}>
        {/* Front - Photo */}
        <div className={`${styles.cardFace} ${styles.cardFront}`}>
          <div className={styles.imageWrapper}>
            <Image
              src={animal.image_url || "/Animals/dog1.jpeg"}
              alt={animal.name}
              fill
              sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 25vw"
              style={{ objectFit: "cover" }}
            />
            <div className={styles.cardOverlay}>
              <h3 className={styles.cardName}>{animal.name}</h3>
              <p className={styles.cardSpecies}>{capitalize(animal.species)}</p>
            </div>
            <div className={styles.flipHint}>
              <RotateCcw size={12} />
            </div>
          </div>
        </div>

        {/* Back - Details */}
        <div className={`${styles.cardFace} ${styles.cardBack}`}>
          <div className={styles.cardBackContent}>
            <div className={styles.cardBackHeader}>
              <h3 className={styles.cardBackName}>{animal.name}</h3>
              <span className={`${styles.status} ${styles.statusAvailable}`}>
                Disponible
              </span>
            </div>

            <div className={styles.cardDetails}>
              <div className={styles.detailItem}>
                <PawPrint size={14} className={styles.detailIcon} />
                <span>{capitalize(animal.species)}</span>
              </div>
              <div className={styles.detailItem}>
                <Ruler size={14} className={styles.detailIcon} />
                <span>{capitalize(animal.size)}</span>
              </div>
              <div className={styles.detailItem}>
                <Users size={14} className={styles.detailIcon} />
                <span>{capitalize(animal.gender)}</span>
              </div>
            </div>

            <p className={styles.cardDescription}>{animal.description}</p>

            <Link
              href={`/adopt/${animal.aid}`}
              className={styles.learnMore}
              onClick={(e) => e.stopPropagation()}
            >
              Conocer Más
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Component
export default function AdoptPage({ animals }: AdoptPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  // Filter animals - uses species/size from Supabase (lowercase values)
  const filteredAnimals = useMemo(() => {
    return animals.filter((animal) => {
      const matchesSearch = animal.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      
      // Map filter IDs to match lowercase API values
      const filterMap: Record<string, string> = {
        "Perro": "dog",
        "Gato": "cat",
        "Grande": "large",
        "Mediano": "medium",
        "Pequeño": "small",
      };

      const filterValue = filterMap[activeFilter] || activeFilter;
      
      const matchesFilter =
        activeFilter === "all" ||
        animal.species?.toLowerCase() === filterValue ||
        animal.size?.toLowerCase() === filterValue;

      return matchesSearch && matchesFilter;
    });
  }, [animals, searchQuery, activeFilter]);

  return (
    <div className={styles.page}>
      {/* Search Bar */}
      <div className={styles.searchBar}>
        <Search size={20} className={styles.searchIcon} />
        <input
          type="text"
          placeholder="Buscar"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {/* Filter Tags */}
      <div className={styles.tags}>
        {FILTER_TAGS.map((tag) => (
          <button
            key={tag.id}
            className={`${styles.tag} ${activeFilter === tag.id ? styles.tagActive : ""}`}
            onClick={() => setActiveFilter(tag.id)}
          >
            {tag.label}
          </button>
        ))}
      </div>

      {/* Animals Grid */}
      <div className={styles.grid}>
        {filteredAnimals.map((animal) => (
          <FlipCard key={animal.aid} animal={animal} />
        ))}
      </div>

      {/* Empty State */}
      {filteredAnimals.length === 0 && (
        <div className={styles.empty}>
          <p>No se encontraron animales</p>
        </div>
      )}
    </div>
  );
}
