import { test, expect } from "@playwright/test";

test.describe("iPad Responsive Layout", () => {
  test("should display properly on iPad screen", async ({ page }) => {
    // iPad Pro 12.9" dimensions
    await page.setViewportSize({ width: 1024, height: 1366 });
    await page.goto("http://localhost:3000");

    await page.waitForSelector("main");

    // Get layout measurements
    const drawerContent = page.locator(".drawer-content");
    const drawerBox = await drawerContent.boundingBox();
    console.log("iPad - Drawer content box:", drawerBox);

    const main = page.locator("main");
    const mainBox = await main.boundingBox();
    console.log("iPad - Main element box:", mainBox);

    const sidebar = page.locator("aside");
    const sidebarBox = await sidebar.boundingBox();
    console.log("iPad - Sidebar box:", sidebarBox);

    const drawer = page.locator(".drawer");
    const drawerStyles = await page.evaluate(() => {
      const drawer = document.querySelector(".drawer");
      const computed = window.getComputedStyle(drawer!);
      return {
        width: computed.width,
        maxWidth: computed.maxWidth,
        actualWidth: drawer!.getBoundingClientRect().width,
      };
    });
    console.log("iPad - Drawer styles:", drawerStyles);

    // Main should be close to viewport width on iPad
    expect(mainBox?.width).toBeGreaterThan(900);

    await page.screenshot({ path: "e2e-screenshots/layout-ipad.png", fullPage: true });
  });

  test("should display properly on iPad Mini", async ({ page }) => {
    // iPad Mini dimensions
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("http://localhost:3000");

    await page.waitForSelector("main");

    const mainBox = await page.locator("main").boundingBox();
    console.log("iPad Mini - Main element box:", mainBox);

    const drawerStyles = await page.evaluate(() => {
      const drawer = document.querySelector(".drawer");
      const computed = window.getComputedStyle(drawer!);
      return {
        width: computed.width,
        maxWidth: computed.maxWidth,
      };
    });
    console.log("iPad Mini - Drawer styles:", drawerStyles);

    // Should use full width on smaller iPad
    expect(mainBox?.width).toBeGreaterThan(700);

    await page.screenshot({ path: "e2e-screenshots/layout-ipad-mini.png", fullPage: true });
  });
});
