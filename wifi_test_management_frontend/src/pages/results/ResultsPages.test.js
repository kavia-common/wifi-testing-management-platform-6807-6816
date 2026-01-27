import React from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen, waitFor } from "@testing-library/react";

import ResultsList from "./ResultsList";
import ResultDetail from "./ResultDetail";

// Mock the API hooks and endpoint modules used by Results pages.
jest.mock("../../api", () => {
  const actual = jest.requireActual("../../api");
  return {
    ...actual,
    useApiClient: () => ({}),
    useToast: () => ({ push: jest.fn(), items: [], remove: jest.fn() }),
    notifyApiError: jest.fn(),
    resultsApi: {
      listResults: jest.fn(),
      getResult: jest.fn(),
    },
    projectsApi: {
      getProject: jest.fn(),
    },
    testCasesApi: {
      getTestCase: jest.fn(),
    },
    executionsApi: {
      getExecution: jest.fn(),
    },
  };
});

const api = require("../../api");

function renderAt(route) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path="/results" element={<ResultsList />} />
        <Route path="/results/:resultId" element={<ResultDetail />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("Results pages", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("ResultsList shows empty state when API returns []", async () => {
    api.resultsApi.listResults.mockResolvedValue({ ok: true, data: [] });

    renderAt("/results");

    expect(screen.getByText("Results")).toBeInTheDocument();

    await waitFor(() => {
      expect(api.resultsApi.listResults).toHaveBeenCalledTimes(1);
    });

    // Table empty state title
    expect(screen.getByText("No results yet")).toBeInTheDocument();
  });

  test("ResultDetail renders not-found state when API returns null data", async () => {
    api.resultsApi.getResult.mockResolvedValue({ ok: true, data: null });

    renderAt("/results/r-123");

    await waitFor(() => {
      expect(api.resultsApi.getResult).toHaveBeenCalledWith({}, "r-123");
    });

    expect(screen.getByText("Not found")).toBeInTheDocument();
  });

  test("ResultDetail renders outcome pill when API returns a result", async () => {
    api.resultsApi.getResult.mockResolvedValue({
      ok: true,
      data: {
        id: "r-7001",
        label: "Throughput - 5GHz",
        status: "Pass",
        projectId: "p-001",
        testCaseId: "tc-101",
        executionId: "ex-9001",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });

    api.projectsApi.getProject.mockResolvedValue({ ok: true, data: { id: "p-001", name: "Proj" } });
    api.testCasesApi.getTestCase.mockResolvedValue({
      ok: true,
      data: { id: "tc-101", name: "TC" },
    });
    api.executionsApi.getExecution.mockResolvedValue({
      ok: true,
      data: { id: "ex-9001", label: "Exec" },
    });

    renderAt("/results/r-7001");

    await waitFor(() => {
      expect(screen.getByText("Outcome")).toBeInTheDocument();
    });

    expect(screen.getByText("Pass")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open Project" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open Test Case" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open Execution" })).toBeInTheDocument();
  });
});
