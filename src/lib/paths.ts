import { documentDir, join } from "@tauri-apps/api/path";

export async function getDefaultOutputPath(): Promise<string> {
  return await documentDir();
}

export async function getDefaultBackupPath(): Promise<string> {
  const docDir = await documentDir();
  return await join(docDir, "cortex", "backups");
}
