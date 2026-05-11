/** Viewport width below which the mobile hamburger menu is used. */
export const MOBILE_BREAKPOINT = 768;

/** Animal names expected on the landing page AnimalsSection (fetched from mock API). */
export const LANDING_PAGE_ANIMALS = ["Fluffy", "Max"] as const;

/** Step titles in the HowItWorks section. */
export const ADOPTION_STEPS = [
  "Explora los Animales",
  "Envía tu Solicitud",
  "Dale la Bienvenida a Casa",
] as const;

/**
 * Fixture animals served by the mock API server (globalSetup.ts).
 * 13 animals ensures the "Load More" button appears (ITEMS_PER_PAGE = 12).
 * Keep in sync with globalSetup.ts — this is the single source of truth.
 */
export const MOCK_ANIMALS = Array.from({ length: 13 }, (_, i) => ({
  aid: i + 1,
  name: i === 0 ? "Fluffy" : i === 1 ? "Max" : `Animal${i + 1}`,
  description: `Test description for animal ${i + 1}`,
  species: i % 2 === 0 ? "dog" : "cat",
  size: "medium",
  gender: "male",
  status: "disponible",
  image_url: "",
  tags: i === 0 ? ["vaccinated", "friendly"] : [],
  created_at: "2024-01-01T00:00:00Z",
  record_id: null as number | null,
}));

/**
 * Fixture posts served by the mock API server (globalSetup.ts).
 * First post is pinned (featured); second is a regular card.
 */
export const MOCK_POSTS = [
  {
    pid: 1,
    header: "Publicación Destacada de Prueba",
    body: "Este es el cuerpo de la publicación destacada.",
    is_pinned: true,
    image_url: null,
    image_object_key: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    pid: 2,
    header: "Segunda Publicación de Prueba",
    body: "Este es el cuerpo de la segunda publicación.",
    is_pinned: false,
    image_url: null,
    image_object_key: null,
    created_at: "2026-01-02T00:00:00Z",
    updated_at: "2026-01-02T00:00:00Z",
  },
];

export const MOCK_MEDICAL_RECORDS_BY_AID: Record<number, Array<{
  record_id: number;
  aid: number;
  record_type: string;
  date_given?: string;
  vet_name?: string;
  notes?: string;
  created_at: string;
}>> = {
  1: [
    {
      record_id: 101,
      aid: 1,
      record_type: "vacunación",
      date_given: "2026-04-14T10:00:00.000Z",
      vet_name: "Dr. Rivera",
      notes: "Primary vaccine",
      created_at: "2026-04-14T10:00:00.000Z",
    },
  ],
};
