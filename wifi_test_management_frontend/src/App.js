import React from "react";
import "./App.css";
import Layout from "./components/layout/Layout";
import Dashboard from "./pages/Dashboard";

// PUBLIC_INTERFACE
function App() {
  return (
    <div className="App">
      <Layout activeNavId="dashboard">
        <Dashboard />
      </Layout>
    </div>
  );
}

export default App;
