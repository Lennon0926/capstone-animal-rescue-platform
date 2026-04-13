"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Facebook, ExternalLink, Calendar, RefreshCw, MessageCircle, ChevronDown, ChevronUp, Share2, Clapperboard } from "lucide-react";
import type { FacebookPost, FacebookComment } from "@/pages/api/facebook-posts";
import styles from "./blog.module.css";

const AUTHOR_NAME = "Ciudadanos Pro Albergue";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-PR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

type PostType = "reel" | "shared" | "normal";

function getPostType(post: FacebookPost): PostType {
  const attachType = post.attachments?.data[0]?.type ?? "";
  // Shared post: story field (share without caption) OR "share" attachment type (share with caption)
  if (post.story || attachType === "share") return "shared";
  // Own reel/video post
  if (attachType === "video_inline" || attachType === "video" || attachType === "reel") return "reel";
  return "normal";
}

const POST_TYPE_BADGE: Record<PostType, { label: string; icon: React.ReactNode; className: string } | null> = {
  reel:   { label: "Reel", icon: <Clapperboard size={11} />, className: "badgeReel" },
  shared: { label: "Compartido", icon: <Share2 size={11} />, className: "badgeShared" },
  normal: null,
};

/** Collect all image URLs from a post: subattachments first, then full_picture fallback. */
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

const GRID_CLASS: Record<number, string> = {
  2: styles.cardImageGrid2,
  3: styles.cardImageGrid3,
  4: styles.cardImageGrid4,
};

function ImageGrid({ images }: { images: string[] }) {
  if (images.length === 0) return null;
  if (images.length === 1) {
    return (
      <div className={styles.cardImage}>
        <Image
          src={images[0]}
          alt="Publicación de Facebook"
          fill
          style={{ objectFit: "cover" }}
          sizes="(max-width: 740px) 100vw, 740px"
          unoptimized
        />
      </div>
    );
  }
  const count = Math.min(images.length, 4);
  const gridClass = GRID_CLASS[count] ?? styles.cardImageGrid4;
  return (
    <div className={`${styles.cardImageGrid} ${gridClass}`}>
      {images.slice(0, 4).map((src, i) => (
        <div key={i} className={styles.cardImageGridItem}>
          {i === 3 && images.length > 4 && (
            <div className={styles.cardImageMore}>+{images.length - 4}</div>
          )}
          <Image
            src={src}
            alt={`Foto ${i + 1}`}
            fill
            style={{ objectFit: "cover" }}
            sizes="(max-width: 740px) 50vw, 370px"
            unoptimized
          />
        </div>
      ))}
    </div>
  );
}

function Comment({ comment }: { comment: FacebookComment }) {
  return (
    <div className={styles.comment}>
      <div className={styles.commentAvatar}>
        {(comment.from?.name ?? "A")[0].toUpperCase()}
      </div>
      <div className={styles.commentBubble}>
        <span className={styles.commentAuthor}>{comment.from?.name ?? "Anónimo"}</span>
        <p className={styles.commentText}>{comment.message}</p>
        <span className={styles.commentDate}>{formatDate(comment.created_time)}</span>
      </div>
    </div>
  );
}

function extractTitle(text: string): string {
  const line = text.split("\n")[0].trim();
  return line.length > 90 ? line.slice(0, 90) + "…" : line;
}

