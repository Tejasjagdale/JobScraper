import { Page } from "playwright";

/**
 * Utility to detect and close annoying popups, modals, cookie banners, overlays
 * that block interaction with the page during scraping.
 */
export async function closeOverlays(page: Page): Promise<void> {
  try {
    console.log("🛡️ Checking for popups / overlays...");

    // Common selectors for overlays / modals / cookie banners
    const selectors: string[] = [
      // Cookie banners
      'button:has-text("Accept")',
      'button:has-text("I Agree")',
      'button:has-text("Allow All")',
      'button:has-text("Got it")',
      "button.cookie-accept",
      "button.cookie-consent",
      "#onetrust-accept-btn-handler",

      // Generic close buttons
      'button:has-text("Close")',
      'button:has-text("×")',
      ".close-button",
      ".modal-close",
      '[aria-label="Close"]',

      // Overlays / modals
      "div[role='dialog'] button",
      ".overlay button",
      ".popup button",
      ".consent button",
      ".banner button",
    ];

    let found = false;

    for (const selector of selectors) {
      const btn = await page.$(selector);
      if (btn) {
        console.log(`⚡ Closing overlay: ${selector}`);
        await btn.click({ force: true }).catch(() => {});
        await page.waitForTimeout(1000); // give time for it to disappear
        found = true;
      }
    }

    // As a fallback, remove full-screen blocking elements directly
    await page.evaluate(() => {
      const blockers = document.querySelectorAll(
        ".overlay, .modal-backdrop, .cookie-banner, .popup, .consent-banner"
      );
      blockers.forEach((el) => {
        (el as HTMLElement).style.display = "none";
        el.remove();
      });
    });

    if (found) {
      console.log("✅ Overlays closed.");
    } else {
      console.log("ℹ️ No blocking overlays found.");
    }
  } catch (err: any) {
    console.log("⚠️ Error while handling overlays:", err.message);
  }
}