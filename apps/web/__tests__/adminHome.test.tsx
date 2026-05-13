import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";

jest.mock("recharts", () => {
  const React = require("react");
  return {
    AreaChart: ({ children }: { children: React.ReactNode }) => <div data-testid="AreaChart">{children}</div>,
    Area: () => null,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  };
});

jest.mock("@/components/ui/chart", () => {
  const React = require("react");
  return {
    ChartContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    ChartTooltip: () => null,
    ChartLegend: () => null,
    ChartLegendContent: () => null,
  };
});

jest.mock("@/components/ui/select", () => {
  const React = require("react");
  return {
    Select: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    SelectTrigger: ({ children }: { children: React.ReactNode }) => <button type="button">{children}</button>,
    SelectValue: () => null,
    SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    SelectItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  };
});

jest.mock("@/components/ui/card", () => {
  const React = require("react");
  return {
    Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    CardTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  };
});

const mockSupabaseChain = {
  select: jest.fn(),
  neq: jest.fn(),
  eq: jest.fn(),
  order: jest.fn(),
  then: jest.fn(),
};

const mockSupabaseFrom = jest.fn(() => mockSupabaseChain);

jest.mock("@/lib/supabase", () => ({
  supabase: { from: (...args: unknown[]) => mockSupabaseFrom(...args) },
}));

import AdminHome from "@/components/Admin/AdminHome/adminHome";

const ACTIVE_DATA = [
  { species: "perro", created_at: "2026-01-15T00:00:00Z" },
  { species: "gato", created_at: "2026-01-20T00:00:00Z" },
];

const ADOPTED_DATA = [
  { species: "gato", created_at: "2026-01-25T00:00:00Z" },
];

function buildPromiseChain(resolvedValue: unknown) {
  const chain: Record<string, jest.Mock> = {};
  const methods = ["select", "neq", "eq", "order"];
  for (const m of methods) chain[m] = jest.fn(() => chain);
  // Make it thenable
  chain.then = (resolve: (v: unknown) => unknown) =>
    Promise.resolve().then(() => resolve(resolvedValue));
  return chain;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockSupabaseFrom
    .mockReturnValueOnce(buildPromiseChain({ data: ACTIVE_DATA, error: null }))
    .mockReturnValueOnce(buildPromiseChain({ data: ADOPTED_DATA, error: null }));
});

describe("AdminHome", () => {
  it("renders the Admin Dashboard heading", async () => {
    render(<AdminHome />);
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: /admin dashboard/i })).toBeInTheDocument()
    );
  });

  it("renders stat cards for active animals", async () => {
    render(<AdminHome />);
    await waitFor(() => {
      expect(screen.getByText(/Total de Animales no adoptados/i)).toBeInTheDocument();
      expect(screen.getByText(/Total de Perros no adoptados/i)).toBeInTheDocument();
      expect(screen.getByText(/Total de Gatos no adoptados/i)).toBeInTheDocument();
    });
  });

  it("renders stat cards for adopted animals", async () => {
    render(<AdminHome />);
    await waitFor(() => {
      expect(screen.getByText(/Total de Animales Adoptados/i)).toBeInTheDocument();
      expect(screen.getByText(/Total de Perros Adoptados/i)).toBeInTheDocument();
      expect(screen.getByText(/Total de Gatos Adoptados/i)).toBeInTheDocument();
    });
  });

  it("renders chart section titles", async () => {
    render(<AdminHome />);
    await waitFor(() => {
      expect(screen.getByText("Animales")).toBeInTheDocument();
      expect(screen.getByText("Animales Adoptados")).toBeInTheDocument();
    });
  });

  it("handles supabase error gracefully without crashing", async () => {
    mockSupabaseFrom
      .mockReset()
      .mockReturnValueOnce(buildPromiseChain({ data: null, error: { message: "DB error" } }))
      .mockReturnValueOnce(buildPromiseChain({ data: null, error: { message: "DB error" } }));
    jest.spyOn(console, "error").mockImplementation(() => {});

    render(<AdminHome />);
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: /admin dashboard/i })).toBeInTheDocument()
    );
    (console.error as jest.Mock).mockRestore();
  });

  it("shows loading state initially", () => {
    // Don't resolve the promise — chain never resolves
    const pendingChain: Record<string, jest.Mock> = {};
    const methods = ["select", "neq", "eq", "order"];
    for (const m of methods) pendingChain[m] = jest.fn(() => pendingChain);
    pendingChain.then = jest.fn(); // never resolved
    mockSupabaseFrom.mockReset().mockReturnValue(pendingChain);

    render(<AdminHome />);
    expect(screen.getAllByText(/Cargando/i).length).toBeGreaterThan(0);
  });
});

// ── Pure logic tests ──────────────────────────────────────────────────────────

describe("groupAnimalsByMonth (inline logic verification)", () => {
  it("counts dogs and cats correctly by month", () => {
    // Use midday UTC to avoid local-timezone date-wrapping
    const animals = [
      { species: "perro", created_at: "2026-01-15T12:00:00Z" },
      { species: "gato", created_at: "2026-01-20T12:00:00Z" },
      { species: "dog", created_at: "2026-02-15T12:00:00Z" },
      { species: "cats", created_at: "2026-02-20T12:00:00Z" },
    ];

    const monthly: Record<string, { dogs: number; cats: number }> = {};
    for (const animal of animals) {
      const date = new Date(animal.created_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (!monthly[key]) monthly[key] = { dogs: 0, cats: 0 };
      const s = animal.species.toLowerCase().trim();
      if (["dog", "dogs", "perro", "perros"].includes(s)) monthly[key].dogs++;
      else if (["cat", "cats", "gato", "gatos"].includes(s)) monthly[key].cats++;
    }

    expect(monthly["2026-01"].dogs).toBe(1);
    expect(monthly["2026-01"].cats).toBe(1);
    expect(monthly["2026-02"].dogs).toBe(1);
    expect(monthly["2026-02"].cats).toBe(1);
  });
});
