import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import AppAI from "./ai/AppAI";
import { TenantProvider } from "./ai/tenant/TenantContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <TenantProvider initialTenantId={null}>
      <AppAI />
    </TenantProvider>
  </StrictMode>
);
