import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import Home from "@/pages/home";
import StoriesSection from "@/components/LandingPage/Stories/storiesSection";

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({
    src,
    alt,
    fill: _fill,
    priority: _priority,
    ...props
  }: {
    src: string | { src: string };
    alt: string;
    fill?: boolean;
    priority?: boolean;
    [key: string]: unknown;
  }) => (
    <img
      src={typeof src === "string" ? src : src.src}
      alt={alt}
      {...props}
    />
  ),
}));

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
    <a href={typeof href === "string" ? href : href.pathname ?? ""} {...props}>
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

describe("StoriesSection", () => {
  it("renders the heading and four learn-more cards", () => {
    render(<StoriesSection />);

    expect(
      screen.getByRole("heading", {
        name: "Conoce algunas de nuestras historias",
        level: 2,
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByTestId("story-card")).toHaveLength(4);
    expect(
      screen.getAllByRole("link", { name: "Conocer mas sobre esta historia" }),
    ).toHaveLength(4);
  });

  it("renders after the timeline section on the home page", () => {
    render(<Home animals={[]} />);

    const timelineHeading = screen.getByRole("heading", {
      name: "Nuestra historia",
      level: 2,
    });
    const storiesHeading = screen.getByRole("heading", {
      name: "Conoce algunas de nuestras historias",
      level: 2,
    });

    expect(
      timelineHeading.compareDocumentPosition(storiesHeading) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});
