import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { getDb } from "./lib/db";
import { BackupService } from "./lib/backup-service";
import { checkForUpdates } from "./lib/update";

try {
  await getDb();
  await BackupService.init();
  await checkForUpdates();
} catch (e) {
  console.error("Initialization failed:", e);
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