function PostCard({ post }: { post: FacebookPost }) {
  const [expanded, setExpanded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const text = post.message ?? post.story ?? "";
  const comments = post.comments?.data ?? [];
  const images = getImages(post);

  const title = extractTitle(text);
  const postType = getPostType(post);
  const badge = POST_TYPE_BADGE[postType];

  return (
    <article className={styles.card}>
      {/* Author row — clicking toggles expanded */}
      <button
        className={styles.cardAuthor}
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
      >
        <div className={styles.cardAuthorAvatar}>C</div>
        <span className={styles.cardAuthorName}>{AUTHOR_NAME}</span>
        {badge && (
          <span className={`${styles.postBadge} ${styles[badge.className]}`}>
            {badge.icon}
            {badge.label}
          </span>
        )}
        <span className={styles.cardAuthorChevron}>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </button>

      {/* Collapsed: Medium-style horizontal card */}
      {!expanded && (
        <button
          className={styles.cardCollapsed}
          onClick={() => setExpanded(true)}
          aria-expanded={false}
        >
          <p className={styles.cardTitle}>{title}</p>
          {images[0] && (
            <div className={styles.cardThumb}>
              <Image
                src={images[0]}
                alt="Publicación de Facebook"
                fill
                style={{ objectFit: "cover" }}
                sizes="112px"
                unoptimized
              />
            </div>
          )}
        </button>
      )}

      {/* Expanded: title + body + full image grid */}
      {expanded && (
        <div className={styles.cardExpanded}>
          {text && <p className={styles.cardText}>{text}</p>}
          <ImageGrid images={images} />
        </div>
      )}

      {/* Footer */}
      <div className={styles.cardFooter}>
        <div className={styles.cardMeta}>
          <span className={styles.cardDate}>
            <Calendar size={12} />
            {formatDate(post.created_time)}
          </span>
          {comments.length > 0 && (
            <span className={styles.cardComments}>
              <MessageCircle size={12} />
              {comments.length}
            </span>
          )}
        </div>
        <a
          href={post.permalink_url}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.cardLink}
        >
          <Facebook size={13} />
          Ver en Facebook
          <ExternalLink size={11} />
        </a>
      </div>

      {/* Comments */}
      {comments.length > 0 && (
        <div className={styles.commentsSection}>
          <button
            className={styles.commentsToggle}
            onClick={() => setShowComments((s) => !s)}
          >
            <MessageCircle size={14} />
            {comments.length} {comments.length === 1 ? "comentario" : "comentarios"}
            {showComments ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {showComments && (
            <div className={styles.commentsList}>
              {comments.map((c) => (
                <Comment key={c.id} comment={c} />
              ))}
            </div>
          )}
        </div>
      )}
    </article>
  );
}

function SkeletonCard() {
  return (
    <div className={styles.skeleton}>
      <div className={`${styles.skeletonAuthor} ${styles.shimmer}`} />
      <div className={styles.skeletonContent}>
        <div className={`${styles.skeletonLine} ${styles.shimmer}`} />
        <div className={`${styles.skeletonLine} ${styles.skeletonLineShort} ${styles.shimmer}`} />
      </div>
      <div className={`${styles.skeletonImage} ${styles.shimmer}`} />
      <div className={`${styles.skeletonMeta} ${styles.shimmer}`} />
    </div>
  );
}

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

export default function Blog() {
  const [posts, setPosts] = useState<FacebookPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useScrollReveal(posts.length);

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

  return (
    <div className={styles.page} ref={containerRef}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <Facebook size={22} color="#fff" />
            </div>
            <div className={styles.headerText}>
              <h1 className={styles.headerTitle}>Nuestras Publicaciones</h1>
              <p className={styles.headerSubtitle}>Espejo de nuestra página oficial de Facebook</p>
            </div>
          </div>
          <a
            href="https://www.facebook.com/Ciudadanos-Pro-Albergue-de-Animales-de-Aguadilla-Inc-147815628577682/"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.fbPageLink}
          >
            <Facebook size={13} />
            <span>Seguirnos</span>
          </a>
        </div>
      </header>

      {/* Feed */}
      <section className={styles.feed}>
        <div className={styles.feedInner}>
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
                href="https://www.facebook.com/Ciudadanos-Pro-Albergue-de-Animales-de-Aguadilla-Inc-147815628577682/"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.fbPageLink}
              >
                Ver en Facebook
              </a>
            </div>
          )}

          {!loading && !error && posts.length > 0 && (
            <div className={styles.feedList}>
              {posts.map((post, i) => (
                <div
                  key={post.id}
                  className={styles.fadeInUp}
                  style={{ transitionDelay: `${Math.min(i * 60, 300)}ms` }}
                >
                  <PostCard post={post} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
