"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, RotateCcw, PawPrint, Ruler, Users, Tag, ChevronDown } from "lucide-react";

// Pagination config
const ITEMS_PER_PAGE = 12;
import styles from "./adoptPage.module.css";
import { getAnimalImageUrl } from "@/utils/animalImages";
import type { Animal } from "@/types/animal";

interface AdoptPageProps {
  animals: Animal[];
}

// Helper function to capitalize first letter
function capitalize(text: string) {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function formatStatus(status: string) {
  const map: Record<string, string> = {
    disponible: "Disponible",
    adoptado: "Adoptado",
    pendiente: "Pendiente",
    'atención médica': "Atención Médica",
    'en hogar temporal': "En Hogar Temporal",
  };

  return map[status?.toLowerCase()] || status;
}

function getStatusClass(status: string) {
  switch (status.toLowerCase()) {
    case "disponible":
    case "available":
      return styles.statusAvailable;
    case "adoptado":
    case "adopted":
      return styles.statusAdopted;
    case "pendiente":
    case "pending":
      return styles.statusPending;
    case "en hogar temporal":
    case "fostered":
      return styles.statusFostered;
    case "atención médica":
    case "medical_hold":
      return styles.statusMedical_hold;
    default:
      return styles.statusAvailable;
  }
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
              src={getAnimalImageUrl(
                animal.image_url,
                animal.species,
                animal.aid,
                animal.image_object_key,
              )}
              alt={animal.name}
              fill
              sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 25vw"
              style={{ objectFit: "cover" }}
            />
            <div className={styles.cardOverlay}>
              <h3 className={styles.cardName}>{animal.name}</h3>
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
              <span className={`${styles.status} ${getStatusClass(animal.status)}`}>
                {formatStatus(animal.status)}
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
  const [activeTagFilters, setActiveTagFilters] = useState<string[]>([]);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  // Get all unique filter options from animals
  const availableTags = useMemo(() => getAllFilterOptions(animals), [animals]);

  // Filter animals by search query and selected tags (multi-select)
  const filteredAnimals = useMemo(() => {
    return animals.filter((animal) => {
      const query = searchQuery.toLowerCase();
      
      // Search by name, species, size, gender, status, or tags
      const matchesName = animal.name.toLowerCase().includes(query);
      const matchesSpecies = animal.species?.toLowerCase().includes(query) ?? false;
      const matchesSize = animal.size?.toLowerCase().includes(query) ?? false;
      const matchesGender = animal.gender?.toLowerCase().includes(query) ?? false;
      const matchesStatus = animal.status?.toLowerCase().includes(query) ?? false;
      const matchesTags = animal.tags?.some((tag) =>
        tag.toLowerCase().includes(query)
      ) ?? false;
      const matchesSearch = !searchQuery || matchesName || matchesSpecies || matchesSize || matchesGender || matchesStatus || matchesTags;
      
      // Filter by selected tags - animal must match ALL selected filters (AND logic)
      const matchesTagFilter =
        activeTagFilters.length === 0 ||
        activeTagFilters.every((filter) => animalMatchesFilter(animal, filter));

      return matchesSearch && matchesTagFilter;
    });
  }, [animals, searchQuery, activeTagFilters]);

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

  const handleTagFilterToggle = (tag: string) => {
    setActiveTagFilters((prev) => {
      if (prev.includes(tag)) {
        // Remove tag if already selected
        return prev.filter((t) => t !== tag);
      } else {
        // Add tag to selection
        return [...prev, tag];
      }
    });
    setVisibleCount(ITEMS_PER_PAGE);
  };

  return (
    <div className={styles.page}>
      {/* Search Bar */}
      <div className={styles.searchBar}>
        <Search size={20} className={styles.searchIcon} />
        <input
          type="text"
          placeholder="Buscar animales..."
          value={searchQuery}
          onChange={handleSearchChange}
          className={styles.searchInput}
        />
      </div>

      {/* Filter Tags - Multi-select */}
      <div className={styles.tagsContainer}>
        <div className={styles.tags}>
          {availableTags.map((tag) => (
            <button
              key={tag}
              className={`${styles.tag} ${activeTagFilters.includes(tag) ? styles.tagActive : ""}`}
              onClick={() => handleTagFilterToggle(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

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
