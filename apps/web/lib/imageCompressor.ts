const MAX_DIMENSION = 2560; // cap longest side before quality search

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function drawToCanvas(img: HTMLImageElement): HTMLCanvasElement {
  let { naturalWidth: w, naturalHeight: h } = img;

  if (w > MAX_DIMENSION || h > MAX_DIMENSION) {
    const ratio = Math.min(MAX_DIMENSION / w, MAX_DIMENSION / h);
    w = Math.round(w * ratio);
    h = Math.round(h * ratio);
  }

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
  return canvas;
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Canvas toBlob failed"))),
      "image/jpeg",
      quality
    )
  );
}

/**
 * Compress `file` to fit under `maxBytes`.
 * Returns original file if already small enough.
 * Uses binary search over JPEG quality (0.1–0.92).
 */
export async function compressIfNeeded(file: File, maxBytes: number): Promise<File> {
  if (file.size <= maxBytes) return file;

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(objectUrl);
    const canvas = drawToCanvas(img);

    // Binary search: find highest quality that fits under maxBytes
    let lo = 0.1;
    let hi = 0.92;
    let best: Blob | null = null;

    for (let i = 0; i < 8; i++) {
      const mid = (lo + hi) / 2;
      const blob = await canvasToBlob(canvas, mid);
      if (blob.size <= maxBytes) {
        best = blob;
        lo = mid;
      } else {
        hi = mid;
      }
    }

    // Fallback: lowest quality if binary search never fit
    if (!best) {
      best = await canvasToBlob(canvas, 0.1);
    }

    if (best.size > maxBytes) {
      throw new Error(
        `La imagen no pudo comprimirse por debajo del límite de ${Math.round(maxBytes / 1024 / 1024)} MB. Usa una imagen más pequeña.`
      );
    }

    const ext = file.name.replace(/\.[^.]+$/, "");
    return new File([best], `${ext}.jpg`, { type: "image/jpeg" });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
