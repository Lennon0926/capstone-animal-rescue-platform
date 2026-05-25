import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AIPetMatch from "@/components/AIPetMatch/aiPetMatch";
import type { PetMatch } from "@/components/AIPetMatch/matchResultCard";
import type { Animal } from "@/types/animal";

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt, ...rest }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...rest} />
  ),
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

jest.mock("@/utils/animalImages", () => ({
  getAnimalImageUrl: () => "/placeholder.jpg",
}));

function makeAnimal(overrides: Partial<Animal> = {}): Animal {
  return {
    aid: 1,
    name: "Buddy",
    description: "A good dog",
    species: "perro",
    size: "mediano",
    gender: "macho",
    status: "disponible",
    image_url: null,
    image_object_key: null,
    tags: [],
    created_at: "2026-01-01T00:00:00Z",
    record_id: null,
    ...overrides,
  };
}

function makeMatch(overrides: Partial<PetMatch> = {}): PetMatch {
  return {
    animal: makeAnimal(),
    score: 0.85,
    matchedAttributes: ["Perro"],
    componentScores: { species: 1, size: 0.8, gender: 0.5, embedding: 0.5 },
    ...overrides,
  };
}

function makeFetchResponse(body: unknown, ok = true) {
  return {
    ok,
    status: ok ? 200 : 503,
    json: () => Promise.resolve(body),
  };
}

function makeApiBody(matches: PetMatch[], alternatives: PetMatch[] = []) {
  return {
    success: true,
    data: matches,
    alternatives,
    threshold: 0.5,
    requestedFields: { species: true, size: false, gender: false },
    promptEcho: VALID_PROMPT,
  };
}

const VALID_PROMPT = "quiero un perro mediano";

beforeEach(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
  // jsdom doesn't implement scrollIntoView — stub it so the results-scroll effect doesn't throw
  window.HTMLElement.prototype.scrollIntoView = jest.fn();
  // Redirect only the component's loading delay (MIN_LOADING_MS=1500 to MAX=3500)
  // to 0 ms so tests don't block, while leaving RTL's own timeouts (≤1000 ms) intact.
  const realSetTimeout = global.setTimeout;
  jest.spyOn(global, "setTimeout").mockImplementation((fn: TimerHandler, delay?: number) => {
    const ms = typeof delay === "number" ? delay : 0;
    const effective = ms >= 1500 ? 0 : ms;
    return realSetTimeout(fn, effective) as unknown as ReturnType<typeof setTimeout>;
  });
  jest.spyOn(global, "requestAnimationFrame").mockImplementation((cb) => {
    cb(0);
    return 0;
  });
  global.fetch = jest.fn();
  process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost:4000";
});

afterEach(() => {
  jest.restoreAllMocks();
});

// ─── Hero form ────────────────────────────────────────────────────────────────

describe("AIPetMatch — hero form", () => {
  it("renders the hero heading", () => {
    render(<AIPetMatch onSkip={jest.fn()} />);
    expect(
      screen.getByRole("heading", { name: /encuentra a tu compañero ideal/i })
    ).toBeInTheDocument();
  });

  it("renders the prompt textarea", () => {
    render(<AIPetMatch onSkip={jest.fn()} />);
    expect(screen.getByLabelText(/describe el animal que buscas/i)).toBeInTheDocument();
  });

  it("submit button is disabled when prompt is empty", () => {
    render(<AIPetMatch onSkip={jest.fn()} />);
    expect(screen.getByRole("button", { name: /encontrar mi mejor match/i })).toBeDisabled();
  });

  it("submit button is disabled when prompt is too short (< 3 chars)", async () => {
    render(<AIPetMatch onSkip={jest.fn()} />);
    await userEvent.type(screen.getByLabelText(/describe el animal que buscas/i), "ab");
    expect(screen.getByRole("button", { name: /encontrar mi mejor match/i })).toBeDisabled();
  });

  it("submit button is enabled when prompt meets minimum length", async () => {
    render(<AIPetMatch onSkip={jest.fn()} />);
    await userEvent.type(screen.getByLabelText(/describe el animal que buscas/i), VALID_PROMPT);
    expect(screen.getByRole("button", { name: /encontrar mi mejor match/i })).not.toBeDisabled();
  });

  it("shows validation error when submitted with a too-short prompt", () => {
    render(<AIPetMatch onSkip={jest.fn()} />);
    fireEvent.change(screen.getByLabelText(/describe el animal que buscas/i), {
      target: { value: "ab" },
    });
    fireEvent.submit(screen.getByLabelText(/describe el animal que buscas/i).closest("form")!);
    expect(screen.getByRole("alert")).toHaveTextContent(/mínimo/i);
  });

  it("calls onSkip when 'Ver todos los animales' is clicked", async () => {
    const onSkip = jest.fn();
    render(<AIPetMatch onSkip={onSkip} />);
    await userEvent.click(screen.getByRole("button", { name: /ver todos los animales/i }));
    expect(onSkip).toHaveBeenCalledTimes(1);
  });
});

// ─── Loading state ────────────────────────────────────────────────────────────

