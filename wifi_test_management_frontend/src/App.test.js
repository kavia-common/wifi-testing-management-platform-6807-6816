import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "./App";

test("renders dashboard heading", () => {
  render(
    <MemoryRouter initialEntries={["/dashboard"]}>
      <App />
    </MemoryRouter>
  );
  const heading = screen.getByRole("heading", { name: /dashboard/i });
  expect(heading).toBeInTheDocument();
});
