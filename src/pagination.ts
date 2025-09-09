import { Page } from "playwright";
import { closeOverlays } from "./overlayHandler.js";


/**
 * Hybrid Pagination Helper
 * - Handles "Next button" style pagination
 * - Handles infinite scroll style pagination
 */
export async function handlePagination(
  page: Page,
  callback: (page: Page, pageCount: number) => Promise<void>,
  jobsContainerSelector: string | null = null
): Promise<void> {
  let pageCount = 1;

  while (true) {
    await closeOverlays(page);
    await callback(page, pageCount);

    const nextButton =
      (await page.$("a#next, button#next, a.next, button.next")) ||
      (await page.$("a[aria-label='Next'], button[aria-label='Next']")) ||
      (await page.$("text=Next")) ||
      (await page.$("text=›"));

    if (nextButton) {
      const disabled = await nextButton.evaluate((el: Element) => {
        const cls = (el as HTMLElement).classList
          ? Array.from((el as HTMLElement).classList)
          : [];
        const hasDisabledClass = cls.some((c) =>
          c.toLowerCase().includes("disabled")
        );
        const ariaDisabled = el.getAttribute("aria-disabled");
        const isAriaDisabled =
          ariaDisabled && ariaDisabled.toLowerCase() === "true";
        return hasDisabledClass || isAriaDisabled;
      });

      if (disabled) {
        console.log("✅ Next button disabled, reached last page.");
        break;
      }

      console.log(`👉 Clicking next page (${pageCount + 1})...`);

      let previousHTML: string | null = null;
      if (jobsContainerSelector) {
        const container = await page.$(jobsContainerSelector);
        if (container) previousHTML = await container.innerHTML();
      }

      await nextButton.scrollIntoViewIfNeeded();
      await nextButton.click({ force: true });
      await closeOverlays(page);

      if (previousHTML && jobsContainerSelector) {
        // ✅ FIX: wrap args in object
        await page.waitForFunction(
          ({ prev, selector }) => {
            const el = document.querySelector(selector);
            return !!el && el.innerHTML !== prev;
          },
          { prev: previousHTML, selector: jobsContainerSelector }
        );
      } else {
        await page.waitForTimeout(2000);
      }

      pageCount++;
      continue;
    }

    console.log("ℹ️ No Next button, switching to infinite scroll mode...");

    let previousHeight = await page.evaluate(
      () => document.body.scrollHeight
    );

    while (true) {
      await page.evaluate(() =>
        window.scrollTo(0, document.body.scrollHeight)
      );
      await page.waitForTimeout(2000);
      await closeOverlays(page);

      const newHeight = await page.evaluate(
        () => document.body.scrollHeight
      );

      if (newHeight === previousHeight) {
        console.log("✅ Reached end of infinite scroll.");
        return;
      }

      previousHeight = newHeight;
      pageCount++;
      await callback(page, pageCount);
    }
  }
}