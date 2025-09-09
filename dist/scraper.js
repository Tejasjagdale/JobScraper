"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scrapeJobs = scrapeJobs;
const url_1 = require("url");
const keywords_1 = require("./keywords");
const pagination_1 = require("./pagination");
const overlayHandler_1 = require("./overlayHandler");
/**
 * Extract jobs from links on the current page
 */
async function extractJobsFromPage(page, baseDomain, allJobs) {
    const links = await page.$$eval("a", (anchors) => anchors.map((a) => ({
        title: a.innerText.trim(),
        link: a.href,
    })));
    links.forEach((link) => {
        if (!link.link || !link.title)
            return;
        if (!link.link.startsWith(baseDomain))
            return; // must be same domain
        const lowerText = link.title.toLowerCase();
        // ✅ Must contain at least one JOB_KEYWORD
        const matchesInclude = keywords_1.JOB_KEYWORDS.some((kw) => lowerText.includes(kw));
        if (!matchesInclude)
            return;
        // ❌ Must NOT contain any EXCLUDE_KEYWORD
        const matchesExclude = keywords_1.EXCLUDE_KEYWORDS.some((kw) => lowerText.includes(kw));
        if (matchesExclude)
            return;
        allJobs.add(JSON.stringify(link));
    });
}
/**
 * Main scrapeJobs with overlays + pagination
 */
async function scrapeJobs(page, url) {
    const base = new url_1.URL(url);
    const domain = base.origin;
    const allJobs = new Set();
    await page.goto(url, { waitUntil: "networkidle" });
    // 1. Always close overlays first
    await (0, overlayHandler_1.closeOverlays)(page);
    // 2. Use pagination handler
    await (0, pagination_1.handlePagination)(page, async (p) => {
        await extractJobsFromPage(p, domain, allJobs);
    });
    return Array.from(allJobs).map((j) => JSON.parse(j));
}
