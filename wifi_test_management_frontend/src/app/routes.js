import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import MainLayout from "./layout/MainLayout";
import ProjectsPage from "../features/projects/ProjectsPage";
import TestCasesPage from "../features/testCases/TestCasesPage";
import TestRunsPage from "../features/testRuns/TestRunsPage";
import ResultsPage from "../features/results/ResultsPage";

// PUBLIC_INTERFACE
export function AppRoutes() {
  /** Application routes with shared layout and feature pages. */
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Navigate to="/projects" replace />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/test-cases" element={<TestCasesPage />} />
        <Route path="/test-runs" element={<TestRunsPage />} />
        <Route path="/results" element={<ResultsPage />} />
        <Route path="*" element={<Navigate to="/projects" replace />} />
      </Route>
    </Routes>
  );
}
