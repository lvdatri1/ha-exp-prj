import { test } from "@playwright/test";

test("check scroll behavior", async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto("http://localhost:3000");
  await page.waitForSelector("main");

  // Get all height-related measurements
  const measurements = await page.evaluate(() => {
    const body = document.body;
    const html = document.documentElement;
    const drawer = document.querySelector(".drawer");
    const drawerContent = document.querySelector(".drawer-content");
    const main = document.querySelector("main");

    const getStyles = (el: Element | null) => {
      if (!el) return null;
      const computed = window.getComputedStyle(el);
      return {
        height: computed.height,
        minHeight: computed.minHeight,
        maxHeight: computed.maxHeight,
        overflow: computed.overflow,
        overflowY: computed.overflowY,
        position: computed.position,
      };
    };

    return {
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      scrollHeight: {
        body: body.scrollHeight,
        html: html.scrollHeight,
        drawer: drawer?.scrollHeight,
        drawerContent: drawerContent?.scrollHeight,
        main: main?.scrollHeight,
      },
      clientHeight: {
        body: body.clientHeight,
        html: html.clientHeight,
        drawer: drawer?.clientHeight,
        drawerContent: drawerContent?.clientHeight,
        main: main?.clientHeight,
      },
      styles: {
        body: getStyles(body),
        html: getStyles(html),
        drawer: getStyles(drawer),
        drawerContent: getStyles(drawerContent),
        main: getStyles(main),
      },
      canScroll: body.scrollHeight > window.innerHeight,
    };
  });

  console.log("Scroll measurements:", JSON.stringify(measurements, null, 2));

  // Try to scroll
  await page.mouse.wheel(0, 500);
  await page.waitForTimeout(500);

  const scrollPosition = await page.evaluate(() => window.scrollY);
  console.log("Scroll position after wheel:", scrollPosition);

  await page.screenshot({ path: "e2e-screenshots/scroll-test.png", fullPage: true });
});
