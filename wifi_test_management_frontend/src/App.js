import React from "react";
import { AppRoutes } from "./app/routes";

/**
 * Root app component. Rendering is delegated to the router config.
 * The providers and Router are configured in src/index.js.
 */
// PUBLIC_INTERFACE
function App() {
  /** Root application component (UI only; providers are wired in index.js). */
  return <AppRoutes />;
}

export default App;
