import { closeOverlays } from "./overlayHandler.js";

/**
 * Hybrid Pagination Helper
 * - Handles "Next button" style pagination
 * - Handles infinite scroll style pagination
 */
export async function handlePagination(page, callback, jobsContainerSelector = null) {
  let pageCount = 1;

  while (true) {
    // ✅ Always clean overlays before scraping
    await closeOverlays(page);

    // Scrape current page
    await callback(page, pageCount);

    // 1️⃣ Try to find a "Next" button
    const nextButton =
      (await page.$("a#next, button#next, a.next, button.next")) ||
      (await page.$("a[aria-label='Next'], button[aria-label='Next']")) ||
      (await page.$("text=Next")) ||
      (await page.$("text=›"));

    if (nextButton) {
      // Check if disabled
      const disabled = await nextButton.evaluate((el) => {
        const cls = el.classList ? Array.from(el.classList) : [];
        const hasDisabledClass = cls.some((c) => c.toLowerCase().includes("disabled"));
        const ariaDisabled = el.getAttribute("aria-disabled");
        const isAriaDisabled = ariaDisabled && ariaDisabled.toLowerCase() === "true";
        return hasDisabledClass || isAriaDisabled;
      });

      if (disabled) {
        console.log("✅ Next button disabled, reached last page.");
        break;
      }

      console.log(`👉 Clicking next page (${pageCount + 1})...`);

      // Track container state
      let previousHTML = null;
      if (jobsContainerSelector) {
        const container = await page.$(jobsContainerSelector);
        if (container) previousHTML = await container.innerHTML();
      }

      await nextButton.scrollIntoViewIfNeeded();
      await nextButton.click({ force: true });

      // ✅ Run overlay handler again
      await closeOverlays(page);

      // Wait for content update
      if (previousHTML && jobsContainerSelector) {
        await page.waitForFunction(
          (prev, selector) => {
            const el = document.querySelector(selector);
            return el && el.innerHTML !== prev;
          },
          previousHTML,
          jobsContainerSelector
        );
      } else {
        await page.waitForTimeout(2000);
      }

      pageCount++;
      continue; // loop back
    }

    // 2️⃣ If no Next button → Try Infinite Scroll
    console.log("ℹ️ No Next button, switching to infinite scroll mode...");

    let previousHeight = await page.evaluate("document.body.scrollHeight");

    while (true) {
      // Scroll down
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(2000); // wait for AJAX load

      // ✅ Run overlay handler again
      await closeOverlays(page);

      const newHeight = await page.evaluate("document.body.scrollHeight");

      if (newHeight === previousHeight) {
        console.log("✅ Reached end of infinite scroll.");
        return;
      }

      previousHeight = newHeight;
      pageCount++;

      // Scrape newly loaded jobs
      await callback(page, pageCount);
    }
  }
}
