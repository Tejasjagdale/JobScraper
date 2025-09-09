"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const playwright_1 = require("playwright");
const scraper_1 = require("./scraper");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
let browser = null;
/** Reuse a single headless Chromium to save cold-start time/memory */
async function getBrowser() {
    if (browser)
        return browser;
    browser = await playwright_1.chromium.launch({
        headless: true,
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
        ],
    });
    browser.on("disconnected", () => {
        browser = null;
    });
    return browser;
}
app.post("/scrape", async (req, res) => {
    try {
        const { url } = req.body || {};
        if (!url) {
            return res.status(400).json({ error: "Missing url" });
        }
        const br = await getBrowser();
        const context = await br.newContext({
            userAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118 Safari/537.36",
        });
        const page = await context.newPage();
        const jobs = await (0, scraper_1.scrapeJobs)(page, url);
        await context.close();
        return res.json({ count: jobs.length, jobs });
    }
    catch (err) {
        console.error("Scrape error:", err);
        return res.status(500).json({ error: "Scraping failed", details: String(err) });
    }
});
app.get("/health", (_, res) => res.send("ok"));
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`✅ API listening on :${PORT}`);
});
