import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/AppLayout/AppLayout";
import "./App.css";

import DashboardPage from "./pages/DashboardPage";
import ProjectsPage from "./pages/ProjectsPage";
import TestCasesPage from "./pages/TestCasesPage";
import ExecutionsPage from "./pages/ExecutionsPage";
import ResultsPage from "./pages/ResultsPage";
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
        <Route path="/test-cases" element={<TestCasesPage />} />
        <Route path="/executions" element={<ExecutionsPage />} />
        <Route path="/results" element={<ResultsPage />} />
        <Route path="/settings" element={<SettingsPage />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
}

export default App;
