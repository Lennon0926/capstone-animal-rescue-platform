"use client";

import { useState, useMemo } from "react";
import type { Animal } from "@/types/animal";
import { getAnimalImageUrl } from "@/utils/animalImages";
import styles from "./adminAnimalsList.module.css";
import { ChevronDown, Search } from "lucide-react";

const ITEMS_PER_PAGE = 10;

interface AdminAnimalsListProps {
  initialAnimals: Animal[];
}

// Helper function to capitalize first letter
function capitalize(text: string) {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export default function AdminAnimalsList({ initialAnimals }: AdminAnimalsListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Animal;
    direction: "asc" | "desc";
  }>({ key: "aid", direction: "asc" });
  const [currentPage, setCurrentPage] = useState(1);

  // Filter animals by search query
  const filteredAnimals = useMemo(() => {
    return initialAnimals.filter((animal) => {
      const query = searchQuery.toLowerCase();

      // Search by name, species, size, gender, or status
      const matchesName = animal.name.toLowerCase().includes(query);
      const matchesSpecies = animal.species?.toLowerCase().includes(query) ?? false;
      const matchesSize = animal.size?.toLowerCase().includes(query) ?? false;
      const matchesGender = animal.gender?.toLowerCase().includes(query) ?? false;
      const matchesStatus = animal.status?.toLowerCase().includes(query) ?? false;

      return (
        !searchQuery ||
        matchesName ||
        matchesSpecies ||
        matchesSize ||
        matchesGender ||
        matchesStatus
      );
    });
  }, [initialAnimals, searchQuery]);

  // Sort animals
  const sortedAnimals = useMemo(() => {
    const sorted = [...filteredAnimals];
    sorted.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      // Handle different types
      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortConfig.direction === "asc" ? aValue - bValue : bValue - aValue;
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

  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case "available":
        return {
          backgroundColor: "var(--status-available-bg)",
          color: "var(--status-available-text)",
        };
      case "adopted":
        return {
          backgroundColor: "var(--status-adopted-bg)",
          color: "var(--status-adopted-text)",
        };
      case "pending":
        return {
          backgroundColor: "var(--status-pending-bg)",
          color: "var(--status-pending-text)",
        };
      default:
        return {
          backgroundColor: "var(--color-border)",
          color: "var(--color-text)",
        };
    }
  };

  if (initialAnimals.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Admin Animal Management</h1>
        </div>
        <div className={styles.emptyState}>
          <p>No animals found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>Admin Animal Management</h1>
          <p className={styles.subtitle}>
            Total animals: <strong>{initialAnimals.length}</strong>
            {searchQuery && ` • Filtered: ${sortedAnimals.length}`}
          </p>
        </div>
        <div className={styles.actions}>
          <button className={styles.createButton}>+ Create New Animal</button>
        </div>
      </div>

      {/* Search Bar */}
      <div className={styles.filterSection}>
        <div className={styles.searchBarWrapper}>
          <Search size={20} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by name, species, size, gender, or status..."
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
              ? "No animals found."
              : "No results for this page."}
          </p>
        </div>
      ) : (
        <>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th onClick={() => handleSort("aid")}>
                    <div className={styles.headerCell}>
                      ID
                      {sortConfig.key === "aid" && (
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
                  <th onClick={() => handleSort("name")}>
                    <div className={styles.headerCell}>
                      Name
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
                      Species
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
                      Gender
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
                      Size
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
                      Status
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
                  <th>Image</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedAnimals.map((animal) => (
                  <tr key={animal.aid}>
                    <td>{animal.aid}</td>
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
                      <img
                        src={getAnimalImageUrl(animal.image_url, animal.species, animal.aid)}
                        alt={animal.name}
                        className={styles.thumbnail}
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    </td>
                    <td>
                      <div className={styles.actionButtons}>
                        <button
                          className={styles.editButton}
                          title="Edit animal"
                        >
                          Edit
                        </button>
                        <button
                          className={styles.deleteButton}
                          title="Delete animal"
                        >
                          Delete
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
              title="Previous page"
            >
              ← Previous
            </button>

            <div className={styles.pageInfo}>
              <span>
                Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
              </span>
            </div>

            <button
              className={styles.paginationButton}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              title="Next page"
            >
              Next →
            </button>
          </div>
        </>
      )}
    </div>
  );
}
