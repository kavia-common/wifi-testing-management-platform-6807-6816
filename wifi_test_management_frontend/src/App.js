import React from "react";
import "./App.css";
import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/layout/Layout";

import Dashboard from "./pages/Dashboard";
import ProjectsList from "./pages/projects/ProjectsList";
import ProjectDetail from "./pages/projects/ProjectDetail";
import CreateProject from "./pages/projects/CreateProject";
import EditProject from "./pages/projects/EditProject";
import TestCasesList from "./pages/testCases/TestCasesList";
import TestCaseDetail from "./pages/testCases/TestCaseDetail";
import CreateTestCase from "./pages/testCases/CreateTestCase";
import EditTestCase from "./pages/testCases/EditTestCase";
import ExecutionsList from "./pages/executions/ExecutionsList";
import ExecutionDetail from "./pages/executions/ExecutionDetail";
import CreateExecution from "./pages/executions/CreateExecution";
import ResultsList from "./pages/results/ResultsList";
import ResultDetail from "./pages/results/ResultDetail";

// PUBLIC_INTERFACE
function App() {
  /** Root application component that defines client-side routes. */
  return (
    <div className="App">
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route path="/dashboard" element={<Dashboard />} />

          <Route path="/projects" element={<ProjectsList />} />
          <Route path="/projects/new" element={<CreateProject />} />
          <Route path="/projects/:projectId/edit" element={<EditProject />} />
          <Route path="/projects/:projectId" element={<ProjectDetail />} />

          <Route path="/test-cases" element={<TestCasesList />} />
          <Route path="/test-cases/new" element={<CreateTestCase />} />
          <Route
            path="/projects/:projectId/test-cases/new"
            element={<CreateTestCase />}
          />
          <Route path="/test-cases/:testCaseId/edit" element={<EditTestCase />} />
          <Route path="/test-cases/:testCaseId" element={<TestCaseDetail />} />

          <Route path="/executions" element={<ExecutionsList />} />
          <Route path="/executions/new" element={<CreateExecution />} />
          <Route path="/executions/:executionId" element={<ExecutionDetail />} />

          <Route path="/results" element={<ResultsList />} />
          <Route path="/results/:resultId" element={<ResultDetail />} />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Layout>
    </div>
  );
}

export default App;
