import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";

import DonationModal from "@/components/DonationPage/DonationModal";
import DonationModalTrigger from "@/components/DonationPage/DonationModalTrigger";
import { DEFAULT_MODAL_AMOUNT } from "@/components/DonationPage/donationOptions";

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({
    src,
    alt,
    ...props
  }: {
    src: string | { src: string };
    alt: string;
    [key: string]: unknown;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={typeof src === "string" ? src : src.src}
      alt={alt}
      {...props}
    />
  ),
}));

describe("DonationModal", () => {
  beforeEach(() => {
    document.body.style.overflow = "";
  });

  it("does not render when closed", () => {
    render(
      <DonationModal
        isOpen={false}
        onClose={jest.fn()}
        selectedAmount="$25"
      />,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders the ATH Móvil panel by default and locks body scroll when open", () => {
    render(
      <DonationModal
        isOpen
        onClose={jest.fn()}
        selectedAmount="$25"
      />,
    );

    expect(screen.getByRole("dialog", { hidden: true })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Donación — $25",
        level: 2,
        hidden: true,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Escanea con ATH Móvil",
        level: 3,
        hidden: true,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByAltText("Código QR para donar $25 con ATH Móvil"),
    ).toBeInTheDocument();
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("switches between payment methods", () => {
    render(
      <DonationModal
        isOpen
        onClose={jest.fn()}
        selectedAmount="$50"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "PayPal", hidden: true }));
    expect(
      screen.getByRole("heading", {
        name: "Pagar con PayPal",
        level: 3,
        hidden: true,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Ir a PayPal", hidden: true }),
    ).toHaveAttribute("href", "https://www.paypal.com/donate");
  });

  it("calls onClose from the close button, overlay click, and Escape key", () => {
    const onClose = jest.fn();
    render(
      <DonationModal
        isOpen
        onClose={onClose}
        selectedAmount="$10"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Cerrar modal", hidden: true }));
    fireEvent.click(document.body.lastElementChild as Element);
    fireEvent.keyDown(window, { key: "Escape" });

    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it("restores body scroll when the modal closes", () => {
    const { rerender } = render(
      <DonationModal
        isOpen
        onClose={jest.fn()}
        selectedAmount="$10"
      />,
    );

    expect(document.body.style.overflow).toBe("hidden");

    rerender(
      <DonationModal
        isOpen={false}
        onClose={jest.fn()}
        selectedAmount="$10"
      />,
    );
    expect(document.body.style.overflow).toBe("");

    const secondRender = render(
      <DonationModal
        isOpen
        onClose={jest.fn()}
        selectedAmount="$10"
      />,
    );
    secondRender.unmount();
    expect(document.body.style.overflow).toBe("");
  });
});

describe("DonationModalTrigger", () => {
  it("opens the modal with the default amount and calls onOpen", () => {
    const onOpen = jest.fn();

    render(
      <DonationModalTrigger className="donate-button" onOpen={onOpen}>
        Donar ahora
      </DonationModalTrigger>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Donar ahora" }));

    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("dialog", { hidden: true })).toBeInTheDocument();
    expect(
      screen.getByAltText(
        `Código QR para donar ${DEFAULT_MODAL_AMOUNT} con ATH Móvil`,
      ),
    ).toBeInTheDocument();
  });

  it("passes a custom amount to the modal content", () => {
    render(
      <DonationModalTrigger className="donate-button" amount="$100">
        Donar $100
      </DonationModalTrigger>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Donar $100" }));

    expect(
      screen.getByAltText("Código QR para donar $100 con ATH Móvil"),
    ).toBeInTheDocument();
  });
});
