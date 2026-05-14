/**
 * Tests for lib/imageCompressor.ts
 * jsdom does not implement Canvas/toBlob, so we mock those APIs.
 */

// ── Canvas / URL mocks ────────────────────────────────────────────────────────

const mockToBlob = jest.fn();
const mockDrawImage = jest.fn();
const mockGetContext = jest.fn(() => ({ drawImage: mockDrawImage }));

// Mock HTMLCanvasElement
class MockCanvas {
  width = 0;
  height = 0;
  toBlob = mockToBlob;
  getContext = mockGetContext;
}

// Mock HTMLImageElement
class MockImage {
  naturalWidth = 800;
  naturalHeight = 600;
  private _src = "";
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  get src(): string {
    return this._src;
  }
  set src(value: string) {
    this._src = value;
    Promise.resolve().then(() => this.onload?.());
  }
}

// Patch global DOM APIs
beforeAll(() => {
  Object.defineProperty(global, "HTMLCanvasElement", { value: MockCanvas, writable: true });
  (global.document as Partial<Document>).createElement = jest.fn((tag: string) => {
    if (tag === "canvas") return new MockCanvas() as unknown as HTMLCanvasElement;
    // fall back for other tags
    return { tagName: tag } as unknown as HTMLElement;
  }) as typeof document.createElement;

  // @ts-expect-error — jsdom doesn't expose Image as a mutable global
  global.Image = MockImage;

  global.URL.createObjectURL = jest.fn(() => "blob:test-url");
  global.URL.revokeObjectURL = jest.fn();
});

import { compressIfNeeded } from "@/lib/imageCompressor";

function makeFile(sizeBytes: number, name = "photo.jpg", type = "image/jpeg"): File {
  const buffer = new Uint8Array(sizeBytes).fill(0);
  return new File([buffer], name, { type });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("compressIfNeeded", () => {
  it("returns the original file when it is already under maxBytes", async () => {
    const file = makeFile(500);
    const result = await compressIfNeeded(file, 1024);
    expect(result).toBe(file);
  });

  it("calls URL.createObjectURL for large files", async () => {
    const smallBlob = new Blob([new Uint8Array(100)], { type: "image/jpeg" });
    // toBlob resolves with a small blob on first binary-search step
    mockToBlob.mockImplementation((callback: (b: Blob | null) => void) => callback(smallBlob));

    const largeFile = makeFile(2000);
    await compressIfNeeded(largeFile, 1000);
    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:test-url");
  });

  it("returns a compressed File when toBlob succeeds under maxBytes", async () => {
    const smallBlob = new Blob([new Uint8Array(200)], { type: "image/jpeg" });
    mockToBlob.mockImplementation((callback: (b: Blob | null) => void) => callback(smallBlob));

    const largeFile = makeFile(2000, "big.jpg");
    const result = await compressIfNeeded(largeFile, 1000);
    expect(result).not.toBe(largeFile);
    expect(result.type).toBe("image/jpeg");
    expect(result.name).toMatch(/\.jpg$/);
  });

  it("throws when compressed blob still exceeds maxBytes", async () => {
    // Always return a blob larger than maxBytes
    const tooBigBlob = new Blob([new Uint8Array(5000)], { type: "image/jpeg" });
    mockToBlob.mockImplementation((callback: (b: Blob | null) => void) => callback(tooBigBlob));

    const file = makeFile(6000);
    await expect(compressIfNeeded(file, 100)).rejects.toThrow(/comprimirse|límite/i);
  });

  it("uses fallback blob (lo=0.1) when binary search never fits", async () => {
    let callCount = 0;
    // First 8 iterations: too big. Last call (fallback at 0.1): small
    mockToBlob.mockImplementation((callback: (b: Blob | null) => void) => {
      callCount++;
      if (callCount <= 8) {
        callback(new Blob([new Uint8Array(5000)], { type: "image/jpeg" }));
      } else {
        callback(new Blob([new Uint8Array(50)], { type: "image/jpeg" }));
      }
    });

    const file = makeFile(6000);
    const result = await compressIfNeeded(file, 200);
    expect(result.type).toBe("image/jpeg");
  });

  it("throws when toBlob returns null (canvas failure)", async () => {
    mockToBlob.mockImplementation((callback: (b: Blob | null) => void) => callback(null));
    const file = makeFile(2000);
    await expect(compressIfNeeded(file, 100)).rejects.toThrow(/toBlob failed/i);
  });
});
