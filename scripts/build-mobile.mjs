import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { renderWebManifest } from "./grok-pwa-shared.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const config = JSON.parse(readFileSync(join(root, "capacitor.config.json"), "utf8"));
if (
  config.appId !== "au.kyrec.familyguardian" ||
  config.webDir !== "dist/mobile" ||
  config.server?.url ||
  config.server?.cleartext !== false ||
  config.server?.allowNavigation?.length
) {
  throw new Error("Mobile packaging must use the approved identity and bundled local assets.");
}

const result = spawnSync(
  process.execPath,
  ["scripts/with-app-env.mjs", process.execPath, "node_modules/vite/bin/vite.js", "build"],
  {
    cwd: root,
    stdio: "inherit",
    env: {
      ...process.env,
      GUARDIAN_MOBILE_BUILD: "1",
      VITE_GUARDIAN_MOBILE_BUILD: "true",
      VITE_AUTH_ENABLED: "true",
    },
  },
);
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);

const source = join(root, ".output", "public");
if (!existsSync(join(source, "index.html"))) {
  throw new Error("Mobile build did not produce its local index.html. Refusing to package.");
}
// The destination is fixed, resolved within this checkout, and never accepts CLI input.
const destination = join(root, "dist", "mobile");
rmSync(destination, { recursive: true, force: true });
mkdirSync(destination, { recursive: true });
cpSync(source, destination, {
  recursive: true,
  filter: (path) => !path.endsWith(".map"),
});
// The server normally supplies this manifest; the device has only local files.
const manifest = JSON.parse(renderWebManifest("localhost"));
manifest.name = config.appName;
manifest.short_name = "Guardian";
mkdirSync(join(destination, "__grok"), { recursive: true });
writeFileSync(join(destination, "__grok", "manifest.webmanifest"), JSON.stringify(manifest));

function verifyAssets(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error("Symlinks must not enter the mobile bundle.");
    if (entry.isDirectory()) verifyAssets(path);
    if (/^\.env(?:\.|$)|\.sqlite$|\.pem$|\.key$|\.map$/i.test(entry.name)) {
      throw new Error(`Server-only or debug file entered the mobile bundle: ${entry.name}`);
    }
  }
}
verifyAssets(destination);
console.log(
  "Guardian mobile assets ready. No website was published. Account API connection remains pending.",
);
