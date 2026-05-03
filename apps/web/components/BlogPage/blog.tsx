"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Source_Serif_4, JetBrains_Mono } from "next/font/google";
import {
  Facebook,
  ExternalLink,
  RefreshCw,
  MessageCircle,
  Share2,
  Clapperboard,
  ImageIcon,
  Video,
  Heart,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { FacebookPost, FacebookComment } from "@/pages/api/facebook-posts";
import styles from "./blog.module.css";

const serif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
  display: "swap",
});

const AUTHOR_NAME = "Ciudadanos Pro Albergue";
const FB_PAGE_URL =
  "https://www.facebook.com/Ciudadanos-Pro-Albergue-de-Animales-de-Aguadilla-Inc-147815628577682/";

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

type PostType = "reel" | "shared" | "normal";

function getPostType(post: FacebookPost): PostType {
  const attachType = post.attachments?.data[0]?.type ?? "";
  if (post.story || attachType === "share") return "shared";
  if (
    attachType === "video_inline" ||
    attachType === "video" ||
    attachType === "reel"
  )
    return "reel";
  return "normal";
}

const POST_TYPE_BADGE: Record<
  PostType,
  { label: string; icon: React.ReactNode } | null
> = {
  reel: { label: "Reel", icon: <Clapperboard size={11} /> },
  shared: { label: "Compartido", icon: <Share2 size={11} /> },
  normal: null,
};

function getImages(post: FacebookPost): string[] {
  const attachment = post.attachments?.data[0];
  if (attachment?.subattachments?.data.length) {
    return attachment.subattachments.data
      .map((s) => s.media?.image?.src)
      .filter((src): src is string => Boolean(src));
  }
  if (post.full_picture) return [post.full_picture];
  return [];
}

function splitPost(text: string): { title: string; paragraphs: string[] } {
  const lines = text.split("\n").filter((l) => l.trim());
  if (lines.length === 0) return { title: "", paragraphs: [] };
  const [first, ...rest] = lines;
  const title = first.length > 100 ? first.slice(0, 100) + "…" : first;
  return { title, paragraphs: rest };
}

function extractExcerpt(text: string, maxLen = 200): string {
  const clean = text.replace(/\n+/g, " ").trim();
  return clean.length > maxLen ? clean.slice(0, maxLen) + "…" : clean;
}

// ── Image Grid ──────────────────────────────────────────────────────────────

