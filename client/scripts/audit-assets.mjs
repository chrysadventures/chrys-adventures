import fs from "node:fs";
import path from "node:path";

const clientRoot = process.cwd();
const publicRoot = path.join(clientRoot, "public");
const sourceRoot = path.join(clientRoot, "src");
const attachedRoot = path.join(clientRoot, "..", "attached_assets");
const mediaPattern = /\.(?:png|jpe?g|webp|svg|gif|wav|mp3|m4a|ogg)$/i;

function walk(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

function exactPathExists(targetPath) {
  const absolute = path.resolve(targetPath);
  const parsed = path.parse(absolute);
  let current = parsed.root;
  for (const part of absolute.slice(parsed.root.length).split(path.sep).filter(Boolean)) {
    if (!fs.existsSync(current)) return false;
    const match = fs.readdirSync(current).find((entry) => entry === part);
    if (!match) return false;
    current = path.join(current, match);
  }
  return fs.existsSync(current);
}

const sourceFiles = walk(sourceRoot).filter((file) => /\.(?:ts|tsx|js|jsx|css|html)$/i.test(file));
const checks = new Map();

function addCheck(reference, resolvedPath, sourceFile) {
  if (!mediaPattern.test(reference)) return;
  const key = `${resolvedPath}\u0000${sourceFile}`;
  checks.set(key, { reference, resolvedPath, sourceFile });
}

for (const sourceFile of sourceFiles) {
  const text = fs.readFileSync(sourceFile, "utf8");

  for (const match of text.matchAll(/["'`](\/(?:assets|audio)\/[^"'`?#]+\.(?:png|jpe?g|webp|svg|gif|wav|mp3|m4a|ogg))["'`]/gi)) {
    addCheck(match[1], path.join(publicRoot, match[1].slice(1)), sourceFile);
  }
  for (const match of text.matchAll(/["']@assets\/([^"']+\.(?:png|jpe?g|webp|svg|gif))["']/gi)) {
    addCheck(`@assets/${match[1]}`, path.join(attachedRoot, match[1]), sourceFile);
  }
  for (const match of text.matchAll(/["'`]([^/"'`]+\.(?:wav|mp3|m4a|ogg))["'`]/gi)) {
    if (match[1].includes("${")) continue;
    addCheck(`audio/${match[1]}`, path.join(publicRoot, "audio", match[1]), sourceFile);
  }

  const templateBases = [
    ["SPRITE_BASE", path.join(publicRoot, "assets", "sprites")],
    ["AUDIO_BASE", path.join(publicRoot, "audio")],
    ["ADVANCED_AUDIO_BASE", path.join(publicRoot, "audio", "advanced")],
    ["BACKGROUND_BASE", path.join(publicRoot, "assets", "images")],
  ];
  for (const [baseName, basePath] of templateBases) {
    const expression = new RegExp(`\\$\\{${baseName}\\}([^\\x60$]+\\.(?:png|jpe?g|webp|svg|gif|wav|mp3|m4a|ogg))`, "gi");
    for (const match of text.matchAll(expression)) {
      addCheck(`${baseName}/${match[1]}`, path.join(basePath, match[1]), sourceFile);
    }
  }
}

const appSource = path.join(sourceRoot, "App.tsx");
if (fs.existsSync(appSource) && fs.readFileSync(appSource, "utf8").includes("ms-total-${value}-bananas.mp3")) {
  for (let value = 0; value <= 20; value += 1) {
    addCheck(`audio/ms-total-${value}-bananas.mp3`, path.join(publicRoot, "audio", `ms-total-${value}-bananas.mp3`), appSource);
  }
}

const missing = [...checks.values()].filter(({ resolvedPath }) => !exactPathExists(resolvedPath));
if (missing.length) {
  console.error(`Asset audit failed: ${missing.length} missing or case-mismatched reference(s).`);
  for (const item of missing) {
    console.error(`- ${item.reference} in ${path.relative(clientRoot, item.sourceFile)} -> ${path.relative(clientRoot, item.resolvedPath)}`);
  }
  process.exitCode = 1;
} else {
  console.log(`Asset audit passed: ${checks.size} referenced image and audio files exist with exact deployment casing.`);
}
