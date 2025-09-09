// filters.js

/**
 * Define filter groups with detection keywords + desired values
 */
const FILTER_GROUPS = {
  location: {
    keywords: ["location", "country", "pincode"],
    value: "India"
  },
  category: {
    keywords: ["category", "categories", "job function"],
    value: "Engineering"
  }
};

/**
 * Try applying filters by detecting <select> or <button> with keyword labels
 * @param {object} page - Playwright page
 */
export async function applyFilters(page) {
  console.log("🔍 Looking for filter widgets...");

  for (const [groupName, config] of Object.entries(FILTER_GROUPS)) {
    const { keywords, value } = config;
    let applied = false;

    for (const keyword of keywords) {
      // 1. Look for <label> mentioning the keyword
      const label = await page.$(
        `xpath=//label[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '${keyword.toLowerCase()}')]`
      );

      if (label) {
        // Try to locate <select> near the label (using Playwright locator, not evaluateHandle)
        const select = await page.$(`xpath=//label[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '${keyword.toLowerCase()}')]/following::select[1]`);
        if (select) {
          console.log(`✅ Applying ${groupName} filter via <select>: ${value} (matched "${keyword}")`);
          await select.selectOption({ label: value }).catch(() => {});
          applied = true;
          break;
        }
      }

      // 2. Look for <button> or clickable element with keyword + value
      const button = await page.$(
        `xpath=//button[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '${value.toLowerCase()}')]`
      );

      if (button) {
        console.log(`✅ Applying ${groupName} filter via <button>: ${value} (matched "${keyword}")`);
        await button.click().catch(() => {});
        applied = true;
        break;
      }
    }

    if (!applied) {
      console.log(`⚠️ No ${groupName} filter found on this site.`);
    }
  }

  console.log("⏳ Waiting after filters...");
  await page.waitForTimeout(2000); // wait for reload / ajax
}
