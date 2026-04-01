import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT = path.join(ROOT, "assets", "screenshots");
const ROOT_URL = "https://groele.github.io/Scientific-Color-Lab";

function routeUrl(route, search = "") {
  const normalized = route.startsWith("/") ? route : `/${route}`;
  return `${ROOT_URL}/#${normalized}${search}`;
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function save(page, name) {
  await page.screenshot({
    path: path.join(OUTPUT, name),
    fullPage: true,
  });
}

async function dismissWelcome(page) {
  const continueButton = page.getByRole("button", { name: /Continue/i });
  const newPalette = page.getByRole("button", { name: /Create new palette/i });

  try {
    if (await continueButton.isVisible({ timeout: 2500 })) {
      await continueButton.click();
      await page.waitForTimeout(900);
      return;
    }
  } catch {}

  try {
    if (await newPalette.isVisible({ timeout: 2500 })) {
      await newPalette.click();
      await page.waitForTimeout(900);
    }
  } catch {}
}

async function gotoUrl(page, url, timeout = 3500) {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.waitForTimeout(timeout);
}

async function gotoWorkspace(page) {
  await gotoUrl(page, routeUrl("/workspace"), 4500);
  await dismissWelcome(page);
  await page.waitForTimeout(1200);
}

async function captureAnalyzer(page) {
  await gotoUrl(page, routeUrl("/analyzer"), 4500);
  const sampleButton = page.getByRole("button", { name: /Load Example Image/i });
  await sampleButton.click();
  await page.waitForTimeout(3500);
  await page.getByRole("button", { name: /Raw extraction/i }).click();
  await page.waitForTimeout(900);
  await save(page, "analyzer-raw.png");
  await page.getByRole("button", { name: /Scientific reconstruction/i }).click();
  await page.waitForTimeout(900);
  await save(page, "analyzer-scientific.png");
}

async function captureRoutes(page) {
  await gotoUrl(page, routeUrl("/workspace", "?view=templates"), 4200);
  await save(page, "workspace-templates.png");

  await gotoUrl(page, routeUrl("/workspace", "?view=scientific-grid"), 4200);
  await save(page, "workspace-grid.png");

  await gotoUrl(page, routeUrl("/workspace", "?view=pairing"), 4200);
  await save(page, "workspace-pairing.png");

  await gotoUrl(page, routeUrl("/workspace", "?view=swatches"), 4200);
  await save(page, "workspace-diagnostics.png");

  await gotoUrl(page, routeUrl("/library"), 4200);
  await save(page, "library.png");

  await gotoUrl(page, routeUrl("/exports"), 4200);
  await save(page, "exports.png");
}

async function capture() {
  await ensureDir(OUTPUT);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1600, height: 1400 },
    deviceScaleFactor: 2,
    colorScheme: "light",
  });

  await context.addInitScript(() => {
    localStorage.setItem("scientific-color-lab-language", "en");
  });

  const page = await context.newPage();

  await gotoWorkspace(page);
  await save(page, "workspace-main.png");
  await save(page, "shareability.png");

  await captureRoutes(page);
  await captureAnalyzer(page);

  await browser.close();
}

capture().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
