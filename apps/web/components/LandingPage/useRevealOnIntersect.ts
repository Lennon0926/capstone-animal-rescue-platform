import { type RefObject, useEffect } from "react";

const DEFAULT_THRESHOLD = 0.15;
const DEFAULT_ROOT_MARGIN = "0px 0px -40px 0px";

type UseRevealOnIntersectOptions<T extends HTMLElement> = {
  rootRef: RefObject<T | null>;
  selector: string;
  visibleClassName: string;
  threshold?: number;
  rootMargin?: string;
};

export function useRevealOnIntersect<T extends HTMLElement>({
  rootRef,
  selector,
  visibleClassName,
  threshold = DEFAULT_THRESHOLD,
  rootMargin = DEFAULT_ROOT_MARGIN,
}: UseRevealOnIntersectOptions<T>) {
  useEffect(() => {
    const rootElement = rootRef.current;

    if (!rootElement || typeof IntersectionObserver === "undefined") {
      return;
    }

    const revealElements = rootElement.querySelectorAll<HTMLElement>(selector);

    if (revealElements.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          entry.target.classList.add(visibleClassName);
          observer.unobserve(entry.target);
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    revealElements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, [rootRef, rootMargin, selector, threshold, visibleClassName]);
}
