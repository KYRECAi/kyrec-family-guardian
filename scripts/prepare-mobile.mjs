import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const platform = process.argv[2];
if (!["android", "ios"].includes(platform)) {
  throw new Error("Choose android or ios: npm run mobile:prepare -- android");
}
if (!existsSync(join(root, "dist", "mobile", "index.html"))) {
  throw new Error("Run npm run build:mobile before preparing the native project.");
}
const operation = existsSync(join(root, platform)) ? "sync" : "add";
const result = spawnSync(
  process.execPath,
  ["node_modules/@capacitor/cli/bin/capacitor", operation, platform],
  { cwd: root, stdio: "inherit" },
);
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);

// Only resize the existing approved art to native resource dimensions.
// No character art is generated or redrawn here.
const icon = join(root, "public", "brand", "icon-512.png");
const launch = join(root, "public", "brand", "launch.png");
async function replaceImage(source, destination, size) {
  const dimensions = size ?? (await sharp(destination).metadata());
  await sharp(source)
    .resize(dimensions.width, dimensions.height, { fit: "contain", background: "#050318" })
    .png()
    .toFile(destination);
}
if (platform === "android") {
  const resources = join(root, "android", "app", "src", "main", "res");
  for (const directory of readdirSync(resources, { withFileTypes: true })) {
    if (!directory.isDirectory()) continue;
    for (const filename of readdirSync(join(resources, directory.name))) {
      const destination = join(resources, directory.name, filename);
      if (/^ic_launcher.*\.png$/.test(filename)) await replaceImage(icon, destination);
      if (filename === "splash.png") await replaceImage(launch, destination);
    }
  }
  writeFileSync(
    join(resources, "values", "ic_launcher_background.xml"),
    '<resources><color name="ic_launcher_background">#050318</color></resources>\n',
  );
} else {
  const assets = join(root, "ios", "App", "App", "Assets.xcassets");
  await replaceImage(icon, join(assets, "AppIcon.appiconset", "AppIcon-512@2x.png"), {
    width: 1024,
    height: 1024,
  });
  for (const filename of readdirSync(join(assets, "Splash.imageset"))) {
    if (filename.endsWith(".png"))
      await replaceImage(launch, join(assets, "Splash.imageset", filename));
  }
}
console.log(`Guardian ${platform} project prepared with the existing KYREC artwork.`);
