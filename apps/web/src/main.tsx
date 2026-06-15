import React from "react";
import { createRoot } from "react-dom/client";
import { AppShell } from "@crosslog/ui";
import { createWebPlatform } from "./platform/createWebPlatform";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element #root was not found.");
}

createRoot(rootElement).render(
  <React.StrictMode>
    <AppShell platform={createWebPlatform()} />
  </React.StrictMode>,
);

