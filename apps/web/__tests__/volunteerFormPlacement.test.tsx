/* eslint-disable @next/next/no-img-element */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

import Footer from "@/components/Footer/footerSection";
import Header from "@/components/Header/headerSection";
import RecommendationsPage from "@/components/RecommendationsPage/recommendationsPage";

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({
    src,
    alt,
    ...props
  }: {
    src: string | { src: string };
    alt: string;
    fill?: boolean;
    priority?: boolean;
    [key: string]: unknown;
  }) => {
    const { fill, priority, ...imgProps } = props;

    void fill;
    void priority;

    return <img src={typeof src === "string" ? src : src.src} alt={alt} {...imgProps} />;
  },
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
    <a href={typeof href === "string" ? href : (href.pathname ?? "")} {...props}>
      {children}
    </a>
  ),
}));

jest.mock("@/components/DonationPage/DonationModalTrigger", () => ({
  __esModule: true,
  default: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <button className={className} type="button">
      {children}
    </button>
  ),
}));

describe("volunteer form placement", () => {
  const formUrl = "https://docs.google.com/forms/d/e/example/viewform";
  const originalEnv = process.env.NEXT_PUBLIC_VOLUNTEER_GOOGLE_FORM_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_VOLUNTEER_GOOGLE_FORM_URL = formUrl;
  });

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.NEXT_PUBLIC_VOLUNTEER_GOOGLE_FORM_URL;
    } else {
      process.env.NEXT_PUBLIC_VOLUNTEER_GOOGLE_FORM_URL = originalEnv;
    }
  });

  it("shows volunteer form actions on the recommendations page", () => {
    render(<RecommendationsPage />);

    expect(screen.getByRole("heading", { name: "Hazte voluntario", level: 2 })).toBeInTheDocument();
    expect(screen.getByText("Voluntariado", { selector: "h3" })).toBeInTheDocument();

    expect(screen.getByRole("link", { name: "Formulario de voluntariado" })).toHaveAttribute(
      "href",
      formUrl
    );
    expect(
      screen.getByRole("link", { name: "Completa el formulario de voluntariado" })
    ).toHaveAttribute("href", formUrl);
    expect(screen.getByRole("link", { name: "Ser voluntario" })).toHaveAttribute("href", formUrl);
  });

  it("shows volunteer form links in the shared header and footer", () => {
    render(
      <>
        <Header />
        <Footer />
      </>
    );

    expect(screen.getByRole("link", { name: "Voluntariado" })).toHaveAttribute("href", formUrl);
    expect(screen.getByRole("link", { name: "Ser voluntario" })).toHaveAttribute("href", formUrl);
  });
});
