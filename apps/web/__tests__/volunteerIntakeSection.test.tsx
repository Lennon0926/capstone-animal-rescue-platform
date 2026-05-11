import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

import VolunteerIntakeSection from "@/components/LandingPage/VolunteerIntake/volunteerIntakeSection";
import Home from "@/pages/home";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    href,
    children,
    ...props
  }: {
    href: string | { pathname?: string };
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={typeof href === "string" ? href : (href.pathname ?? "")} {...props}>
      {children}
    </a>
  ),
}));

beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });

  class IntersectionObserverMock {
    observe = jest.fn();
    unobserve = jest.fn();
    disconnect = jest.fn();
    takeRecords = jest.fn(() => []);
    root = null;
    rootMargin = "";
    thresholds = [];
  }

  Object.defineProperty(window, "IntersectionObserver", {
    writable: true,
    value: IntersectionObserverMock,
  });

  Object.defineProperty(global, "IntersectionObserver", {
    writable: true,
    value: IntersectionObserverMock,
  });
});

describe("VolunteerIntakeSection", () => {
  const originalEnv = process.env.NEXT_PUBLIC_VOLUNTEER_GOOGLE_FORM_URL;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.NEXT_PUBLIC_VOLUNTEER_GOOGLE_FORM_URL;
    } else {
      process.env.NEXT_PUBLIC_VOLUNTEER_GOOGLE_FORM_URL = originalEnv;
    }
  });

  it("renders volunteer intake copy and Google Form CTA", () => {
    process.env.NEXT_PUBLIC_VOLUNTEER_GOOGLE_FORM_URL =
      "https://docs.google.com/forms/d/e/example/viewform";

    render(<VolunteerIntakeSection />);

    expect(
      screen.getByRole("heading", {
        name: "Hazte voluntario",
        level: 2,
      })
    ).toBeInTheDocument();

    const cta = screen.getByRole("link", {
      name: "Completa el formulario de voluntariado",
    });

    expect(cta).toHaveAttribute("href", "https://docs.google.com/forms/d/e/example/viewform");
    expect(cta).toHaveAttribute("target", "_blank");
    expect(cta).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.getByText(/Aunque no puedas ofrecer hogar temporero/i)).toBeInTheDocument();
  });

  it("renders the volunteer opportunity options requested for the intake form", () => {
    process.env.NEXT_PUBLIC_VOLUNTEER_GOOGLE_FORM_URL =
      "https://docs.google.com/forms/d/e/example/viewform";

    render(<VolunteerIntakeSection />);

    [
      "Transportación",
      "Recaudación de fondos",
      "Cuidado animal",
      "Hogar temporero",
      "Eventos",
      "Charlas educativas",
      "Puedo transportar, pero no ofrecer hogar temporero",
      "Todo lo anterior",
    ].forEach((option) => {
      expect(screen.getByText(option)).toBeInTheDocument();
    });
  });

  it("shows an unavailable message instead of a broken link when the form URL is not configured", () => {
    delete process.env.NEXT_PUBLIC_VOLUNTEER_GOOGLE_FORM_URL;

    render(<VolunteerIntakeSection />);

    expect(
      screen.getByText("El formulario de voluntariado no está disponible en este momento.")
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", {
        name: "Completa el formulario de voluntariado",
      })
    ).not.toBeInTheDocument();
  });

  it("renders on the home page after the Get Involved section", () => {
    process.env.NEXT_PUBLIC_VOLUNTEER_GOOGLE_FORM_URL =
      "https://docs.google.com/forms/d/e/example/viewform";

    render(<Home animals={[]} />);

    const getInvolvedHeading = screen.getByRole("heading", {
      name: "Conoce más sobre nuestro trabajo",
      level: 2,
    });
    const volunteerHeading = screen.getByRole("heading", {
      name: "Hazte voluntario",
      level: 2,
    });

    expect(volunteerHeading).toBeInTheDocument();
    expect(
      getInvolvedHeading.compareDocumentPosition(volunteerHeading) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });
});
