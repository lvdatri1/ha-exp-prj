import { test, expect } from "@playwright/test";

const devices = [
  { name: "iPhone SE", width: 375, height: 667, minWidth: 350 },
  { name: "iPhone 12 Pro", width: 390, height: 844, minWidth: 360 },
  { name: "iPhone 14 Pro Max", width: 430, height: 932, minWidth: 400 },
  { name: "Samsung Galaxy S21", width: 360, height: 800, minWidth: 340 },
  { name: "iPad Mini", width: 768, height: 1024, minWidth: 740 },
  { name: "iPad Air", width: 820, height: 1180, minWidth: 790 },
  { name: "iPad Pro 11", width: 834, height: 1194, minWidth: 800 },
  { name: "iPad Pro 12.9", width: 1024, height: 1366, minWidth: 1000 },
  // Desktop sizes (1280px+): sidebar shows (256px), so content = viewport - 256px - padding
  { name: "Laptop", width: 1366, height: 768, minWidth: 1050 }, // 1366 - 256 = 1110
  { name: "Desktop HD", width: 1920, height: 1080, minWidth: 1600 }, // 1920 - 256 = 1664
  { name: "Desktop 4K", width: 2560, height: 1440, minWidth: 2200 }, // 2560 - 256 = 2304
];

test.describe("Responsive Layout Tests", () => {
  for (const device of devices) {
    test(`should render properly on ${device.name} (${device.width}x${device.height})`, async ({ page }) => {
      await page.setViewportSize({ width: device.width, height: device.height });
      await page.goto("http://localhost:3000");

      // Wait for main content
      await page.waitForSelector("main", { timeout: 10000 });

      // Get layout measurements
      const measurements = await page.evaluate(() => {
        const main = document.querySelector("main");
        const drawer = document.querySelector(".drawer");
        const drawerContent = document.querySelector(".drawer-content");
        const body = document.body;

        return {
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight,
          },
          main: main ? main.getBoundingClientRect().width : 0,
          drawer: drawer ? drawer.getBoundingClientRect().width : 0,
          drawerContent: drawerContent ? drawerContent.getBoundingClientRect().width : 0,
          body: body.getBoundingClientRect().width,
        };
      });

      console.log(`${device.name} measurements:`, measurements);

      // Main content should use reasonable width
      expect(measurements.main).toBeGreaterThan(device.minWidth);

      // Drawer should not constrain layout
      expect(measurements.drawer).toBeGreaterThanOrEqual(measurements.viewport.width * 0.9);

      // Check for horizontal overflow
      const hasOverflow = await page.evaluate(() => {
        return document.body.scrollWidth > window.innerWidth;
      });

      if (hasOverflow) {
        console.warn(`⚠️  ${device.name}: Horizontal overflow detected`);
      }

      // Take screenshot
      await page.screenshot({
        path: `e2e-screenshots/responsive-${device.name.toLowerCase().replace(/\s+/g, "-")}.png`,
        fullPage: false,
      });

      // Verify no layout breaking
      expect(hasOverflow).toBe(false);
    });
  }

  test("should handle orientation changes", async ({ page }) => {
    // Portrait
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("http://localhost:3000");
    await page.waitForSelector("main");

    const portraitWidth = await page.evaluate(() => document.querySelector("main")?.getBoundingClientRect().width);
    console.log("Portrait main width:", portraitWidth);

    // Landscape
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(500); // Let layout settle

    const landscapeWidth = await page.evaluate(() => document.querySelector("main")?.getBoundingClientRect().width);
    console.log("Landscape main width:", landscapeWidth);

    // Both should use available width
    expect(portraitWidth).toBeGreaterThan(700);
    expect(landscapeWidth).toBeGreaterThan(1000);
  });

  test("should not have fixed width containers", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("http://localhost:3000");
    await page.waitForSelector("main");

    const fixedWidthElements = await page.evaluate(() => {
      const elements = document.querySelectorAll("*");
      const fixed: any[] = [];

      elements.forEach((el) => {
        const computed = window.getComputedStyle(el);
        const maxWidth = computed.maxWidth;

        // Check for problematic max-width values (except modals and small components)
        if (
          maxWidth !== "none" &&
          !maxWidth.includes("%") &&
          !el.classList.contains("modal-box") &&
          !el.classList.contains("card") &&
          parseInt(maxWidth) < 1400
        ) {
          fixed.push({
            tag: el.tagName,
            classes: el.className,
            maxWidth: maxWidth,
          });
        }
      });

      return fixed;
    });

    console.log("Elements with constraining max-width:", fixedWidthElements);

    // Main layout containers should not have restrictive max-width
    const problematicContainers = fixedWidthElements.filter(
      (el) =>
        el.classes.includes("drawer") ||
        el.classes.includes("drawer-content") ||
        (el.tag === "MAIN" && parseInt(el.maxWidth) < 1400)
    );

    expect(problematicContainers.length).toBe(0);
  });
});
