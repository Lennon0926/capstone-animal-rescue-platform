import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Post } from "@/types/post";
import { deletePost as deletePostService } from "@/services/postService";
import styles from "../AdminAnimalsList/adminAnimalsList.module.css";
import { ChevronDown, Search, Pin } from "lucide-react";

const ITEMS_PER_PAGE = 10;

interface AdminPostsListProps {
  initialPosts: Post[];
}

interface DeleteConfirmModalProps {
  isOpen: boolean;
  postHeader: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}

function DeleteConfirmModal({ isOpen, postHeader, onConfirm, onCancel, isDeleting }: DeleteConfirmModalProps) {
  if (!isOpen) return null;
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2 className={styles.modalTitle}>Confirmar Eliminación</h2>
        <p className={styles.modalMessage}>
          ¿Estás seguro de que deseas eliminar la publicación <strong>{postHeader}</strong>?
          Esta acción no se puede deshacer.
        </p>
        <div className={styles.modalActions}>
          <button onClick={onCancel} disabled={isDeleting} className={styles.modalCancelButton}>
            Cancelar
          </button>
          <button onClick={onConfirm} disabled={isDeleting} className={styles.modalConfirmButton}>
            {isDeleting ? "Eliminando..." : "Eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminPostsList({ initialPosts }: AdminPostsListProps) {
  const [posts, setPosts] = useState(initialPosts);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: keyof Post; direction: "asc" | "desc" }>({
    key: "created_at",
    direction: "desc",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const query = searchQuery.toLowerCase();
      return (
        !searchQuery ||
        post.header.toLowerCase().includes(query) ||
        post.body.toLowerCase().includes(query)
      );
    });
  }, [posts, searchQuery]);

  const sortedPosts = useMemo(() => {
    const sorted = [...filteredPosts];
    sorted.sort((a, b) => {
      if (sortConfig.key === "is_pinned") {
        const aV = a.is_pinned ? 1 : 0;
        const bV = b.is_pinned ? 1 : 0;
        return sortConfig.direction === "asc" ? aV - bV : bV - aV;
      }
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      if (typeof aValue === "string" && typeof bValue === "string") {
        const cmp = aValue.localeCompare(bValue);
        return sortConfig.direction === "asc" ? cmp : -cmp;
      }
      return 0;
    });
    return sorted;
  }, [filteredPosts, sortConfig]);

  const totalPages = Math.ceil(sortedPosts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedPosts = useMemo(
    () => sortedPosts.slice(startIndex, startIndex + ITEMS_PER_PAGE),
    [sortedPosts, startIndex]
  );

  const handleSort = (key: keyof Post) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleDeleteClick = (post: Post) => {
    setPostToDelete(post);
    setDeleteModalOpen(true);
    setError("");
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setPostToDelete(null);
    setError("");
  };

  const handleDeleteConfirm = async () => {
    if (!postToDelete) return;
    setIsDeleting(true);
    setError("");
    try {
      await deletePostService(postToDelete.pid);
      setPosts((prev) => prev.filter((p) => p.pid !== postToDelete.pid));
      setDeleteModalOpen(false);
      setPostToDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (posts.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Gestión de Publicaciones</h1>
        </div>
        <div className={styles.emptyState}>
          <p>No se encontraron publicaciones.</p>
          <Link href="/admin/createPost" className={styles.createButton}>
            + Crear Primera Publicación
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1>Gestión de Publicaciones</h1>
            <p className={styles.subtitle}>
              Total: <strong>{posts.length}</strong>
              {searchQuery && ` • Filtradas: ${sortedPosts.length}`}
            </p>
          </div>
          <div className={styles.actions}>
            <Link href="/admin/createPost" className={styles.createButton}>
              + Nueva Publicación
            </Link>
          </div>
        </div>

        <div className={styles.filterSection}>
          <div className={styles.searchBarWrapper}>
            <Search size={20} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Buscar por título o contenido..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className={styles.searchInput}
            />
          </div>
        </div>

        {paginatedPosts.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No hay resultados para esta búsqueda.</p>
          </div>
        ) : (
          <>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th onClick={() => handleSort("header")}>
                      <div className={styles.headerCell}>
                        Título
                        {sortConfig.key === "header" && (
                          <ChevronDown size={16} style={{ transform: sortConfig.direction === "asc" ? "rotate(180deg)" : "rotate(0deg)" }} />
                        )}
                      </div>
                    </th>
                    <th onClick={() => handleSort("is_pinned")}>
                      <div className={styles.headerCell}>
                        Destacada
                        {sortConfig.key === "is_pinned" && (
                          <ChevronDown size={16} style={{ transform: sortConfig.direction === "asc" ? "rotate(180deg)" : "rotate(0deg)" }} />
                        )}
                      </div>
                    </th>
                    <th onClick={() => handleSort("created_at")}>
                      <div className={styles.headerCell}>
                        Fecha
                        {sortConfig.key === "created_at" && (
                          <ChevronDown size={16} style={{ transform: sortConfig.direction === "asc" ? "rotate(180deg)" : "rotate(0deg)" }} />
                        )}
                      </div>
                    </th>
                    <th>Imagen</th>
                    <th className={styles.actionsHeader}></th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPosts.map((post) => (
                    <tr key={post.pid}>
                      <td className={styles.nameCell}>{post.header}</td>
                      <td>
                        {post.is_pinned && (
                          <span title="Publicación destacada">
                            <Pin size={16} color="var(--color-primary)" />
                          </span>
                        )}
                      </td>
                      <td>
                        {new Date(post.created_at).toLocaleDateString("es-PR", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td>
                        {post.image_url ? (
                          <Image
                            src={post.image_url}
                            alt={post.header}
                            className={styles.thumbnail}
                            width={60}
                            height={60}
                            sizes="60px"
                            onError={(e) => { e.currentTarget.style.display = "none"; }}
                          />
                        ) : (
                          <span style={{ color: "var(--color-text-muted)", fontSize: "12px" }}>—</span>
                        )}
                      </td>
                      <td>
                        <div className={styles.actionButtons}>
                          <Link
                            href={`/admin/editPost?id=${post.pid}`}
                            className={styles.editButton}
                          >
                            Editar
                          </Link>
                          <button
                            onClick={() => handleDeleteClick(post)}
                            className={styles.deleteButton}
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

            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  className={styles.paginationButton}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  ← Anterior
                </button>
                <div className={styles.pageInfo}>
                  <span>Página <strong>{currentPage}</strong> de <strong>{totalPages}</strong></span>
                </div>
                <button
                  className={styles.paginationButton}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Siguiente →
                </button>
              </div>
            )}
          </>
        )}

        {error && (
          <div className={styles.errorState} role="alert">
            <p>{error}</p>
          </div>
        )}

        <DeleteConfirmModal
          isOpen={deleteModalOpen}
          postHeader={postToDelete?.header || ""}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
          isDeleting={isDeleting}
        />
      </div>
    </main>
  );
}
