import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import AppAI from "./ai/AppAI";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppAI />
  </StrictMode>
);
