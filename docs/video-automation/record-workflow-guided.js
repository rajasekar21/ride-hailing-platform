const path = require("path");
const { chromium } = require("playwright");

async function clickAndHold(page, selector, holdMs = 1800) {
  await page.waitForSelector(selector, { timeout: 30000 });
  await page.click(selector);
  await page.waitForTimeout(holdMs);
}

async function main() {
  const recordingsDir = path.resolve(__dirname, "../screenshots/videos");
  const browser = await chromium.launch({ headless: false, slowMo: 120 });
  const context = await browser.newContext({
    viewport: { width: 1600, height: 900 },
    recordVideo: { dir: recordingsDir, size: { width: 1600, height: 900 } }
  });
  const page = await context.newPage();

  try {
    await page.goto("http://localhost:5173", { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForSelector("h1:has-text('Ride-Hailing Demo Dashboard')", { timeout: 60000 });
    await page.waitForTimeout(2500);

    await clickAndHold(page, "button:has-text('1. Overview')", 2500);
    await clickAndHold(page, "button:has-text('2. Rider Page')", 2200);
    await clickAndHold(page, "button:has-text('3. Driver Page')", 2200);
    await clickAndHold(page, "button:has-text('4. Trip Page')", 2200);
    await clickAndHold(page, "button:has-text('5. Payment Page')", 2200);
    await clickAndHold(page, "button:has-text('6. Rating Page')", 2200);

    await clickAndHold(page, "button:has-text('1. Overview')", 2600);
    await clickAndHold(page, "button:has-text('Refresh Dashboard')", 2200);

    await clickAndHold(page, "button:has-text('4. Trip Page')", 1800);
    await clickAndHold(page, "button:has-text('5. Payment Page')", 1800);
    await clickAndHold(page, "button:has-text('6. Rating Page')", 2200);
    await clickAndHold(page, "button:has-text('1. Overview')", 3500);
  } finally {
    await context.close();
    await browser.close();
  }
}

main().catch((error) => {
  console.error("Guided workflow recording failed:", error);
  process.exit(1);
});
