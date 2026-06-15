import React from "react";
import { createRoot } from "react-dom/client";
import { AppShell } from "@crosslog/ui";
import { createDesktopPlatform } from "./platform/createDesktopPlatform";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element #root was not found.");
}

createRoot(rootElement).render(
  <React.StrictMode>
    <AppShell platform={createDesktopPlatform()} />
  </React.StrictMode>,
);

