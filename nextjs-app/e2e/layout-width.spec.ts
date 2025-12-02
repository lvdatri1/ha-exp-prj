import { test, expect } from "@playwright/test";

test.describe("Layout Width Tests", () => {
  test("should use full viewport width on desktop", async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("http://localhost:3000");

    // Wait for layout to render
    await page.waitForSelector("main");

    // Get viewport width
    const viewportWidth = page.viewportSize()?.width || 0;
    console.log("Viewport width:", viewportWidth);

    // Check drawer-content width
    const drawerContent = page.locator(".drawer-content");
    const drawerBox = await drawerContent.boundingBox();
    console.log("Drawer content box:", drawerBox);

    // Check main element width
    const main = page.locator("main");
    const mainBox = await main.boundingBox();
    console.log("Main element box:", mainBox);

    // Check sidebar width
    const sidebar = page.locator("aside");
    const sidebarBox = await sidebar.boundingBox();
    console.log("Sidebar box:", sidebarBox);

    // Check page wrapper
    const pageWrapper = page.locator(".min-h-screen.bg-base-200").first();
    const pageBox = await pageWrapper.boundingBox();
    console.log("Page wrapper box:", pageBox);

    // Main content should be wider than 800px on desktop
    expect(mainBox?.width).toBeGreaterThan(800);

    // Drawer content + sidebar should approximately equal viewport
    const totalWidth = (drawerBox?.width || 0) + (sidebarBox?.width || 0);
    console.log("Total layout width:", totalWidth);

    // Should be close to viewport width (within 50px tolerance)
    expect(totalWidth).toBeGreaterThan(viewportWidth - 50);

    // Check for any constraining containers
    const containers = page.locator(".container.mx-auto");
    const containerCount = await containers.count();
    console.log("Container elements found:", containerCount);

    // Take screenshot for visual inspection
    await page.screenshot({ path: "e2e-screenshots/layout-width-desktop.png", fullPage: true });
  });

  test("should identify width-constraining elements", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("http://localhost:3000");

    // Wait for content
    await page.waitForSelector("main");

    // Check all elements with max-w classes
    const elementsWithMaxW = await page.evaluate(() => {
      const elements = document.querySelectorAll('[class*="max-w"]');
      return Array.from(elements).map((el) => ({
        tag: el.tagName,
        classes: el.className,
        width: el.getBoundingClientRect().width,
      }));
    });

    console.log("Elements with max-w classes:", JSON.stringify(elementsWithMaxW, null, 2));

    // Check for container classes
    const elementsWithContainer = await page.evaluate(() => {
      const elements = document.querySelectorAll('[class*="container"]');
      return Array.from(elements).map((el) => ({
        tag: el.tagName,
        classes: el.className,
        width: el.getBoundingClientRect().width,
      }));
    });

    console.log("Elements with container classes:", JSON.stringify(elementsWithContainer, null, 2));

    // Get computed styles of main content
    const mainStyles = await page.evaluate(() => {
      const main = document.querySelector("main");
      if (!main) return null;
      const computed = window.getComputedStyle(main);
      return {
        width: computed.width,
        maxWidth: computed.maxWidth,
        flex: computed.flex,
        display: computed.display,
      };
    });

    console.log("Main element computed styles:", mainStyles);

    // Get drawer-content styles
    const drawerStyles = await page.evaluate(() => {
      const drawer = document.querySelector(".drawer-content");
      if (!drawer) return null;
      const computed = window.getComputedStyle(drawer);
      return {
        width: computed.width,
        maxWidth: computed.maxWidth,
        display: computed.display,
        flex: computed.flex,
      };
    });

    console.log("Drawer-content computed styles:", drawerStyles);
  });

  test("should check page content wrapper", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("http://localhost:3000");

    await page.waitForSelector("main");

    // Get the page wrapper inside main
    const pageWrapperStyles = await page.evaluate(() => {
      const wrapper = document.querySelector("main > div");
      if (!wrapper) return null;
      const computed = window.getComputedStyle(wrapper);
      return {
        tag: wrapper.tagName,
        classes: wrapper.className,
        width: computed.width,
        maxWidth: computed.maxWidth,
        actualWidth: wrapper.getBoundingClientRect().width,
      };
    });

    console.log("Page wrapper (main > div) styles:", pageWrapperStyles);

    // Check card wrapper
    const cardStyles = await page.evaluate(() => {
      const card = document.querySelector(".card");
      if (!card) return null;
      const computed = window.getComputedStyle(card);
      return {
        classes: card.className,
        width: computed.width,
        maxWidth: computed.maxWidth,
        actualWidth: card.getBoundingClientRect().width,
      };
    });

    console.log("Card element styles:", cardStyles);
  });
});
