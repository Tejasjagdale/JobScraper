import { Page } from "playwright";
import { URL } from "url";
import { Job } from "./types.js";
import { EXCLUDE_KEYWORDS, JOB_KEYWORDS } from "./keywords.js";
import { closeOverlays } from "./overlayHandler.js";
import { handlePagination } from "./pagination.js";



/**
 * Extract jobs from links on the current page
 */
async function extractJobsFromPage(page: Page, baseDomain: string, allJobs: Set<string>): Promise<void> {
  const links: Job[] = await page.$$eval("a", (anchors) =>
    anchors.map((a) => ({
      title: a.innerText.trim(),
      link: a.href,
    }))
  );

  links.forEach((link) => {
    if (!link.link || !link.title) return;
    if (!link.link.startsWith(baseDomain)) return; // must be same domain

    const lowerText = link.title.toLowerCase();

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
 * Main scrapeJobs with overlays + pagination
 */
export async function scrapeJobs(page: Page, url: string): Promise<Job[]> {
  const base = new URL(url);
  const domain = base.origin;

  const allJobs = new Set<string>();

  await page.goto(url, { waitUntil: "networkidle" });

  // 1. Always close overlays first
  await closeOverlays(page);

  // 2. Use pagination handler
  await handlePagination(page, async (p) => {
    await extractJobsFromPage(p, domain, allJobs);
  });

  return Array.from(allJobs).map((j) => JSON.parse(j) as Job);
}
