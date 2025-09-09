// server.js
import express from "express";
import cors from "cors";
import { chromium } from "playwright";
import { scrapeJobs } from "./scraper.js";

const app = express();
app.use(cors());               // allow your frontend to call the API
app.use(express.json());

let browser;
/** Reuse a single headless Chromium to save cold-start time/memory */
async function getBrowser() {
  if (browser) return browser;
  browser = await chromium.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage"
    ]
  });
  browser.on("disconnected", () => { browser = null; });
  return browser;
}

app.post("/scrape", async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ error: "Missing url" });

    const br = await getBrowser();
    const context = await br.newContext({
      // Optional: set a decent UA; helps some career sites
      userAgent:
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118 Safari/537.36"
    });
    const page = await context.newPage();

    const jobs = await scrapeJobs(page, url);
    await context.close();

    return res.json({ count: jobs.length, jobs });
  } catch (err) {
    console.error("Scrape error:", err);
    return res.status(500).json({ error: "Scraping failed", details: String(err) });
  }
});

app.get("/health", (_, res) => res.send("ok"));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ API listening on :${PORT}`);
});