describe("AIPetMatch — loading state", () => {
  it("shows loading panel while the request is in flight", async () => {
    let resolveResponse!: (v: unknown) => void;
    (global.fetch as jest.Mock).mockReturnValue(
      new Promise((res) => {
        resolveResponse = res;
      })
    );

    render(<AIPetMatch onSkip={jest.fn()} />);
    fireEvent.change(screen.getByLabelText(/describe el animal que buscas/i), {
      target: { value: VALID_PROMPT },
    });
    await userEvent.click(screen.getByRole("button", { name: /encontrar mi mejor match/i }));

    expect(screen.getByRole("status")).toBeInTheDocument();

    // Resolve so the component can settle cleanly (results view, not empty state)
    resolveResponse(makeFetchResponse(makeApiBody([makeMatch()])));
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: /tus mejores matches/i })).toBeInTheDocument()
    );
  });
});

// ─── Results ──────────────────────────────────────────────────────────────────

describe("AIPetMatch — results", () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockResolvedValue(makeFetchResponse(makeApiBody([makeMatch()])));
  });

  async function submitAndWaitForResults() {
    fireEvent.change(screen.getByLabelText(/describe el animal que buscas/i), {
      target: { value: VALID_PROMPT },
    });
    await userEvent.click(screen.getByRole("button", { name: /encontrar mi mejor match/i }));
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: /tus mejores matches/i })).toBeInTheDocument()
    );
  }

  it("shows results section after a successful response", async () => {
    render(<AIPetMatch onSkip={jest.fn()} />);
    await submitAndWaitForResults();
  });

  it("shows the top match animal name in the hero card", async () => {
    render(<AIPetMatch onSkip={jest.fn()} />);
    await submitAndWaitForResults();
    expect(screen.getByText("Buddy")).toBeInTheDocument();
  });

  it("shows footer action buttons in results view", async () => {
    render(<AIPetMatch onSkip={jest.fn()} />);
    await submitAndWaitForResults();
    expect(screen.getByRole("button", { name: /ajustar preferencias/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ver todos los animales/i })).toBeInTheDocument();
  });

  it("clicking 'Ajustar preferencias' returns to the hero form", async () => {
    render(<AIPetMatch onSkip={jest.fn()} />);
    await submitAndWaitForResults();
    await userEvent.click(screen.getByRole("button", { name: /ajustar preferencias/i }));
    expect(
      screen.getByRole("heading", { name: /encuentra a tu compañero ideal/i })
    ).toBeInTheDocument();
  });

  it("renders secondary match cards when multiple matches are returned", async () => {
    const second = makeMatch({ animal: makeAnimal({ aid: 2, name: "Milo" }) });
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      makeFetchResponse(makeApiBody([makeMatch(), second]))
    );
    render(<AIPetMatch onSkip={jest.fn()} />);
    await submitAndWaitForResults();
    expect(screen.getByText("Milo")).toBeInTheDocument();
  });

  it("renders the alternatives section when alternatives are returned", async () => {
    const alt = makeMatch({ animal: makeAnimal({ aid: 3, name: "Felix" }), score: 0.3 });
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      makeFetchResponse(makeApiBody([makeMatch()], [alt]))
    );
    render(<AIPetMatch onSkip={jest.fn()} />);
    await submitAndWaitForResults();
    expect(screen.getByText(/otros animales que también podrían gustarte/i)).toBeInTheDocument();
    expect(screen.getByText("Felix")).toBeInTheDocument();
  });
});

// ─── Empty state ──────────────────────────────────────────────────────────────

describe("AIPetMatch — empty state", () => {
  it("shows the empty state when API returns no matches", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(makeFetchResponse(makeApiBody([])));
    render(<AIPetMatch onSkip={jest.fn()} />);
    fireEvent.change(screen.getByLabelText(/describe el animal que buscas/i), {
      target: { value: VALID_PROMPT },
    });
    await userEvent.click(screen.getByRole("button", { name: /encontrar mi mejor match/i }));
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: /no encontramos animales/i })).toBeInTheDocument()
    );
  });
});

// ─── Error states ─────────────────────────────────────────────────────────────

describe("AIPetMatch — error states", () => {
  async function submitAndWaitForAlert() {
    fireEvent.change(screen.getByLabelText(/describe el animal que buscas/i), {
      target: { value: VALID_PROMPT },
    });
    await userEvent.click(screen.getByRole("button", { name: /encontrar mi mejor match/i }));
    return waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
  }

  it("shows the API error message on a non-ok response", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      makeFetchResponse({ success: false, error: { message: "Servicio no disponible" } }, false)
    );
    render(<AIPetMatch onSkip={jest.fn()} />);
    await submitAndWaitForAlert();
    expect(screen.getByRole("alert")).toHaveTextContent("Servicio no disponible");
  });

  it("shows fallback error when fetch throws", async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error("Network failure"));
    render(<AIPetMatch onSkip={jest.fn()} />);
    await submitAndWaitForAlert();
    expect(screen.getByRole("alert")).toHaveTextContent(/no pudimos conectarnos/i);
  });

  it("shows fallback error on success:false response without an error field", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(makeFetchResponse({ success: false }, true));
    render(<AIPetMatch onSkip={jest.fn()} />);
    await submitAndWaitForAlert();
    expect(screen.getByRole("alert")).toHaveTextContent(/no pudimos procesar/i);
  });
});
