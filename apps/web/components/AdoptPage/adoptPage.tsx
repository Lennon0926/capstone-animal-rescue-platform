"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, RotateCcw, PawPrint, Calendar, Ruler, Users } from "lucide-react";
import styles from "./adoptPage.module.css";

// Types
interface Animal {
  id: number;
  name: string;
  species: string;
  breed: string;
  age: string;
  gender: string;
  size: string;
  status: string;
  description: string;
  image: string;
}

// Mock data
const mockAnimals: Animal[] = [
  {
    id: 1,
    name: "Max",
    species: "Perro",
    breed: "Pastor Alemán",
    age: "3 años",
    gender: "Macho",
    size: "Grande",
    status: "available",
    description: "Max es un perro leal y protector. Adora los paseos largos y jugar en el parque.",
    image: "/Animals/dog1.jpeg",
  },
  {
    id: 2,
    name: "Luna",
    species: "Gato",
    breed: "Siamés",
    age: "2 años",
    gender: "Hembra",
    size: "Pequeño",
    status: "available",
    description: "Luna es una gata cariñosa y tranquila. Le encanta dormir al sol.",
    image: "/Animals/cat1.jpeg",
  },
  {
    id: 3,
    name: "Rocky",
    species: "Perro",
    breed: "Bulldog",
    age: "5 años",
    gender: "Macho",
    size: "Mediano",
    status: "available",
    description: "Rocky es juguetón y le encanta la compañía de niños.",
    image: "/Animals/dog2.jpeg",
  },
  {
    id: 4,
    name: "Mia",
    species: "Gato",
    breed: "Persa",
    age: "1 año",
    gender: "Hembra",
    size: "Pequeño",
    status: "available",
    description: "Mia es elegante y le gusta que la cepillen.",
    image: "/Animals/cat2.jpeg",
  },
  {
    id: 5,
    name: "Buddy",
    species: "Perro",
    breed: "Golden Retriever",
    age: "4 años",
    gender: "Macho",
    size: "Grande",
    status: "available",
    description: "Buddy es el compañero perfecto para familias activas.",
    image: "/Animals/dog1.jpeg",
  },
  {
    id: 6,
    name: "Cleo",
    species: "Gato",
    breed: "Maine Coon",
    age: "3 años",
    gender: "Hembra",
    size: "Grande",
    status: "available",
    description: "Cleo es independiente pero muy cariñosa cuando quiere.",
    image: "/Animals/cat1.jpeg",
  },
  {
    id: 7,
    name: "Thor",
    species: "Perro",
    breed: "Husky",
    age: "2 años",
    gender: "Macho",
    size: "Grande",
    status: "available",
    description: "Thor necesita mucho ejercicio y le encanta correr.",
    image: "/Animals/dog2.jpeg",
  },
  {
    id: 8,
    name: "Nala",
    species: "Gato",
    breed: "Bengalí",
    age: "1 año",
    gender: "Hembra",
    size: "Mediano",
    status: "available",
    description: "Nala es muy activa y curiosa, siempre explorando.",
    image: "/Animals/cat2.jpeg",
  },
];

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
              src={animal.image}
              alt={animal.name}
              fill
              sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 25vw"
              style={{ objectFit: "cover" }}
            />
            <div className={styles.cardOverlay}>
              <h3 className={styles.cardName}>{animal.name}</h3>
              <p className={styles.cardSpecies}>{animal.species} · {animal.breed}</p>
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
                <span>{animal.breed}</span>
              </div>
              <div className={styles.detailItem}>
                <Calendar size={14} className={styles.detailIcon} />
                <span>{animal.age}</span>
              </div>
              <div className={styles.detailItem}>
                <Ruler size={14} className={styles.detailIcon} />
                <span>{animal.size}</span>
              </div>
              <div className={styles.detailItem}>
                <Users size={14} className={styles.detailIcon} />
                <span>{animal.gender}</span>
              </div>
            </div>

            <p className={styles.cardDescription}>{animal.description}</p>

            <Link
              href={`/animals/${animal.id}`}
              className={styles.learnMore}
              onClick={(e) => e.stopPropagation()}
            >
              Conoce Más
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Component
export default function AdoptPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  // Filter animals
  const filteredAnimals = useMemo(() => {
    return mockAnimals.filter((animal) => {
      const matchesSearch = animal.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      
      const matchesFilter =
        activeFilter === "all" ||
        animal.species === activeFilter ||
        animal.size === activeFilter;

      return matchesSearch && matchesFilter;
    });
  }, [searchQuery, activeFilter]);

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
          <FlipCard key={animal.id} animal={animal} />
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
