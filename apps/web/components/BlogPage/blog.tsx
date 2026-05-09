import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Facebook,
  ExternalLink,
  RefreshCw,
  MessageCircle,
  Share2,
  Clapperboard,
  Heart,
  ChevronDown,
  ChevronUp,
  Globe,
  Pin,
  PinOff,
  LogIn,
  LogOut,
  Plus,
  X,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
} from "lucide-react";
import type { FacebookPost, FacebookComment } from "@/pages/api/facebook-posts";
import type { Post } from "@/types/post";
import { supabase } from "@/lib/supabase";
import { fetchUploadConfig, isUploadStorageAvailable } from "@/services/animalImageUploadService";
import { createPost, uploadPostImage, updatePost, deletePost } from "@/services/postService";
import { fetchPinnedFbPostId, setPinnedFbPostId } from "@/services/settingsService";
import styles from "./blog.module.css";

const AUTHOR_NAME = "Ciudadanos Pro Albergue";
const FB_PAGE_URL =
  "https://www.facebook.com/Ciudadanos-Pro-Albergue-de-Animales-de-Aguadilla-Inc-147815628577682/";
// ── Types ────────────────────────────────────────────────────────────────────

type BlogFeedPost = {
  id: string;
  source: "local" | "facebook";
  header: string;
  body: string;
  imageUrls: string[];
  createdAt: string;
  isPinned: boolean;
  pid?: number;
  externalUrl?: string;
  metadata?: {
    likes?: number;
    comments?: number;
    facebookType?: "reel" | "shared" | "normal";
    rawComments?: FacebookComment[];
  };
};

// ── Normalizers ──────────────────────────────────────────────────────────────

function getFbPostType(post: FacebookPost): "reel" | "shared" | "normal" {
  const attachType = post.attachments?.data[0]?.type ?? "";
  if (post.story || attachType === "share") return "shared";
  if (attachType === "video_inline" || attachType === "video" || attachType === "reel") return "reel";
  return "normal";
}

function getFbImages(post: FacebookPost): string[] {
  const attachment = post.attachments?.data[0];
  if (attachment?.subattachments?.data.length) {
    return attachment.subattachments.data
      .map((s) => s.media?.image?.src)
      .filter((src): src is string => Boolean(src));
  }
  if (post.full_picture) return [post.full_picture];
  return [];
}

function normalizeFacebookPost(post: FacebookPost): BlogFeedPost {
  const text = post.message ?? post.story ?? "";
  return {
    id: `fb-${post.id}`,
    source: "facebook",
    header: text.split("\n")[0]?.slice(0, 160) || "",
    body: text,
    imageUrls: getFbImages(post),
    createdAt: post.created_time,
    isPinned: false,
    externalUrl: post.permalink_url,
    metadata: {
      likes: post.likes?.summary?.total_count ?? 0,
      comments: post.comments?.data?.length ?? 0,
      facebookType: getFbPostType(post),
      rawComments: post.comments?.data ?? [],
    },
  };
}

