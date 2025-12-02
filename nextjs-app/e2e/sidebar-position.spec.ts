import { test, expect } from "@playwright/test";

test.describe("Sidebar Positioning Tests", () => {
  test("sidebar should be on the left side on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("http://localhost:3000");
    await page.waitForSelector("aside");

    const measurements = await page.evaluate(() => {
      const sidebar = document.querySelector("aside");
      const drawerSide = document.querySelector(".drawer-side");
      const drawerContent = document.querySelector(".drawer-content");
      const drawer = document.querySelector(".drawer");

      const getSidebarInfo = () => {
        if (!sidebar || !drawerSide) return null;
        const sidebarRect = sidebar.getBoundingClientRect();
        const drawerSideRect = drawerSide.getBoundingClientRect();
        const drawerSideComputed = window.getComputedStyle(drawerSide);

        return {
          sidebar: {
            x: sidebarRect.x,
            y: sidebarRect.y,
            width: sidebarRect.width,
            height: sidebarRect.height,
            top: sidebarRect.top,
            left: sidebarRect.left,
          },
          drawerSide: {
            position: drawerSideComputed.position,
            top: drawerSideComputed.top,
            left: drawerSideComputed.left,
            bottom: drawerSideComputed.bottom,
            height: drawerSideComputed.height,
            zIndex: drawerSideComputed.zIndex,
            x: drawerSideRect.x,
            y: drawerSideRect.y,
          },
          drawer: drawer
            ? {
                display: window.getComputedStyle(drawer).display,
                flexDirection: window.getComputedStyle(drawer).flexDirection,
                position: window.getComputedStyle(drawer).position,
              }
            : null,
          drawerContent: drawerContent
            ? {
                x: drawerContent.getBoundingClientRect().x,
                width: drawerContent.getBoundingClientRect().width,
              }
            : null,
        };
      };

      return getSidebarInfo();
    });

    console.log("Sidebar measurements:", JSON.stringify(measurements, null, 2));

    // Sidebar should be on the left (x coordinate close to 0)
    expect(measurements?.sidebar.x).toBeLessThan(100);

    // Sidebar should be at the top
    expect(measurements?.sidebar.y).toBeLessThan(100);

    // Sidebar should not be at the bottom
    expect(measurements?.sidebar.y).not.toBeGreaterThan(800);

    await page.screenshot({ path: "e2e-screenshots/sidebar-position.png", fullPage: false });
  });

  test("sidebar should scroll independently", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("http://localhost:3000");
    await page.waitForSelector("aside");

    // Scroll the page
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(300);

    const sidebarPosition = await page.evaluate(() => {
      const sidebar = document.querySelector("aside");
      return sidebar?.getBoundingClientRect();
    });

    console.log("Sidebar position after scroll:", sidebarPosition);

    // Sidebar should remain near the top (sticky)
    expect(sidebarPosition?.top).toBeLessThan(100);
  });

  test("check drawer layout structure", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("http://localhost:3000");
    await page.waitForSelector("aside");

    const structure = await page.evaluate(() => {
      const drawer = document.querySelector(".drawer");
      const children = Array.from(drawer?.children || []);

      return {
        drawerClasses: drawer?.className,
        childrenOrder: children.map((child, index) => ({
          index,
          classes: child.className,
          tag: child.tagName,
        })),
      };
    });

    console.log("Drawer structure:", JSON.stringify(structure, null, 2));

    await page.screenshot({ path: "e2e-screenshots/drawer-structure.png", fullPage: true });
  });
});
