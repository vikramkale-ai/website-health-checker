const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");

const URLS_FILE = path.join(__dirname, "urls.txt");
const LOG_FILE = path.join(__dirname, "report.log");
const TIMEOUT_MS = 10000;

function checkUrl(rawUrl) {
  return new Promise((resolve) => {
    let url;
    try {
      url = new URL(rawUrl);
    } catch {
      resolve({ url: rawUrl, status: "DOWN", code: null, responseTime: null, error: "Invalid URL" });
      return;
    }

    const lib = url.protocol === "https:" ? https : http;
    const start = Date.now();

    const req = lib.get(
      rawUrl,
      { timeout: TIMEOUT_MS, headers: { "User-Agent": "site-health-checker/1.0" } },
      (res) => {
        const responseTime = Date.now() - start;
        res.resume(); // drain socket
        const up = res.statusCode >= 200 && res.statusCode < 400;
        resolve({ url: rawUrl, status: up ? "UP" : "DOWN", code: res.statusCode, responseTime });
      }
    );

    req.on("timeout", () => {
      req.destroy();
      resolve({ url: rawUrl, status: "DOWN", code: null, responseTime: TIMEOUT_MS, error: "Timeout" });
    });

    req.on("error", (err) => {
      resolve({ url: rawUrl, status: "DOWN", code: null, responseTime: Date.now() - start, error: err.message });
    });
  });
}

function formatResult(result) {
  const ts = new Date().toISOString();
  const code = result.code != null ? `HTTP ${result.code}` : (result.error || "N/A");
  const time = result.responseTime != null ? `${result.responseTime}ms` : "N/A";
  return `[${ts}] ${result.status.padEnd(4)} | ${time.padStart(8)} | ${code.padEnd(10)} | ${result.url}`;
}

async function run() {
  if (!fs.existsSync(URLS_FILE)) {
    console.error(`urls.txt not found at ${URLS_FILE}`);
    process.exit(1);
  }

  const urls = fs
    .readFileSync(URLS_FILE, "utf8")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));

  if (urls.length === 0) {
    console.error("urls.txt is empty or contains only comments.");
    process.exit(1);
  }

  console.log(`Checking ${urls.length} URL(s)...\n`);

  const header =
    `${"=".repeat(80)}\n` +
    `Site Health Check — ${new Date().toISOString()}\n` +
    `${"=".repeat(80)}\n`;

  const lines = [header];

  for (const url of urls) {
    const result = await checkUrl(url);
    const line = formatResult(result);
    console.log(line);
    lines.push(line);
  }

  const summary = buildSummary(
    lines.slice(1).map((l) => l.includes("UP  ") ? "UP" : "DOWN")
  );
  console.log(summary);
  lines.push("", summary, "");

  fs.appendFileSync(LOG_FILE, lines.join("\n") + "\n");
  console.log(`\nReport appended to ${LOG_FILE}`);
}

function buildSummary(statuses) {
  const up = statuses.filter((s) => s === "UP").length;
  const down = statuses.length - up;
  return `\nSummary: ${statuses.length} checked — ${up} UP, ${down} DOWN`;
}

run().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
