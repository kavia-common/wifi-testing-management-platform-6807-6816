import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import App from "./App";

/**
 * These tests intentionally:
 * - Use MemoryRouter so we can control starting routes.
 * - Force "mock mode" so UI remains stable and does not depend on a live backend.
 * - Assert on accessible roles/text that are unlikely to change with styling.
 */

function setMockMode(enabled) {
  // The app's API layer checks localStorage("useMocks") before env vars.
  window.localStorage.setItem("useMocks", enabled ? "true" : "false");
}

describe("App navigation and core page rendering", () => {
  beforeEach(() => {
    setMockMode(true);
  });

  afterEach(() => {
    window.localStorage.removeItem("useMocks");
  });

  test("renders primary navigation links and can navigate to Projects", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>
    );

    // Verify primary nav exists (sidebar has aria-label="Primary navigation")
    const nav = screen.getByLabelText(/primary navigation/i);
    expect(nav).toBeInTheDocument();

    // Verify key nav links exist (use accessible link role)
    expect(screen.getByRole("link", { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /projects/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /test cases/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /executions/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /results/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /settings/i })).toBeInTheDocument();

    // Start route should show Dashboard heading
    expect(
      screen.getByRole("heading", { name: /dashboard/i, level: 1 })
    ).toBeInTheDocument();

    // Navigate to Projects and confirm route content changes.
    await user.click(screen.getByRole("link", { name: /projects/i }));

    expect(
      await screen.findByRole("heading", { name: /projects/i, level: 1 })
    ).toBeInTheDocument();

    // A stable, page-specific control that should exist regardless of data.
    expect(
      screen.getByRole("button", { name: /create project/i })
    ).toBeInTheDocument();
  });

  test("renders the Projects page with core UI elements (mock mode)", async () => {
    render(
      <MemoryRouter initialEntries={["/projects"]}>
        <App />
      </MemoryRouter>
    );

    // Core page identity
    expect(
      await screen.findByRole("heading", { name: /projects/i, level: 1 })
    ).toBeInTheDocument();

    // Controls section (explicit aria-label in the page)
    expect(
      screen.getByRole("region", { name: /projects controls/i })
    ).toBeInTheDocument();

    // Search input from TextInput with ariaLabel="Search projects"
    expect(screen.getByLabelText(/search projects/i)).toBeInTheDocument();

    // Table is a stable structural element even if rows change
    expect(
      screen.getByRole("table", { name: /projects table/i })
    ).toBeInTheDocument();

    // Mock mode indicator should be present when localStorage override is set
    expect(screen.getByText(/mock mode/i)).toBeInTheDocument();
  });
});
