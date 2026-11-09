import { readFile, readdir } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);
const directory = new URL("../packages/data/src/archive/", import.meta.url);
const source = (
  await Promise.all(
    (await readdir(directory))
      .filter((name) => name.endsWith(".ts"))
      .map((name) => readFile(new URL(name, directory), "utf8")),
  )
).join("\n");
const links = new Map();
for (const match of source.matchAll(
  /(thumbnail|nasaUrl):\s*["'](https[^"']+)["']/g,
)) {
  links.set(match[2], match[1]);
}
if (!links.size) throw new Error("No archive links found in the catalog.");
const queue = [...links];
const failures = [];
let checked = 0;

async function worker() {
  while (queue.length) {
    const [url, kind] = queue.shift();
    try {
      const { stdout } = await run("curl", [
        "--location",
        "--silent",
        "--show-error",
        "--max-time",
        "30",
        "--output",
        "/dev/null",
        "--write-out",
        "%{http_code}|%{content_type}",
        url,
      ]);
      const [status, contentType] = stdout.split("|");
      const expectedType = kind === "thumbnail" ? "image/" : "text/html";
      if (status !== "200" || !contentType.startsWith(expectedType)) {
        failures.push(`${status} ${contentType}: ${url}`);
      }
    } catch (error) {
      failures.push(`${url}: ${error.message}`);
    }
    checked++;
  }
}

await Promise.all(Array.from({ length: 8 }, worker));
console.log(`Checked ${checked} unique archive mission and image URLs.`);
if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log("All URLs returned HTTP 200 with the expected content type.");
}
