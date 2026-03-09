"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, RotateCcw, PawPrint, Ruler, Users, Tag, ChevronDown } from "lucide-react";

// Pagination config
const ITEMS_PER_PAGE = 12;
import styles from "./adoptPage.module.css";
import { getAnimalImageUrl } from "@/utils/animalImages";

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
  tags: string[];
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

// Extract all unique filter options from animals (tags + species + size + gender + status)
function getAllFilterOptions(animals: Animal[]): string[] {
  const allOptions: string[] = [];
  
  // Add tags
  animals.forEach((animal) => {
    if (animal.tags) {
      allOptions.push(...animal.tags);
    }
  });
  
  // Add species, size, gender, status
  animals.forEach((animal) => {
    if (animal.species) allOptions.push(animal.species);
    if (animal.size) allOptions.push(animal.size);
    if (animal.gender) allOptions.push(animal.gender);
    if (animal.status) allOptions.push(animal.status);
  });
  
  return [...new Set(allOptions)].sort();
}

// Check if animal matches filter
function animalMatchesFilter(animal: Animal, filter: string): boolean {
  // Check tags
  if (animal.tags?.includes(filter)) return true;
  // Check species, size, gender, status (case-insensitive)
  if (animal.species?.toLowerCase() === filter.toLowerCase()) return true;
  if (animal.size?.toLowerCase() === filter.toLowerCase()) return true;
  if (animal.gender?.toLowerCase() === filter.toLowerCase()) return true;
  if (animal.status?.toLowerCase() === filter.toLowerCase()) return true;
  return false;
}

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
              src={getAnimalImageUrl(animal.image_url, animal.species, animal.aid)}
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

            {animal.tags && animal.tags.length > 0 && (
              <div className={styles.cardTags}>
                <Tag size={12} className={styles.tagIcon} />
                {animal.tags.map((tag, index) => (
                  <span key={index} className={styles.cardTag}>
                    {tag}
                  </span>
                ))}
              </div>
            )}

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
  const [activeTagFilter, setActiveTagFilter] = useState("all");
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  // Get all unique filter options from animals
  const availableTags = useMemo(() => getAllFilterOptions(animals), [animals]);

  // Filter animals by search query and selected tag
  const filteredAnimals = useMemo(() => {
    return animals.filter((animal) => {
      const query = searchQuery.toLowerCase();
      
      // Search by name OR tags
      const matchesName = animal.name.toLowerCase().includes(query);
      const matchesTags = animal.tags?.some((tag) =>
        tag.toLowerCase().includes(query)
      ) ?? false;
      const matchesSearch = !searchQuery || matchesName || matchesTags;
      
      // Filter by selected tag (now includes species, size, gender, status)
      const matchesTagFilter =
        activeTagFilter === "all" ||
        animalMatchesFilter(animal, activeTagFilter);

      return matchesSearch && matchesTagFilter;
    });
  }, [animals, searchQuery, activeTagFilter]);

  // Paginated animals
  const paginatedAnimals = useMemo(() => {
    return filteredAnimals.slice(0, visibleCount);
  }, [filteredAnimals, visibleCount]);

  const hasMore = visibleCount < filteredAnimals.length;

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + ITEMS_PER_PAGE);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setVisibleCount(ITEMS_PER_PAGE);
  };

  const handleTagFilterChange = (tag: string) => {
    setActiveTagFilter(tag);
    setVisibleCount(ITEMS_PER_PAGE);
  };

  return (
    <div className={styles.page}>
      {/* Search Bar */}
      <div className={styles.searchBar}>
        <Search size={20} className={styles.searchIcon} />
        <input
          type="text"
          placeholder="Buscar por nombre o etiquetas..."
          value={searchQuery}
          onChange={handleSearchChange}
          className={styles.searchInput}
        />
      </div>

      {/* Filter Tags */}
      <div className={styles.tags}>
        <button
          className={`${styles.tag} ${activeTagFilter === "all" ? styles.tagActive : ""}`}
          onClick={() => handleTagFilterChange("all")}
        >
          Todos
        </button>
        {availableTags.map((tag) => (
          <button
            key={tag}
            className={`${styles.tag} ${activeTagFilter === tag ? styles.tagActive : ""}`}
            onClick={() => handleTagFilterChange(tag)}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Results count */}
      <p className={styles.resultsCount}>
        Mostrando {paginatedAnimals.length} de {filteredAnimals.length} animales
      </p>

      {/* Animals Grid */}
      <div className={styles.grid}>
        {paginatedAnimals.map((animal) => (
          <FlipCard key={animal.aid} animal={animal} />
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className={styles.loadMoreWrapper}>
          <button className={styles.loadMoreBtn} onClick={handleLoadMore}>
            <span>Cargar Más</span>
            <ChevronDown size={18} />
          </button>
        </div>
      )}

      {/* Empty State */}
      {filteredAnimals.length === 0 && (
        <div className={styles.empty}>
          <p>No se encontraron animales</p>
        </div>
      )}
    </div>
  );
}
