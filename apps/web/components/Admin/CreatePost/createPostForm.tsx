import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createPost, uploadPostImage, updatePost } from "@/services/postService";
import {
  fetchUploadConfig,
  isUploadStorageAvailable,
  getUploadStorageUnavailableMessage,
  type UploadConfig,
} from "@/services/animalImageUploadService";
import styles from "../CreateAnimal/createAnimalForm.module.css";

const REDIRECT_DELAY_MS = 1500;

export default function CreatePostForm() {
  const router = useRouter();
  const [header, setHeader] = useState("");
  const [body, setBody] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [uploadConfig, setUploadConfig] = useState<UploadConfig | null>(null);
  const [uploadConfigError, setUploadConfigError] = useState("");
  const [isUploadConfigLoading, setIsUploadConfigLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const config = await fetchUploadConfig();
        if (isMounted) {
          setUploadConfig(config);
          setUploadConfigError("");
        }
      } catch (err) {
        if (isMounted) {
          setUploadConfigError(
            err instanceof Error ? err.message : "No se pudo verificar el almacenamiento."
          );
        }
      } finally {
        if (isMounted) setIsUploadConfigLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  const storageUnavailableMessage =
    uploadConfigError || getUploadStorageUnavailableMessage(uploadConfig);
  const isStorageHealthy = isUploadStorageAvailable(uploadConfig);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!header.trim()) {
      setErrorMessage("El título es requerido.");
      return;
    }
    if (!body.trim()) {
      setErrorMessage("El contenido es requerido.");
      return;
    }

    setIsLoading(true);

    try {
      if (selectedFile) {
        const freshConfig = await fetchUploadConfig().catch(() => null);
        if (!isUploadStorageAvailable(freshConfig)) {
          setErrorMessage(getUploadStorageUnavailableMessage(freshConfig));
          return;
        }
      }

      const post = await createPost({
        header: header.trim(),
        body: body.trim(),
        is_pinned: isPinned,
      });

      if (selectedFile) {
        const uploadResult = await uploadPostImage(post.pid, selectedFile);
        await updatePost(post.pid, { image_object_key: uploadResult.objectKey });
      }

      setSuccessMessage("¡Publicación creada exitosamente! Redirigiendo...");
      setTimeout(() => router.push("/admin/posts"), REDIRECT_DELAY_MS);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Error al crear la publicación.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.formWrapper}>
        <div className={styles.headerWithBackButton}>
          <Link href="/admin/posts" className={styles.backButton}>
            <ArrowLeft size={16} />
            Volver a Publicaciones
          </Link>
          <h1 className={styles.title}>Nueva Publicación</h1>
        </div>

        <form onSubmit={onSubmit}>
          {/* Image */}
          <div className={styles.imagePreviewSection}>
            <p className={styles.sectionLabel}>Imagen</p>
            {previewUrl ? (
              <div style={{ position: "relative", width: 200, height: 200, marginBottom: 12 }}>
                <Image
                  src={previewUrl}
                  alt="Vista previa"
                  fill
                  style={{ objectFit: "cover", borderRadius: 8 }}
                />
              </div>
            ) : (
              <div
                style={{
                  width: 200,
                  height: 200,
                  background: "var(--color-border)",
                  borderRadius: 8,
                  marginBottom: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--color-text-muted)",
                  fontSize: 13,
                }}
              >
                Sin imagen
              </div>
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
            />
            {isUploadConfigLoading && (
              <p style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                Verificando almacenamiento...
              </p>
            )}
            {!isUploadConfigLoading && !isStorageHealthy && (
              <p style={{ fontSize: 12, color: "var(--color-error)" }}>
                {storageUnavailableMessage}
              </p>
            )}
          </div>

          {/* Fields */}
          <div className={styles.formField ?? "formField"} style={{ marginBottom: 20 }}>
            <label
              htmlFor="header"
              style={{ display: "block", fontWeight: 600, marginBottom: 6, fontSize: 14 }}
            >
              Título *
            </label>
            <input
              id="header"
              type="text"
              value={header}
              maxLength={160}
              onChange={(e) => setHeader(e.target.value)}
              placeholder="Título de la publicación (máx. 160 caracteres)"
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid var(--color-border)",
                borderRadius: 6,
                fontSize: 14,
              }}
            />
            <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 4 }}>
              {header.length}/160
            </p>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label
              htmlFor="body"
              style={{ display: "block", fontWeight: 600, marginBottom: 6, fontSize: 14 }}
            >
              Contenido *
            </label>
            <textarea
              id="body"
              value={body}
              maxLength={5000}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              placeholder="Escribe el contenido de la publicación..."
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid var(--color-border)",
                borderRadius: 6,
                fontSize: 14,
                resize: "vertical",
              }}
            />
            <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 4 }}>
              {body.length}/5000
            </p>
          </div>

          <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 10 }}>
            <input
              id="isPinned"
              type="checkbox"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              style={{ width: 16, height: 16 }}
            />
            <label htmlFor="isPinned" style={{ fontSize: 14, fontWeight: 500, cursor: "pointer" }}>
              Marcar como publicación destacada
            </label>
          </div>

          {errorMessage && (
            <div
              role="alert"
              style={{
                background: "var(--color-error-soft, #fee)",
                color: "var(--color-error, #c00)",
                padding: "10px 14px",
                borderRadius: 6,
                marginBottom: 16,
                fontSize: 14,
              }}
            >
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div
              role="status"
              style={{
                background: "var(--color-success-soft, #efe)",
                color: "var(--color-success, #0a0)",
                padding: "10px 14px",
                borderRadius: 6,
                marginBottom: 16,
                fontSize: 14,
              }}
            >
              {successMessage}
            </div>
          )}

          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
            <Link
              href="/admin/posts"
              style={{
                padding: "10px 20px",
                border: "1px solid var(--color-border)",
                borderRadius: 6,
                fontSize: 14,
                textDecoration: "none",
                color: "var(--color-text)",
              }}
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={isLoading || (!!selectedFile && !isStorageHealthy)}
              style={{
                padding: "10px 24px",
                background: "var(--color-primary)",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 600,
                cursor: isLoading ? "not-allowed" : "pointer",
                opacity: isLoading ? 0.7 : 1,
              }}
            >
              {isLoading ? "Creando..." : "Crear Publicación"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
