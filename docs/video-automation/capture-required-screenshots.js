const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "..", "..");
const SHOTS_DIR = path.resolve(ROOT, "docs", "screenshots");

function nowIso() {
  return new Date().toISOString();
}

function runCommand(command) {
  try {
    const output = execSync(command, {
      cwd: ROOT,
      stdio: ["ignore", "pipe", "pipe"],
      encoding: "utf8",
      shell: true
    });
    return { ok: true, output };
  } catch (error) {
    const stdout = error.stdout ? String(error.stdout) : "";
    const stderr = error.stderr ? String(error.stderr) : "";
    return {
      ok: false,
      output: `${stdout}\n${stderr}`.trim() || error.message
    };
  }
}

async function screenshotText(page, filename, title, commandOrNote, content) {
  const escaped = String(content || "(no output)")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { margin:0; background:#0f172a; color:#e2e8f0; font-family:Consolas, monospace; }
    .wrap { padding:24px; }
    .title { font-size:20px; font-weight:700; margin-bottom:6px; }
    .meta { color:#94a3b8; margin-bottom:14px; }
    pre { white-space:pre-wrap; word-break:break-word; line-height:1.35; background:#111827; border:1px solid #1f2937; border-radius:8px; padding:16px; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="title">${title}</div>
    <div class="meta">${nowIso()} | ${commandOrNote}</div>
    <pre>${escaped}</pre>
  </div>
</body>
</html>`;
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.setContent(html, { waitUntil: "domcontentloaded" });
  await page.screenshot({ path: path.join(SHOTS_DIR, filename), fullPage: true });
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  const text = await res.text();
  let parsed = text;
  try {
    parsed = JSON.parse(text);
  } catch (_e) {
    // Keep text when not JSON.
  }
  return { status: res.status, body: parsed };
}

function getMetricLines(metricsText) {
  return String(metricsText || "")
    .split("\n")
    .filter((line) =>
      /(trips_requested_total|trips_completed_total|payments_failed_total|avg_driver_rating)/.test(line)
    )
    .join("\n");
}

async function main() {
  fs.mkdirSync(SHOTS_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // 1) Service health screenshots
    const serviceHealth = [
      { file: "service-user-health.png", url: "http://localhost:3001/health" },
      { file: "service-driver-health.png", url: "http://localhost:3002/health" },
      { file: "service-ride-health.png", url: "http://localhost:3000/health" },
      { file: "service-payment-health.png", url: "http://localhost:3003/health" },
      { file: "service-notification-health.png", url: "http://localhost:3004/health" },
      { file: "service-rating-health.png", url: "http://localhost:3005/health" },
      { file: "service-auth-health.png", url: "http://localhost:3006/health" }
    ];

    for (const item of serviceHealth) {
      const result = runCommand(`curl.exe -s ${item.url}`);
      await screenshotText(page, item.file, `Service Health: ${item.url}`, `curl ${item.url}`, result.output);
    }

    // Frontend screenshot
    const dashboardPath = path.join(SHOTS_DIR, "service-frontend-dashboard.png");
    await page.goto("http://localhost:5173", { waitUntil: "networkidle", timeout: 60000 });
    await page.screenshot({ path: dashboardPath, fullPage: true });

    // 2) Docker/Kubernetes evidence screenshots
    const dockerPs = runCommand("docker ps");
    await screenshotText(page, "evidence-docker-ps.png", "Docker Containers", "docker ps", dockerPs.output);

    const pods = runCommand("kubectl get pods -o wide");
    await screenshotText(page, "evidence-kubectl-get-pods.png", "Kubernetes Pods", "kubectl get pods -o wide", pods.output);

    const svc = runCommand("kubectl get svc");
    await screenshotText(page, "evidence-kubectl-get-svc.png", "Kubernetes Services", "kubectl get svc", svc.output);

    // 3) API flow evidence screenshots (best-effort)
    const base = {
      user: process.env.USER_BASE_URL || "http://localhost:3001",
      driver: process.env.DRIVER_BASE_URL || "http://localhost:3002",
      ride: process.env.RIDE_BASE_URL || "http://localhost:3000",
      rating: process.env.RATING_BASE_URL || "http://localhost:3005"
    };
    const stamp = Date.now();

    const riderReq = { name: `Demo Rider ${stamp}`, email: `demo${stamp}@example.com`, phone: "9000000001", city: "Bengaluru" };
    const riderRes = await fetchJson(`${base.user}/v1/riders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(riderReq)
    });
    await screenshotText(page, "evidence-api-create-rider.png", "API: Create Rider", "POST /v1/riders", JSON.stringify(riderRes, null, 2));
    const riderId = riderRes.body?.id;

    const driverReq = {
      id: Number(String(stamp).slice(-4)),
      name: `Demo Driver ${stamp}`,
      phone: "9000000002",
      email: `driver${stamp}@example.com`,
      vehicle_type: "Sedan",
      vehicle_plate: `KA-${String(stamp).slice(-4)}`,
      city: "Bengaluru",
      is_active: true
    };
    const driverRes = await fetchJson(`${base.driver}/v1/drivers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(driverReq)
    });
    await screenshotText(page, "evidence-api-create-driver.png", "API: Create Driver", "POST /v1/drivers", JSON.stringify(driverRes, null, 2));

    const tripReq = {
      rider_id: riderId || 1,
      pickup_location: "MG Road",
      drop_location: "Airport",
      city: "Bengaluru",
      distance_km: 8.5
    };
    const tripRes = await fetchJson(`${base.ride}/v1/trips`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tripReq)
    });
    await screenshotText(page, "evidence-api-create-trip.png", "API: Create Trip", "POST /v1/trips", JSON.stringify(tripRes, null, 2));
    const tripId = tripRes.body?.id;

    const acceptRes = await fetchJson(`${base.ride}/v1/trips/${tripId}/accept`, { method: "POST" });
    await screenshotText(page, "evidence-api-accept-trip.png", "API: Accept Trip", "POST /v1/trips/:id/accept", JSON.stringify(acceptRes, null, 2));

    const completeRes = await fetchJson(`${base.ride}/v1/trips/${tripId}/complete`, { method: "POST" });
    await screenshotText(page, "evidence-api-complete-trip.png", "API: Complete Trip", "POST /v1/trips/:id/complete", JSON.stringify(completeRes, null, 2));

    const completedTrip = completeRes.body?.trip || completeRes.body || {};
    const ratingReq = {
      rider_id: completedTrip.rider_id || riderId || 1,
      driver_id: completedTrip.driver_id || driverReq.id || 1,
      rating: 5,
      feedback: "Great ride"
    };
    const ratingRes = await fetchJson(`${base.rating}/v1/trips/${tripId}/rating`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ratingReq)
    });
    await screenshotText(page, "evidence-api-rating-final-step.png", "API: Final Rating Step", "POST /v1/trips/:id/rating", JSON.stringify(ratingRes, null, 2));

    // 4) Metrics screenshots
    const rideMetrics = runCommand("curl.exe -s http://localhost:3000/metrics");
    await screenshotText(
      page,
      "evidence-metrics-ride.png",
      "Ride Metrics",
      "curl http://localhost:3000/metrics",
      getMetricLines(rideMetrics.output) || rideMetrics.output
    );

    const paymentMetrics = runCommand("curl.exe -s http://localhost:3003/metrics");
    await screenshotText(
      page,
      "evidence-metrics-payment.png",
      "Payment Metrics",
      "curl http://localhost:3003/metrics",
      getMetricLines(paymentMetrics.output) || paymentMetrics.output
    );

    const ratingMetrics = runCommand("curl.exe -s http://localhost:3005/metrics");
    await screenshotText(
      page,
      "evidence-metrics-rating.png",
      "Rating Metrics",
      "curl http://localhost:3005/metrics",
      getMetricLines(ratingMetrics.output) || ratingMetrics.output
    );
  } finally {
    await browser.close();
  }

  console.log("Required screenshots captured in docs/screenshots.");
}

main().catch((error) => {
  console.error("Failed to capture required screenshots:", error);
  process.exit(1);
});
