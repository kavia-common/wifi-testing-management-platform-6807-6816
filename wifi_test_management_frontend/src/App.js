import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/AppLayout/AppLayout";
import "./App.css";

import DashboardPage from "./pages/DashboardPage";
import ProjectsPage from "./pages/ProjectsPage";
import ProjectDetailsPage from "./pages/ProjectDetailsPage";
import TestCasesPage from "./pages/TestCasesPage";
import TestCaseDetailsPage from "./pages/TestCaseDetailsPage";
import ExecutionsPage from "./pages/ExecutionsPage";
import ExecutionDetailsPage from "./pages/ExecutionDetailsPage";
import ResultsPage from "./pages/ResultsPage";
import ResultDetailsPage from "./pages/ResultDetailsPage";
import SettingsPage from "./pages/SettingsPage";

// PUBLIC_INTERFACE
function App() {
  /**
   * Application entry UI: sets up client-side routes and wraps pages in
   * the global header/sidebar layout.
   *
   * Routes:
   *  - /            Dashboard
   *  - /projects    Projects
   *  - /test-cases  Test Cases
   *  - /executions  Executions
   *  - /results     Results
   *  - /settings    Settings
   */
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:projectId" element={<ProjectDetailsPage />} />
        <Route path="/test-cases" element={<TestCasesPage />} />
        <Route path="/test-cases/:testCaseId" element={<TestCaseDetailsPage />} />
        <Route path="/executions" element={<ExecutionsPage />} />
        <Route path="/executions/:executionId" element={<ExecutionDetailsPage />} />
        <Route path="/results" element={<ResultsPage />} />
        <Route path="/results/:resultId" element={<ResultDetailsPage />} />
        <Route path="/settings" element={<SettingsPage />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
}

export default App;
