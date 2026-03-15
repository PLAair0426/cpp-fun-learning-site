import { cpSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

function ensureDirectory(directory) {
  mkdirSync(directory, { recursive: true });
}

function syncDirectory(source, target) {
  if (!existsSync(source)) {
    return;
  }

  ensureDirectory(target);
  cpSync(source, target, { recursive: true, force: true });
}

export function prepareStandaloneAssets() {
  const standaloneDir = path.join(rootDir, ".next", "standalone");
  const standaloneServer = path.join(standaloneDir, "server.js");

  if (!existsSync(standaloneServer)) {
    throw new Error("Standalone build not found. Run `npm run build` first.");
  }

  syncDirectory(path.join(rootDir, ".next", "static"), path.join(standaloneDir, ".next", "static"));
  syncDirectory(path.join(rootDir, "public"), path.join(standaloneDir, "public"));

  return { rootDir, standaloneDir, standaloneServer };
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  prepareStandaloneAssets();
}