function ImageGrid({ images }: { images: string[] }) {
  if (images.length === 0) return null;

  if (images.length === 1) {
    return (
      <div className={styles.postImage}>
        <Image
          src={images[0]}
          alt="Publicación"
          fill
          style={{ objectFit: "cover" }}
          sizes="(max-width: 720px) 100vw, 720px"
          unoptimized
        />
      </div>
    );
  }

  if (images.length === 3) {
    return (
      <div className={styles.postImageGrid3}>
        <div className={styles.postImageGrid3Left}>
          <Image
            src={images[0]}
            alt="Foto 1"
            fill
            style={{ objectFit: "cover" }}
            sizes="480px"
            unoptimized
          />
        </div>
        <div className={styles.postImageGrid3Right}>
          {images.slice(1).map((src, i) => (
            <div key={i} className={styles.postImageGrid3Small}>
              <Image
                src={src}
                alt={`Foto ${i + 2}`}
                fill
                style={{ objectFit: "cover" }}
                sizes="240px"
                unoptimized
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const count = Math.min(images.length, 4);
  const gridClass =
    count === 2 ? styles.postImageGrid2 : styles.postImageGrid4;

  return (
    <div className={`${styles.postImageGrid} ${gridClass}`}>
      {images.slice(0, 4).map((src, i) => (
        <div key={i} className={styles.postImageGridTile}>
          {i === 3 && images.length > 4 && (
            <div className={styles.postImageGridMore}>+{images.length - 4}</div>
          )}
          <Image
            src={src}
            alt={`Foto ${i + 1}`}
            fill
            style={{ objectFit: "cover" }}
            sizes="360px"
            unoptimized
          />
        </div>
      ))}
    </div>
  );
}

// ── Comment ─────────────────────────────────────────────────────────────────

function Comment({ comment }: { comment: FacebookComment }) {
  return (
    <div className={styles.comment}>
      <div className={styles.commentAvatar}>
        {(comment.from?.name ?? "A")[0].toUpperCase()}
      </div>
      <div className={styles.commentBody}>
        <div className={styles.commentHead}>
          <span className={styles.commentName}>
            {comment.from?.name ?? "Anónimo"}
          </span>
          <span className={styles.commentDate}>
            {formatDate(comment.created_time)}
          </span>
        </div>
        <p className={styles.commentText}>{comment.message}</p>
      </div>
    </div>
  );
}

// ── Composer (UI only — no backend) ─────────────────────────────────────────

function Composer() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        className={styles.composerCollapsed}
        onClick={() => setOpen(true)}
      >
        <div className={styles.composerAvatar}>C</div>
        <div className={styles.composerPrompt}>
          <span>¿Qué quieres compartir?</span>
          <span className={styles.composerHint}>
            Conectar con Facebook próximamente
          </span>
        </div>
        <span className={styles.composerCta}>Publicar →</span>
      </button>
    );
  }

  return (
    <div className={styles.composerOpen}>
      <div className={styles.composerHead}>
        <div className={styles.composerAvatar}>C</div>
        <span className={styles.composerName}>{AUTHOR_NAME}</span>
        <button
          className={styles.composerClose}
          onClick={() => setOpen(false)}
          aria-label="Cerrar compositor"
        >
          ×
        </button>
      </div>
      <textarea
        className={styles.composerBody}
        placeholder="Escribe algo para compartir con la comunidad..."
        readOnly
      />
      <div className={styles.composerTools}>
        <div className={styles.composerAttach}>
          <button
            className={styles.composerAttachBtn}
            disabled
            title="Próximamente"
          >
            <ImageIcon size={14} /> Foto
          </button>
          <button
            className={styles.composerAttachBtn}
            disabled
            title="Próximamente"
          >
            <Video size={14} /> Video
          </button>
        </div>
        <div className={styles.composerSubmit}>
          <button className={styles.btnGhost} onClick={() => setOpen(false)}>
            Cancelar
          </button>
          <button
            className={styles.btnPrimary}
            disabled
            title="Próximamente"
          >
            Publicar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Post Card ────────────────────────────────────────────────────────────────

function PostCard({ post }: { post: FacebookPost }) {
  const [showComments, setShowComments] = useState(false);
  const text = post.message ?? post.story ?? "";
  const comments = post.comments?.data ?? [];
  const images = getImages(post);
  const postType = getPostType(post);
  const badge = POST_TYPE_BADGE[postType];
  const { title, paragraphs } = splitPost(text);
  const likeCount = post.likes?.summary?.total_count ?? 0;

  return (
    <article className={styles.post}>
      <div className={styles.postHeader}>
        <span className={styles.postDate}>{formatDate(post.created_time)}</span>
        {badge && (
          <span
            className={`${styles.badge} ${
              postType === "reel" ? styles.badgeReel : styles.badgeShared
            }`}
          >
            {badge.icon}
            {badge.label}
          </span>
        )}
      </div>

      {title && <h2 className={styles.postTitle}>{title}</h2>}

      {paragraphs.length > 0 && (
        <div className={styles.postBody}>
          {paragraphs.map((p, i) => (
            <p key={i} className={styles.postPara}>
              {p}
            </p>
          ))}
        </div>
      )}

      <ImageGrid images={images} />

      <footer className={styles.postFooter}>
        <div className={styles.postActions}>
          <span className={styles.action}>
            <Heart size={13} />
            {likeCount}
          </span>
          {comments.length > 0 ? (
            <button
              className={styles.action}
              onClick={() => setShowComments((s) => !s)}
              aria-expanded={showComments}
            >
              <MessageCircle size={13} />
              {comments.length}
              {showComments ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            </button>
          ) : (
            <span className={styles.action}>
              <MessageCircle size={13} />
              0
            </span>
          )}
        </div>
        <a
          href={post.permalink_url}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.postSource}
        >
          <Facebook size={12} />
          Ver en Facebook
          <ExternalLink size={10} />
        </a>
      </footer>

      {showComments && comments.length > 0 && (
        <div className={styles.comments}>
          {comments.map((c) => (
            <Comment key={c.id} comment={c} />
          ))}
        </div>
      )}
    </article>
  );
}

// ── Featured Post ────────────────────────────────────────────────────────────

function FeaturedPost({ post }: { post: FacebookPost }) {
  const text = post.message ?? post.story ?? "";
  const images = getImages(post);
  const excerpt = extractExcerpt(text);
  const { title } = splitPost(text);
  const displayTitle = title || excerpt;

  return (
    <section className={styles.featured}>
      <div className={styles.featuredLabel}>
        <span className={styles.featuredDot} />
        Publicación destacada
      </div>
      <div className={styles.featuredGrid}>
        <div className={styles.featuredMedia}>
          {images[0] ? (
            <div className={styles.featuredImage}>
              <Image
                src={images[0]}
                alt="Publicación destacada"
                fill
                style={{ objectFit: "cover" }}
                sizes="(max-width: 640px) 100vw, 400px"
                unoptimized
              />
            </div>
          ) : (
            <div
              className={`${styles.featuredImage} ${styles.imgPlaceholder}`}
            >
              <span className={styles.imgPlaceholderLabel}>Sin imagen</span>
            </div>
          )}
        </div>
        <div>
          <span className={styles.featuredDate}>
            {formatDate(post.created_time)}
          </span>
          <h2 className={styles.featuredTitle}>{displayTitle}</h2>
          {title && <p className={styles.featuredExcerpt}>{excerpt}</p>}
          <div className={styles.featuredMeta}>
            <span>{AUTHOR_NAME}</span>
            <span>{getRelativeTime(post.created_time)}</span>
          </div>
          <a
            href={post.permalink_url}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.featuredLink}
          >
            Leer publicación
            <ExternalLink size={13} />
          </a>
        </div>
      </div>
    </section>
  );
}

// ── Skeleton Card ────────────────────────────────────────────────────────────

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

// ── Scroll reveal ────────────────────────────────────────────────────────────

function useScrollReveal(dep: number) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add(styles.visible);
        }),
      { threshold: 0.05, rootMargin: "0px 0px -20px 0px" }
    );
    ref.current
      ?.querySelectorAll(`.${styles.fadeInUp}`)
      .forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [dep]);
  return ref;
}

