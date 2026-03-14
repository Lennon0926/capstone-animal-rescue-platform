import { useEffect, useState } from "react";
import { fetchAnimals } from "@/services/animalImageUploadService";
import type { Animal } from "@/types/animal";
import styles from "./adminAnimalsList.module.css";
import { ChevronDown } from "lucide-react";

export default function AdminAnimalsList() {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Animal;
    direction: "asc" | "desc";
  }>({ key: "name", direction: "asc" });
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const loadAnimals = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchAnimals();
        setAnimals(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch animals"
        );
      } finally {
        setLoading(false);
      }
    };

    loadAnimals();
  }, []);

  const filteredAnimals = animals.filter(
    (animal) =>
      animal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      animal.species.toLowerCase().includes(searchTerm.toLowerCase()) ||
      animal.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedAnimals = [...filteredAnimals].sort((a, b) => {
    if (a.aid !== b.aid) {
      return a.aid - b.aid;
    }

    return a.name.localeCompare(b.name);
  });

  const handleSort = (key: keyof Animal) => {
    setSortConfig((prev) => ({
      key,
      direction:
        prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
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

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Admin Animal Management</h1>
        </div>
        <div className={styles.loadingState}>
          <p>Loading animals...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Admin Animal Management</h1>
        </div>
        <div className={styles.errorState}>
          <p>Error: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className={styles.retryButton}
          >
            Retry
          </button>
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
            Total animals: <strong>{animals.length}</strong>
          </p>
        </div>
        <div className={styles.actions}>
          <button className={styles.createButton}>+ Create New Animal</button>
        </div>
      </div>

      <div className={styles.filterSection}>
        <input
          type="text"
          placeholder="Search by name, species, or status..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {sortedAnimals.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No animals found.</p>
        </div>
      ) : (
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
              {sortedAnimals.map((animal) => (
                <tr key={animal.aid}>
                  <td>{animal.aid}</td>
                  <td className={styles.nameCell}>{animal.name}</td>
                  <td>{animal.species}</td>
                  <td>{animal.gender}</td>
                  <td>{animal.size}</td>
                  <td>
                    <span
                      className={styles.statusBadge}
                      style={getStatusStyle(animal.status)}
                    >
                      {animal.status}
                    </span>
                  </td>
                  <td>
                    {animal.image_url ? (
                      <img
                        src={animal.image_url}
                        alt={animal.name}
                        className={styles.thumbnail}
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <span className={styles.noImage}>No image</span>
                    )}
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
      )}
    </div>
  );
}
