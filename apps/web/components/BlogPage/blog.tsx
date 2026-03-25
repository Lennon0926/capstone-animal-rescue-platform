"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Facebook, ExternalLink, Calendar, RefreshCw, MessageCircle, ChevronDown, ChevronUp } from "lucide-react";
import type { FacebookPost, FacebookComment } from "@/pages/api/facebook-posts";
import styles from "./blog.module.css";

const TRUNCATE_LENGTH = 280;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-PR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
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

function PostCard({ post }: { post: FacebookPost }) {
  const [expanded, setExpanded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const text = post.message ?? post.story ?? "";
  const isTruncated = text.length > TRUNCATE_LENGTH;
  const displayText =
    expanded || !isTruncated ? text : text.slice(0, TRUNCATE_LENGTH) + "…";
  const comments = post.comments?.data ?? [];

  return (
    <article className={styles.card}>
      {post.full_picture && (
        <div className={styles.cardImage}>
          <Image
            src={post.full_picture}
            alt="Publicación de Facebook"
            fill
            style={{ objectFit: "cover" }}
            sizes="(max-width: 720px) 100vw, 680px"
            unoptimized
          />
        </div>
      )}
      <div className={styles.cardBody}>
        {text && (
          <p className={styles.cardText}>
            {displayText}
            {isTruncated && (
              <button
                className={styles.expandBtn}
                onClick={() => setExpanded((e) => !e)}
              >
                {expanded ? " Ver menos" : " Ver más"}
              </button>
            )}
          </p>
        )}
        <div className={styles.cardFooter}>
          <span className={styles.cardDate}>
            <Calendar size={13} />
            {formatDate(post.created_time)}
          </span>
          <a
            href={post.permalink_url}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.cardLink}
          >
            Ver en Facebook
            <ExternalLink size={13} />
          </a>
        </div>

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
      </div>
    </article>
  );
}

function SkeletonCard() {
  return (
    <div className={styles.skeleton}>
      <div className={`${styles.skeletonImage} ${styles.shimmer}`} />
      <div className={styles.skeletonBody}>
        <div className={`${styles.skeletonLine} ${styles.shimmer}`} />
        <div className={`${styles.skeletonLine} ${styles.skeletonLineShort} ${styles.shimmer}`} />
        <div className={`${styles.skeletonMeta} ${styles.shimmer}`} />
      </div>
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
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
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
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={`${styles.fbBadge} ${styles.fadeInUp}`}>
            <Facebook size={20} />
            <span>Feed de Facebook</span>
          </div>
          <h1 className={`${styles.heroTitle} ${styles.fadeInUp}`}>
            Nuestras Publicaciones
          </h1>
          <p className={`${styles.heroSubtitle} ${styles.fadeInUp}`}>
            Mantente al día con las últimas noticias, rescates y eventos de
            Ciudadanos Pro Albergue de Animales de Aguadilla.
          </p>
          <a
            href="https://www.facebook.com/Ciudadanos-Pro-Albergue-de-Animales-de-Aguadilla-Inc-147815628577682/"
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.fbPageLink} ${styles.fadeInUp}`}
          >
            <Facebook size={16} />
            Seguirnos en Facebook
          </a>
        </div>
      </section>

      {/* Feed */}
      <section className={styles.feed}>
        <div className={styles.feedInner}>
          {loading && (
            <div className={styles.feedList}>
              {Array.from({ length: 3 }).map((_, i) => (
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
              <Facebook size={48} />
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
                  style={{ transitionDelay: `${Math.min(i * 80, 400)}ms` }}
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
