import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Auth0Provider } from "@auth0/auth0-react";

import App from "./App.jsx";
import { ToastProvider } from "./context/ToastContext";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Auth0Provider
      domain="dev-6gsuvu6jyvn03yhf.us.auth0.com"
      clientId="ezyTE9XxxLRCNqBqZ7oRZM2884dWBaHM"
      authorizationParams={{
        redirect_uri: window.location.origin,
      }}
    >
      <ToastProvider>
        <App />
      </ToastProvider>
    </Auth0Provider>
  </StrictMode>
);