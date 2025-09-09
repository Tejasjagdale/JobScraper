import { URL } from "url";
import { JOB_KEYWORDS, EXCLUDE_KEYWORDS } from "./keywords.js";
import { handlePagination } from "./pagination.js";
import { closeOverlays } from "./overlayHandler.js";
import { applyFilters } from "./filters.js";

/**
 * Extract jobs from links on the current page
 */
async function extractJobsFromPage(page, baseDomain, allJobs) {
  const links = await page.$$eval("a", (anchors) =>
    anchors.map((a) => ({
      text: a.innerText.trim(),
      href: a.href
    }))
  );

  links.forEach((link) => {
    if (!link.href || !link.text) return;

    if (!link.href.startsWith(baseDomain)) return; // must be same domain

    const lowerText = link.text.toLowerCase();

    // ✅ Must contain at least one JOB_KEYWORD
    const matchesInclude = JOB_KEYWORDS.some((kw) => lowerText.includes(kw));
    if (!matchesInclude) return;

    // ❌ Must NOT contain any EXCLUDE_KEYWORD
    const matchesExclude = EXCLUDE_KEYWORDS.some((kw) => lowerText.includes(kw));
    if (matchesExclude) return;

    allJobs.add(JSON.stringify(link));
  });
}

/**
 * Main scrapeJobs with filters + pagination
 */
export async function scrapeJobs(page, url) {
  const base = new URL(url);
  const domain = base.origin;

  const allJobs = new Set();

  await page.goto(url, { waitUntil: "networkidle" });

  // 1. Always close overlays first
  await closeOverlays(page);

  // 2. Apply filters (only once, on first page)
//   await applyFilters(page);

  // 3. Use pagination handler
  await handlePagination(page, async (p) => {
    await extractJobsFromPage(p, domain, allJobs);
  });

  return Array.from(allJobs).map((j) => JSON.parse(j));
}