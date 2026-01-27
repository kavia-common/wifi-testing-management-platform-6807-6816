import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App";
import { ApiClientProvider, ToastProvider } from "./api";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <ToastProvider>
      <ApiClientProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ApiClientProvider>
    </ToastProvider>
  </React.StrictMode>
);
