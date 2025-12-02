import { test, expect } from "@playwright/test";

test("debug sidebar position live", async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto("http://localhost:3000");
  await page.waitForSelector("aside", { timeout: 10000 });

  // Wait a bit for layout to settle
  await page.waitForTimeout(1000);

  const fullDiagnostics = await page.evaluate(() => {
    const sidebar = document.querySelector("aside");
    const drawerSide = document.querySelector(".drawer-side");
    const drawer = document.querySelector(".drawer");
    const drawerContent = document.querySelector(".drawer-content");
    const body = document.body;

    const getFullStyles = (el: Element | null, name: string) => {
      if (!el) return { name, exists: false };
      const rect = el.getBoundingClientRect();
      const computed = window.getComputedStyle(el);
      return {
        name,
        exists: true,
        rect: {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
          top: rect.top,
          left: rect.left,
          bottom: rect.bottom,
          right: rect.right,
        },
        computed: {
          position: computed.position,
          display: computed.display,
          flexDirection: computed.flexDirection,
          order: computed.order,
          top: computed.top,
          left: computed.left,
          zIndex: computed.zIndex,
          transform: computed.transform,
        },
      };
    };

    return {
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      sidebar: getFullStyles(sidebar, "aside"),
      drawerSide: getFullStyles(drawerSide, ".drawer-side"),
      drawer: getFullStyles(drawer, ".drawer"),
      drawerContent: getFullStyles(drawerContent, ".drawer-content"),
      bodyScroll: {
        scrollHeight: body.scrollHeight,
        clientHeight: body.clientHeight,
      },
    };
  });

  console.log("Full diagnostics:", JSON.stringify(fullDiagnostics, null, 2));

  // Take screenshot
  await page.screenshot({ path: "e2e-screenshots/sidebar-debug.png", fullPage: false });

  // Check if sidebar is visible on screen
  const sidebarVisible = await page.evaluate(() => {
    const sidebar = document.querySelector("aside");
    if (!sidebar) return false;
    const rect = sidebar.getBoundingClientRect();
    return rect.top >= 0 && rect.top < window.innerHeight;
  });

  console.log("Is sidebar visible in viewport:", sidebarVisible);

  // Expected: sidebar should be at top-left
  expect(fullDiagnostics.sidebar.rect?.y).toBeLessThan(100);
  expect(fullDiagnostics.sidebar.rect?.x).toBeLessThan(50);
});
