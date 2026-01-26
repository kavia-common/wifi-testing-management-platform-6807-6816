import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import App from "./App";
import { ThemeProvider } from "./app/providers/ThemeProvider";
import { ToastProvider } from "./app/components/toast/ToastProvider";

function renderWithProviders(initialEntries) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: 0 } } });
  return render(
    <ThemeProvider>
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={initialEntries}>
          <ToastProvider>
            <App />
          </ToastProvider>
        </MemoryRouter>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

test("routes: /projects renders Projects page header", async () => {
  renderWithProviders(["/projects"]);
  expect(await screen.findByText("Projects")).toBeInTheDocument();
});

test("routes: /test-cases renders Test Cases page header", async () => {
  renderWithProviders(["/test-cases"]);
  expect(await screen.findByText("Test Cases")).toBeInTheDocument();
});

test("routes: /test-runs renders Test Runs page header", async () => {
  renderWithProviders(["/test-runs"]);
  expect(await screen.findByText("Test Runs")).toBeInTheDocument();
});

test("routes: /results renders Results page header", async () => {
  renderWithProviders(["/results"]);
  expect(await screen.findByText("Results")).toBeInTheDocument();
});
