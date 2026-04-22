import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Animal } from "@/types/animal";
import { getAnimalImageUrl } from "@/utils/animalImages";
import { getAuthenticatedHeaders } from "@/lib/apiAuth";
import styles from "./adminAnimalsList.module.css";
import { ChevronDown, Search } from "lucide-react";

const ITEMS_PER_PAGE = 10;

interface AdminAnimalsListProps {
  initialAnimals: Animal[];
}

interface DeleteConfirmModalProps {
  isOpen: boolean;
  animalName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}

// Confirmation Modal Component
function DeleteConfirmModal({
  isOpen,
  animalName,
  onConfirm,
  onCancel,
  isDeleting,
}: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2 className={styles.modalTitle}>Confirmar Eliminación</h2>
        <p className={styles.modalMessage}>
          ¿Estás seguro de que deseas eliminar a <strong>{animalName}</strong>?
          Esta acción no se puede deshacer.
        </p>
        <div className={styles.modalActions}>
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className={styles.modalCancelButton}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className={styles.modalConfirmButton}
          >
            {isDeleting ? "Eliminando..." : "Eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper function to capitalize first letter
function capitalize(text: string) {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export default function AdminAnimalsList({
  initialAnimals,
}: AdminAnimalsListProps) {
  const [animals, setAnimals] = useState(initialAnimals);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Animal;
    direction: "asc" | "desc";
  }>({ key: "aid", direction: "asc" });
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [animalToDelete, setAnimalToDelete] = useState<Animal | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  // Filter animals by search query
  const filteredAnimals = useMemo(() => {
    return animals.filter((animal) => {
      const query = searchQuery.toLowerCase();

      // Search by name, species, size, gender, or status
      const matchesName = animal.name.toLowerCase().includes(query);
      const matchesSpecies =
        animal.species?.toLowerCase().includes(query) ?? false;
      const matchesSize = animal.size?.toLowerCase().includes(query) ?? false;
      const matchesGender =
        animal.gender?.toLowerCase().includes(query) ?? false;
      const matchesStatus =
        animal.status?.toLowerCase().includes(query) ?? false;

      return (
        !searchQuery ||
        matchesName ||
        matchesSpecies ||
        matchesSize ||
        matchesGender ||
        matchesStatus
      );
    });
  }, [animals, searchQuery]);

  // Sort animals
  const sortedAnimals = useMemo(() => {
    const sorted = [...filteredAnimals];
    sorted.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      // Handle different types
      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortConfig.direction === "asc"
          ? aValue - bValue
          : bValue - aValue;
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        const comparison = aValue.localeCompare(bValue);
        return sortConfig.direction === "asc" ? comparison : -comparison;
      }

      return 0;
    });
    return sorted;
  }, [filteredAnimals, sortConfig]);

  // Paginate animals
  const totalPages = Math.ceil(sortedAnimals.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;

  const paginatedAnimals = useMemo(() => {
    return sortedAnimals.slice(startIndex, endIndex);
  }, [sortedAnimals, startIndex, endIndex]);

  const handleSort = (key: keyof Animal) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleDeleteClick = (animal: Animal) => {
    setAnimalToDelete(animal);
    setDeleteModalOpen(true);
    setError("");
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setAnimalToDelete(null);
    setError("");
  };

  const handleDeleteConfirm = async () => {
    if (!animalToDelete) return;

    setIsDeleting(true);
    setError("");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/animals/${animalToDelete.aid}`,
        {
          method: "DELETE",
          headers: await getAuthenticatedHeaders(),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al eliminar el animal.");
      }

      // Remove animal from list
      setAnimals((prev) => prev.filter((a) => a.aid !== animalToDelete.aid));
      setDeleteModalOpen(false);
      setAnimalToDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado.");
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case "disponible":
        return {
          backgroundColor: "var(--status-available-bg)",
          color: "var(--status-available-text)",
        };
      case "adoptado":
        return {
          backgroundColor: "var(--status-adopted-bg)",
          color: "var(--status-adopted-text)",
        };
      case "pendiente":
        return {
          backgroundColor: "var(--status-pending-bg)",
          color: "var(--status-pending-text)",
        };
      case "en hogar temporal":
        return {
          backgroundColor: "var(--status-fostered-bg)",
          color: "var(--status-fostered-text)",
        };
      case "atención médica":
        return {
          backgroundColor: "var(--status-medical-bg)",
          color: "var(--status-medical-text)",
        };
      default:
        return {
          backgroundColor: "var(--color-border)",
          color: "var(--color-text)",
        };
    }
  };

  if (animals.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Gestión de Animales</h1>
        </div>
        <div className={styles.emptyState}>
          <p>No se encontraron animales.</p>
        </div>
      </div>
    );
  }

  return (
    <main>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1>Gestión de Animales</h1>
            <p className={styles.subtitle}>
              Total de animales: <strong>{animals.length}</strong>
              {searchQuery && ` • Filtrados: ${sortedAnimals.length}`}
            </p>
          </div>
          <div className={styles.actions}>
            <Link href="/admin/createAnimal" className={styles.createButton}>
              + Crear Nuevo Animal
            </Link>
          </div>
        </div>

        {/* Search Bar */}
        <div className={styles.filterSection}>
          <div className={styles.searchBarWrapper}>
            <Search size={20} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Buscar por nombre, especie, tamaño, género o estado..."
              value={searchQuery}
              onChange={handleSearchChange}
              className={styles.searchInput}
            />
          </div>
        </div>

        {paginatedAnimals.length === 0 ? (
          <div className={styles.emptyState}>
            <p>
              {sortedAnimals.length === 0
                ? "No se encontraron animales."
                : "No hay resultados para esta página."}
            </p>
          </div>
        ) : (
          <>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th onClick={() => handleSort("name")}>
                      <div className={styles.headerCell}>
                        Nombre
                        {sortConfig.key === "name" && (
                          <ChevronDown
                            size={16}
                            style={{
                              transform:
                                sortConfig.direction === "asc"
                                  ? "rotate(180deg)"
                                  : "rotate(0deg)",
                            }}
                          />
                        )}
                      </div>
                    </th>
                    <th onClick={() => handleSort("species")}>
                      <div className={styles.headerCell}>
                        Especie
                        {sortConfig.key === "species" && (
                          <ChevronDown
                            size={16}
                            style={{
                              transform:
                                sortConfig.direction === "asc"
                                  ? "rotate(180deg)"
                                  : "rotate(0deg)",
                            }}
                          />
                        )}
                      </div>
                    </th>
                    <th onClick={() => handleSort("gender")}>
                      <div className={styles.headerCell}>
                        Género
                        {sortConfig.key === "gender" && (
                          <ChevronDown
                            size={16}
                            style={{
                              transform:
                                sortConfig.direction === "asc"
                                  ? "rotate(180deg)"
                                  : "rotate(0deg)",
                            }}
                          />
                        )}
                      </div>
                    </th>
                    <th onClick={() => handleSort("size")}>
                      <div className={styles.headerCell}>
                        Tamaño
                        {sortConfig.key === "size" && (
                          <ChevronDown
                            size={16}
                            style={{
                              transform:
                                sortConfig.direction === "asc"
                                  ? "rotate(180deg)"
                                  : "rotate(0deg)",
                            }}
                          />
                        )}
                      </div>
                    </th>
                    <th onClick={() => handleSort("status")}>
                      <div className={styles.headerCell}>
                        Estado
                        {sortConfig.key === "status" && (
                          <ChevronDown
                            size={16}
                            style={{
                              transform:
                                sortConfig.direction === "asc"
                                  ? "rotate(180deg)"
                                  : "rotate(0deg)",
                            }}
                          />
                        )}
                      </div>
                    </th>
                    <th>Imagen</th>
                    <th className={styles.actionsHeader}></th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedAnimals.map((animal) => (
                    <tr key={animal.aid}>
                      <td className={styles.nameCell}>{animal.name}</td>
                      <td>{capitalize(animal.species)}</td>
                      <td>{capitalize(animal.gender)}</td>
                      <td>{capitalize(animal.size)}</td>
                      <td>
                        <span
                          className={styles.statusBadge}
                          style={getStatusStyle(animal.status)}
                        >
                          {capitalize(animal.status)}
                        </span>
                      </td>
                      <td>
                        <Image
                          src={getAnimalImageUrl(
                            animal.image_url,
                            animal.species,
                            animal.aid,
                            animal.image_object_key,
                          )}
                          alt={animal.name}
                          className={styles.thumbnail}
                          width={60}
                          height={60}
                          sizes="60px"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      </td>
                      <td>
                        <div className={styles.actionButtons}>
                          <Link
                            href={`/admin/editAnimal?id=${animal.aid}`}
                            className={styles.editButton}
                            title="Editar animal"
                          >
                            Editar
                          </Link>
                          <button
                            onClick={() => handleDeleteClick(animal)}
                            className={styles.deleteButton}
                            title="Eliminar animal"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={styles.pagination}>
              <button
                className={styles.paginationButton}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                title="Página anterior"
              >
                ← Anterior
              </button>

              <div className={styles.pageInfo}>
                <span>
                  Página <strong>{currentPage}</strong> de{" "}
                  <strong>{totalPages}</strong>
                </span>
              </div>

              <button
                className={styles.paginationButton}
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                title="Página siguiente"
              >
                Siguiente →
              </button>
            </div>
          </>
        )}

        {error && (
          <div className={styles.errorState} role="alert">
            <p>{error}</p>
          </div>
        )}

        <DeleteConfirmModal
          isOpen={deleteModalOpen}
          animalName={animalToDelete?.name || ""}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
          isDeleting={isDeleting}
        />
      </div>
    </main>
  );
}