function normalizeLocalPost(post: Post): BlogFeedPost {
  return {
    id: `local-${post.pid}`,
    source: "local",
    header: post.header,
    body: post.body,
    imageUrls: post.image_url ? [post.image_url] : [],
    createdAt: post.created_at,
    isPinned: post.is_pinned,
    pid: post.pid,
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-PR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `Hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Hace ${hrs} h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `Hace ${days} día${days !== 1 ? "s" : ""}`;
  return formatDate(iso);
}

const BODY_LIMIT = 500;

// ── Image Grid ───────────────────────────────────────────────────────────────

function ImageGrid({ images, unoptimized = false }: { images: string[]; unoptimized?: boolean }) {
  if (images.length === 0) return null;

  if (images.length === 1) {
    return (
      <div className={styles.postImage}>
        <Image src={images[0]} alt="Publicación" fill style={{ objectFit: "cover" }} sizes="(max-width: 720px) 100vw, 720px" unoptimized={unoptimized} />
      </div>
    );
  }

  if (images.length === 3) {
    return (
      <div className={styles.postImageGrid3}>
        <div className={styles.postImageGrid3Left}>
          <Image src={images[0]} alt="Foto 1" fill style={{ objectFit: "cover" }} sizes="480px" unoptimized={unoptimized} />
        </div>
        <div className={styles.postImageGrid3Right}>
          {images.slice(1).map((src, i) => (
            <div key={i} className={styles.postImageGrid3Small}>
              <Image src={src} alt={`Foto ${i + 2}`} fill style={{ objectFit: "cover" }} sizes="240px" unoptimized={unoptimized} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const count = Math.min(images.length, 4);
  const gridClass = count === 2 ? styles.postImageGrid2 : styles.postImageGrid4;
  return (
    <div className={`${styles.postImageGrid} ${gridClass}`}>
      {images.slice(0, 4).map((src, i) => (
        <div key={i} className={styles.postImageGridTile}>
          {i === 3 && images.length > 4 && <div className={styles.postImageGridMore}>+{images.length - 4}</div>}
          <Image src={src} alt={`Foto ${i + 1}`} fill style={{ objectFit: "cover" }} sizes="360px" unoptimized={unoptimized} />
        </div>
      ))}
    </div>
  );
}

// ── Comment ──────────────────────────────────────────────────────────────────

function Comment({ comment }: { comment: FacebookComment }) {
  return (
    <div className={styles.comment}>
      <div className={styles.commentAvatar}>{(comment.from?.name ?? "A")[0].toUpperCase()}</div>
      <div className={styles.commentBody}>
        <div className={styles.commentHead}>
          <span className={styles.commentName}>{comment.from?.name ?? "Anónimo"}</span>
          <span className={styles.commentDate}>{formatDate(comment.created_time)}</span>
        </div>
        <p className={styles.commentText}>{comment.message}</p>
      </div>
    </div>
  );
}

// ── Source Badge ─────────────────────────────────────────────────────────────

function SourceBadge({ post }: { post: BlogFeedPost }) {
  if (post.source === "facebook") {
    const type = post.metadata?.facebookType;
    if (type === "reel") return <span className={`${styles.badge} ${styles.badgeReel}`}><Clapperboard size={11} /> Reel</span>;
    if (type === "shared") return <span className={`${styles.badge} ${styles.badgeShared}`}><Share2 size={11} /> Compartido</span>;
    return <span className={`${styles.badge} ${styles.badgeFacebook}`}><Facebook size={11} /> Facebook</span>;
  }
  return <span className={`${styles.badge} ${styles.badgeWeb}`}><Globe size={11} /> Web</span>;
}

// ── Post Card ─────────────────────────────────────────────────────────────────

function PostCard({
  post,
  isAdmin,
  onPinToggle,
  onEdit,
  onDelete,
}: {
  post: BlogFeedPost;
  isAdmin: boolean;
  onPinToggle?: (postId: string, pin: boolean) => Promise<void>;
  onEdit?: (post: BlogFeedPost) => void;
  onDelete?: (post: BlogFeedPost) => void;
}) {
  const [showComments, setShowComments] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [pinning, setPinning] = useState(false);

  const comments = post.metadata?.rawComments ?? [];
  const isLong = post.body.length > BODY_LIMIT;
  const visibleBody = isLong && !expanded ? post.body.slice(0, BODY_LIMIT).trimEnd() + "…" : post.body;
  const likeCount = post.metadata?.likes ?? 0;

  const handlePin = async () => {
    if (pinning) return;
    setPinning(true);
    try {
      await onPinToggle?.(post.id, !post.isPinned);
    } catch {
      // pin failed silently
    } finally {
      setPinning(false);
    }
  };

  return (
    <article className={styles.post}>
      <div className={styles.postHeader}>
        <span className={styles.postDate}>{formatDate(post.createdAt)}</span>
        <SourceBadge post={post} />
        {isAdmin && (
          <>
            <button
              className={`${styles.pinBtn} ${post.isPinned ? styles.pinBtnActive : ""}`}
              onClick={handlePin}
              disabled={pinning}
              title={post.isPinned ? "Quitar destacado" : "Destacar publicación"}
            >
              {post.isPinned ? <PinOff size={14} /> : <Pin size={14} />}
            </button>
            {post.source === "local" && (
              <>
                <button className={styles.editBtn} onClick={() => onEdit?.(post)} title="Editar publicación">
                  <Pencil size={14} />
                </button>
                <button className={styles.deleteBtn} onClick={() => onDelete?.(post)} title="Eliminar publicación">
                  <Trash2 size={14} />
                </button>
              </>
            )}
          </>
        )}
      </div>

      {post.header && <h2 className={styles.postTitle}>{post.header}</h2>}

      <div className={styles.postBody}>
        <p className={styles.postPara}>{visibleBody}</p>
        {isLong && (
          <button className={styles.readMore} onClick={() => setExpanded((e) => !e)}>
            {expanded ? "Ver menos" : "Ver más"}
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        )}
      </div>

      <ImageGrid images={post.imageUrls} unoptimized={post.source === "facebook"} />

      <footer className={styles.postFooter}>
        {post.source === "facebook" && (
          <div className={styles.postActions}>
            <span className={styles.action}><Heart size={13} />{likeCount}</span>
            {comments.length > 0 ? (
              <button className={styles.action} onClick={() => setShowComments((s) => !s)} aria-expanded={showComments}>
                <MessageCircle size={13} />{comments.length}
                {showComments ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
              </button>
            ) : (
              <span className={styles.action}><MessageCircle size={13} />0</span>
            )}
          </div>
        )}
        {post.externalUrl && (
          <a href={post.externalUrl} target="_blank" rel="noopener noreferrer" className={styles.postSource}>
            <Facebook size={12} />Ver en Facebook<ExternalLink size={10} />
          </a>
        )}
      </footer>

      {showComments && comments.length > 0 && (
        <div className={styles.comments}>
          {comments.map((c) => <Comment key={c.id} comment={c} />)}
        </div>
      )}
    </article>
  );
}

// ── Featured Post ─────────────────────────────────────────────────────────────

function FeaturedPost({
  post,
  isAdmin,
  onPinToggle,
  onEdit,
  onDelete,
}: {
  post: BlogFeedPost;
  isAdmin: boolean;
  onPinToggle?: (postId: string, pin: boolean) => Promise<void>;
  onEdit?: (post: BlogFeedPost) => void;
  onDelete?: (post: BlogFeedPost) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [pinning, setPinning] = useState(false);

  const isLong = post.body.length > BODY_LIMIT;
  const visibleBody = isLong && !expanded ? post.body.slice(0, BODY_LIMIT).trimEnd() + "…" : post.body;

  const handlePin = async () => {
    if (pinning) return;
    setPinning(true);
    try {
      await onPinToggle?.(post.id, !post.isPinned);
    } catch {
      // silent
    } finally {
      setPinning(false);
    }
  };

  return (
    <section className={styles.featured}>
      <div className={styles.featuredLabel}>
        <span className={styles.featuredDot} />
        Publicación destacada
        <SourceBadge post={post} />
        {isAdmin && (
          <>
            <button
              className={`${styles.pinBtn} ${post.isPinned ? styles.pinBtnActive : ""}`}
              onClick={handlePin}
              disabled={pinning}
              title={post.isPinned ? "Quitar destacado" : "Destacar"}
            >
              {post.isPinned ? <PinOff size={14} /> : <Pin size={14} />}
            </button>
            {post.source === "local" && (
              <>
                <button className={styles.editBtn} onClick={() => onEdit?.(post)} title="Editar publicación">
                  <Pencil size={14} />
                </button>
                <button className={styles.deleteBtn} onClick={() => onDelete?.(post)} title="Eliminar publicación">
                  <Trash2 size={14} />
                </button>
              </>
            )}
          </>
        )}
      </div>
      <div className={post.imageUrls[0] ? styles.featuredGrid : undefined}>
        {post.imageUrls[0] && (
          <div className={styles.featuredMedia}>
            <div className={styles.featuredImage}>
              <Image src={post.imageUrls[0]} alt="Publicación destacada" fill priority style={{ objectFit: "cover" }} sizes="(max-width: 640px) 100vw, 400px" unoptimized={post.source === "facebook"} />
            </div>
          </div>
        )}
        <div>
          <span className={styles.featuredDate}>{formatDate(post.createdAt)}</span>
          <h2 className={styles.featuredTitle}>{post.header || post.body.slice(0, 100)}</h2>
          <div className={styles.postBody}>
            <p className={styles.featuredExcerpt}>{visibleBody}</p>
            {isLong && (
              <button className={styles.readMore} onClick={() => setExpanded((e) => !e)}>
                {expanded ? "Ver menos" : "Ver más"}
                {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>
            )}
          </div>
          <div className={styles.featuredMeta}>
            <span>{AUTHOR_NAME}</span>
            <span>{getRelativeTime(post.createdAt)}</span>
          </div>
          {post.externalUrl && (
            <a href={post.externalUrl} target="_blank" rel="noopener noreferrer" className={styles.featuredLink}>
              Leer publicación<ExternalLink size={13} />
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

// ── Login Modal ───────────────────────────────────────────────────────────────

function LoginModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (signInError) {
        setError(signInError.message === "Invalid login credentials"
          ? "Correo o contraseña incorrectos."
          : signInError.message);
        return;
      }
      if (!data?.session) {
        setError("No se pudo crear la sesión. Intenta de nuevo.");
        return;
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.loginModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.loginModalHeader}>
          <h2 className={styles.loginModalTitle}>Acceso Admin</h2>
          <button className={styles.loginModalClose} onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        {error && <p className={styles.loginModalError}>{error}</p>}

        <form onSubmit={handleSubmit} className={styles.loginModalForm}>
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.loginModalInput}
            required
            disabled={loading}
            autoFocus
          />
          <div className={styles.loginModalPasswordWrapper}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.loginModalInput}
              required
              disabled={loading}
            />
            <button type="button" className={styles.loginModalEyeBtn} onClick={() => setShowPassword((v) => !v)}>
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <button type="submit" className={styles.loginModalSubmit} disabled={loading}>
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Inline Create Form ────────────────────────────────────────────────────────

function CreatePostForm({ onCreated }: { onCreated: (post: BlogFeedPost) => void }) {
  const [open, setOpen] = useState(false);
  const [header, setHeader] = useState("");
  const [body, setBody] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!selectedFile) { setPreviewUrl(null); return; }
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  const reset = () => {
    setHeader(""); setBody(""); setIsPinned(false);
    setSelectedFile(null); setPreviewUrl(null); setError("");
    setOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!header.trim()) { setError("El título es requerido."); return; }
    if (!body.trim()) { setError("El contenido es requerido."); return; }

    setLoading(true);
    try {
      if (selectedFile) {
        const config = await fetchUploadConfig().catch(() => null);
        if (!isUploadStorageAvailable(config)) {
          setError("El almacenamiento de imágenes no está disponible.");
          return;
        }
      }

      const post = await createPost({ header: header.trim(), body: body.trim(), is_pinned: isPinned });
      let updated = post;
      if (selectedFile) {
        const uploadResult = await uploadPostImage(post.pid, selectedFile);
        updated = await updatePost(post.pid, { image_object_key: uploadResult.objectKey });
      }

      onCreated(normalizeLocalPost(updated));
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear la publicación.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button className={styles.createPostBtn} onClick={() => setOpen(true)}>
        <Plus size={16} /> Nueva publicación
      </button>
    );
  }

  return (
    <div className={styles.createPostForm}>
      <div className={styles.createPostFormHeader}>
        <h3 className={styles.createPostFormTitle}>Nueva Publicación</h3>
        <button className={styles.createPostFormClose} onClick={reset} aria-label="Cancelar">
          <X size={18} />
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Título (máx. 160 caracteres)"
          value={header}
          maxLength={160}
          onChange={(e) => setHeader(e.target.value)}
          className={styles.createPostInput}
          disabled={loading}
        />
        <textarea
          placeholder="Contenido de la publicación..."
          value={body}
          maxLength={5000}
          onChange={(e) => setBody(e.target.value)}
          rows={5}
          className={styles.createPostTextarea}
          disabled={loading}
        />

        <div className={styles.createPostImageRow}>
          <label className={styles.createPostFileLabel}>
            {selectedFile ? selectedFile.name : "Seleccionar imagen"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
              disabled={loading}
              hidden
            />
          </label>
          {previewUrl && (
            <div style={{ position: "relative", width: 60, height: 60, flexShrink: 0 }}>
              <Image src={previewUrl} alt="Vista previa" fill style={{ objectFit: "cover", borderRadius: 6 }} />
            </div>
          )}
        </div>

        <label className={styles.createPostPinLabel}>
          <input
            type="checkbox"
            checked={isPinned}
            onChange={(e) => setIsPinned(e.target.checked)}
            disabled={loading}
          />
          Marcar como publicación destacada
        </label>

        {error && <p className={styles.createPostError}>{error}</p>}

        <div className={styles.createPostActions}>
          <button type="button" className={styles.createPostCancel} onClick={reset} disabled={loading}>
            Cancelar
          </button>
          <button type="submit" className={styles.createPostSubmit} disabled={loading}>
            {loading ? "Publicando..." : "Publicar"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Skeleton Card ─────────────────────────────────────────────────────────────

// ── Edit Post Modal ───────────────────────────────────────────────────────────

function EditPostModal({
  post,
  onSave,
  onClose,
}: {
  post: BlogFeedPost;
  onSave: (updated: BlogFeedPost) => void;
  onClose: () => void;
}) {
  const [header, setHeader] = useState(post.header);
  const [body, setBody] = useState(post.body);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const hasCurrentImage = post.imageUrls[0] && !removeImage;

  useEffect(() => {
    if (!selectedFile) { setPreviewUrl(null); return; }
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  const handleRemoveImage = () => {
    setRemoveImage(true);
    setSelectedFile(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(e.target.files?.[0] ?? null);
    setRemoveImage(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!header.trim()) { setError("El título es requerido."); return; }
    if (!body.trim()) { setError("El contenido es requerido."); return; }
    setLoading(true);
    try {
      let extra: Record<string, unknown> = {};
      if (selectedFile) {
        const uploadResult = await uploadPostImage(post.pid!, selectedFile);
        extra = { image_object_key: uploadResult.objectKey };
      } else if (removeImage) {
        extra = { remove_image: true };
      }
      const updated = await updatePost(post.pid!, { header: header.trim(), body: body.trim(), ...extra });
      onSave(normalizeLocalPost(updated));
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar la publicación.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.editPostModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.loginModalHeader}>
          <h2 className={styles.loginModalTitle}>Editar publicación</h2>
          <button className={styles.loginModalClose} onClick={onClose} aria-label="Cerrar"><X size={18} /></button>
        </div>
        {error && <p className={styles.createPostError}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={header}
            maxLength={160}
            onChange={(e) => setHeader(e.target.value)}
            className={styles.createPostInput}
            disabled={loading}
          />
          <textarea
            value={body}
            maxLength={5000}
            onChange={(e) => setBody(e.target.value)}
            rows={6}
            className={styles.createPostTextarea}
            disabled={loading}
          />
          <div className={styles.createPostImageRow}>
            {hasCurrentImage && (
              <>
                <div style={{ position: "relative", width: 60, height: 60, flexShrink: 0 }}>
                  <Image src={post.imageUrls[0]} alt="Imagen actual" fill sizes="60px" style={{ objectFit: "cover", borderRadius: 6 }} />
                </div>
                <button type="button" className={styles.removeImageBtn} onClick={handleRemoveImage} disabled={loading}>
                  <Trash2 size={13} /> Quitar imagen
                </button>
              </>
            )}
            {removeImage && !selectedFile && (
              <span className={styles.removeImageNote}>Imagen será eliminada al guardar</span>
            )}
            {!removeImage && (
              <label className={styles.createPostFileLabel}>
                {selectedFile ? selectedFile.name : hasCurrentImage ? "Cambiar imagen" : "Agregar imagen (opcional)"}
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} disabled={loading} hidden />
              </label>
            )}
            {previewUrl && (
              <div style={{ position: "relative", width: 60, height: 60, flexShrink: 0 }}>
                <Image src={previewUrl} alt="Vista previa" fill style={{ objectFit: "cover", borderRadius: 6 }} />
              </div>
            )}
          </div>
          <div className={styles.createPostActions}>
            <button type="button" className={styles.createPostCancel} onClick={onClose} disabled={loading}>Cancelar</button>
            <button type="submit" className={styles.createPostSubmit} disabled={loading}>{loading ? "Guardando..." : "Guardar"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Delete Confirm Modal ──────────────────────────────────────────────────────

function DeleteConfirmModal({
  post,
  onConfirm,
  onClose,
}: {
  post: BlogFeedPost;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deletePost(post.pid!);
      onConfirm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar la publicación.");
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.deleteModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.loginModalHeader}>
          <h2 className={styles.loginModalTitle}>Eliminar publicación</h2>
          <button className={styles.loginModalClose} onClick={onClose} aria-label="Cerrar"><X size={18} /></button>
        </div>
        <p className={styles.deleteModalText}>
          ¿Estás seguro que deseas eliminar esta publicación? Esta acción no se puede deshacer.
        </p>
        {post.header && <p className={styles.deleteModalPostTitle}>&ldquo;{post.header}&rdquo;</p>}
        {error && <p className={styles.createPostError}>{error}</p>}
        <div className={styles.createPostActions}>
          <button className={styles.createPostCancel} onClick={onClose} disabled={loading}>Cancelar</button>
          <button className={styles.deleteConfirmBtn} onClick={handleDelete} disabled={loading}>
            {loading ? "Eliminando..." : "Eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Skeleton Card ─────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className={styles.skeleton}>
      <div className={`${styles.skelLine} ${styles.skelLineShort}`} />
      <div className={`${styles.skelLine} ${styles.skelLineTitle}`} />
      <div className={styles.skelLine} />
      <div className={styles.skelLine} />
      <div className={`${styles.skelLine} ${styles.skelLineShort}`} />
      <div className={styles.skelImg} />
    </div>
  );
}

// ── Scroll Reveal ─────────────────────────────────────────────────────────────

function useScrollReveal(dep: unknown) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add(styles.visible); }),
      { threshold: 0.05, rootMargin: "0px 0px -20px 0px" }
    );
    ref.current?.querySelectorAll(`.${styles.fadeInUp}`).forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [dep]);
  return ref;
}

// ── Main Blog ─────────────────────────────────────────────────────────────────

export default function Blog() {
  const [allPosts, setAllPosts] = useState<BlogFeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [fbError, setFbError] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogFeedPost | null>(null);
  const [deletingPost, setDeletingPost] = useState<BlogFeedPost | null>(null);
  const feedRef = useScrollReveal(`${allPosts.length}:${allPosts.find((p) => p.isPinned)?.id ?? ""}`);

  // Track auth state
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAdmin(!!session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAdmin(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function loadPosts() {
    setLoading(true);
    setFbError(null);
    setLocalError(null);

    const [fbResult, localResult, fbPinResult] = await Promise.allSettled([
      fetch("/api/facebook-posts?limit=100").then(async (res) => {
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          throw new Error(json.error ?? "Error al cargar publicaciones de Facebook");
        }
        return res.json() as Promise<FacebookPost[]>;
      }),
      fetch("/api/posts?limit=100").then(async (res) => {
        if (!res.ok) throw new Error("Error al cargar publicaciones locales");
        const json = await res.json();
        return (json.data ?? []) as Post[];
      }),
      fetchPinnedFbPostId(),
    ]);

    const pinnedFbId = fbPinResult.status === "fulfilled" ? fbPinResult.value : null;

    const fbPosts: BlogFeedPost[] =
      fbResult.status === "fulfilled"
        ? fbResult.value.map((p) => {
            const normalized = normalizeFacebookPost(p);
            if (pinnedFbId && normalized.id === `fb-${pinnedFbId}`) {
              return { ...normalized, isPinned: true };
            }
            return normalized;
          })
        : (setFbError(fbResult.reason instanceof Error ? fbResult.reason.message : "Error de Facebook"), []);

    const localPosts: BlogFeedPost[] =
      localResult.status === "fulfilled"
        ? localResult.value.map(normalizeLocalPost)
        : (setLocalError(localResult.reason instanceof Error ? localResult.reason.message : "Error al cargar publicaciones"), []);

    const merged = [...localPosts, ...fbPosts].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    setAllPosts(merged);
    setLoading(false);
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadPosts(); }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
  };

  const handlePostCreated = (newPost: BlogFeedPost) => {
    setAllPosts((prev) => {
      const list = newPost.isPinned
        ? prev.map((p) => ({ ...p, isPinned: false }))
        : prev;
      return [newPost, ...list].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    });
  };

  const handlePinToggle = async (postId: string, nowPinned: boolean): Promise<void> => {
    // Snapshot before optimistic update so we can rollback and read stale-free
    const prevPosts = allPosts;
    const pinnedLocalPre = prevPosts.find((p) => p.source === "local" && p.isPinned);

    setAllPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) return { ...p, isPinned: nowPinned };
        if (nowPinned) return { ...p, isPinned: false };
        return p;
      })
    );

    try {
      if (postId.startsWith("local-")) {
        const pid = Number(postId.replace("local-", ""));
        await updatePost(pid, { is_pinned: nowPinned });
        if (nowPinned) setPinnedFbPostId(null).catch(() => {});
      } else {
        const fbId = postId.replace("fb-", "");
        if (nowPinned) {
          if (pinnedLocalPre?.pid) updatePost(pinnedLocalPre.pid, { is_pinned: false }).catch(() => {});
          await setPinnedFbPostId(fbId);
        } else {
          await setPinnedFbPostId(null);
        }
      }
    } catch {
      setAllPosts(prevPosts); // rollback on failure
    }
  };

  const handleEditSave = (updated: BlogFeedPost) => {
    setAllPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setEditingPost(null);
  };

  const handleDeleteConfirm = () => {
    if (!deletingPost) return;
    setAllPosts((prev) => prev.filter((p) => p.id !== deletingPost.id));
    setDeletingPost(null);
  };

  const pinned = allPosts.find((p) => p.isPinned);
  const featured = pinned ?? null;
  const feedPosts = featured ? allPosts.filter((p) => p.id !== featured.id) : allPosts;
  const bothFailed = fbError !== null && localError !== null;
  const hasPosts = allPosts.length > 0;

  return (
    <div className={styles.page}>
      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onSuccess={() => setShowLoginModal(false)}
        />
      )}

      {editingPost && (
        <EditPostModal
          post={editingPost}
          onSave={handleEditSave}
          onClose={() => setEditingPost(null)}
        />
      )}

      {deletingPost && (
        <DeleteConfirmModal
          post={deletingPost}
          onConfirm={handleDeleteConfirm}
          onClose={() => setDeletingPost(null)}
        />
      )}

      {/* ── Masthead ───────────────────────────────────────────────── */}
      <section className={styles.masthead}>
        <div className={styles.mastheadInner}>
          <h1 className={styles.mastheadEyebrow}>Nuestras Publicaciones</h1>
          <div className={styles.mastheadMeta}>
            <strong>{AUTHOR_NAME}</strong>
            <span className={styles.mastheadMetaDot} />
            <span>Aguadilla, PR</span>
            {hasPosts && (
              <>
                <span className={styles.mastheadMetaDot} />
                <span>{allPosts.length} publicaciones</span>
              </>
            )}
            <span className={styles.mastheadMetaDot} />
            {isAdmin ? (
              <button className={styles.adminBarLogout} onClick={handleLogout}>
                <LogOut size={14} /> Cerrar sesión
              </button>
            ) : (
              <button className={styles.adminBarLogin} onClick={() => setShowLoginModal(true)}>
                <LogIn size={14} /> Admin
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── Feed ───────────────────────────────────────────────────── */}
      <main className={styles.feed} ref={feedRef}>
        {isAdmin && <CreatePostForm onCreated={handlePostCreated} />}

        {loading && (
          <div className={styles.feedList}>
            {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {!loading && bothFailed && (
          <div className={styles.errorState}>
            <p className={styles.errorText}>No se pudieron cargar las publicaciones.</p>
            <button className={styles.retryBtn} onClick={loadPosts}>
              <RefreshCw size={16} /> Intentar de nuevo
            </button>
          </div>
        )}

        {!loading && !bothFailed && fbError && (
          <p className={styles.sourceWarning}>Las publicaciones de Facebook no están disponibles en este momento.</p>
        )}

        {!loading && !bothFailed && localError && (
          <p className={styles.sourceWarning}>Las publicaciones del sitio web no están disponibles en este momento.</p>
        )}

        {!loading && !bothFailed && !hasPosts && (
          <div className={styles.emptyState}>
            <Facebook size={40} color="#ccc" />
            <p>No hay publicaciones disponibles en este momento.</p>
            <a href={FB_PAGE_URL} target="_blank" rel="noopener noreferrer" className={styles.postSource}>
              Ver en Facebook
            </a>
          </div>
        )}

        {!loading && !bothFailed && hasPosts && (
          <>
            {featured && (
              <FeaturedPost
                post={featured}
                isAdmin={isAdmin}
                onPinToggle={handlePinToggle}
                onEdit={setEditingPost}
                onDelete={setDeletingPost}
              />
            )}
            <div className={styles.feedList}>
              {feedPosts.map((post, i) => (
                <div
                  key={post.id}
                  className={`${styles.feedItem} ${styles.fadeInUp}`}
                  style={{ transitionDelay: `${Math.min(i * 60, 300)}ms` }}
                >
                  <PostCard
                    post={post}
                    isAdmin={isAdmin}
                    onPinToggle={handlePinToggle}
                    onEdit={setEditingPost}
                    onDelete={setDeletingPost}
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