// ── Main Blog ────────────────────────────────────────────────────────────────

export default function Blog() {
  const [posts, setPosts] = useState<FacebookPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const feedRef = useScrollReveal(posts.length);

  async function loadPosts() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/facebook-posts?limit=100");
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Error al cargar publicaciones");
      }
      const data: FacebookPost[] = await res.json();
      setPosts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPosts();
  }, []);

  const [featured, ...feedPosts] = posts;

  return (
    <div className={`${styles.page} ${serif.variable} ${mono.variable}`}>
      {/* ── Masthead ─────────────────────────────────────────────────── */}
      <section className={styles.masthead}>
        <div className={styles.mastheadInner}>
          <div className={styles.mastheadEyebrow}>Nuestras publicaciones</div>
          <h1 className={styles.mastheadTitle}>
            Cada animal merece
            <br />
            una <em>segunda oportunidad</em>
          </h1>
          <p className={styles.mastheadLede}>
            Espejo de nuestra página oficial de Facebook. Seguimos nuestra
            misión de rescate, rehabilitación y adopción animal en Aguadilla.
          </p>
          <div className={styles.mastheadMeta}>
            <strong>{AUTHOR_NAME}</strong>
            <span className={styles.mastheadMetaDot} />
            <span>Aguadilla, PR</span>
            {posts.length > 0 && (
              <>
                <span className={styles.mastheadMetaDot} />
                <span>{posts.length} publicaciones</span>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── Feed ─────────────────────────────────────────────────────── */}
      <main className={styles.feed} ref={feedRef}>
        {loading && (
          <div className={styles.feedList}>
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className={styles.errorState}>
            <p className={styles.errorText}>{error}</p>
            <button className={styles.retryBtn} onClick={loadPosts}>
              <RefreshCw size={16} />
              Intentar de nuevo
            </button>
          </div>
        )}

        {!loading && !error && posts.length === 0 && (
          <div className={styles.emptyState}>
            <Facebook size={40} color="#ccc" />
            <p>No hay publicaciones disponibles en este momento.</p>
            <a
              href={FB_PAGE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.postSource}
            >
              Ver en Facebook
            </a>
          </div>
        )}

        {!loading && !error && posts.length > 0 && (
          <>
            <Composer />

            {featured && <FeaturedPost post={featured} />}

            <div className={styles.feedList}>
              {feedPosts.map((post, i) => (
                <div
                  key={post.id}
                  className={`${styles.feedItem} ${styles.fadeInUp}`}
                  style={{ transitionDelay: `${Math.min(i * 60, 300)}ms` }}
                >
                  <PostCard post={post} />
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
