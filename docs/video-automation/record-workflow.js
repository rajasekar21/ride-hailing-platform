const path = require("path");
const { chromium } = require("playwright");

async function waitForMessage(page, matcher, timeout = 120000) {
  return page.waitForFunction(
    ([messageSelector, messageRegexSource]) => {
      const el = document.querySelector(messageSelector);
      if (!el) return false;
      const text = (el.textContent || "").trim();
      const regex = new RegExp(messageRegexSource, "i");
      return regex.test(text);
    },
    [".message", matcher.source],
    { timeout }
  );
}

async function main() {
  const recordingsDir = path.resolve(__dirname, "../screenshots/videos");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: {
      dir: recordingsDir,
      size: { width: 1440, height: 900 }
    }
  });

  const page = await context.newPage();

  try {
    await page.goto("http://localhost:5173", { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForSelector("h1:has-text('Ride-Hailing Demo Dashboard')", { timeout: 60000 });
    await page.waitForTimeout(500);

    await page.click("button:has-text('Run Full Demo Flow')");
    try {
      await waitForMessage(page, /Demo flow completed for trip #\d+\./i, 90000);
      await page.waitForTimeout(700);
    } catch (_err) {
      await page.waitForTimeout(1000);
    }

    await page.click("button:has-text('2. Rider Page')");
    await page.waitForTimeout(350);
    await page.click("button:has-text('3. Driver Page')");
    await page.waitForTimeout(350);
    await page.click("button:has-text('4. Trip Page')");
    await page.waitForTimeout(350);
    await page.click("button:has-text('5. Payment Page')");
    await page.waitForTimeout(350);
    await page.click("button:has-text('6. Rating Page')");
    await page.waitForTimeout(500);
    await page.click("button:has-text('1. Overview')");
    await page.waitForTimeout(1200);
  } finally {
    await context.close();
    await browser.close();
  }
}

main().catch((error) => {
  console.error("Workflow video recording failed:", error);
  process.exit(1);
});
