import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

import AccessDeniedScreen from "@/components/Admin/AccessDeniedScreen/accessDenied";

describe("AccessDeniedScreen", () => {
  it("renders denied access copy", () => {
    render(<AccessDeniedScreen />);

    expect(screen.getByRole("heading", { name: "Acceso Denegado" })).toBeInTheDocument();
    expect(
      screen.getByText("No tienes permisos para acceder a esta página."),
    ).toBeInTheDocument();
  });
});
