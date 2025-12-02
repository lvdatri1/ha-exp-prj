import { test } from "@playwright/test";

test("inspect drawer parent", async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto("http://localhost:3000");
  await page.waitForSelector("main");

  const parentStyles = await page.evaluate(() => {
    const drawer = document.querySelector(".drawer");
    const body = document.querySelector("body");
    const html = document.querySelector("html");

    const drawerComputed = window.getComputedStyle(drawer!);
    const bodyComputed = window.getComputedStyle(body!);
    const htmlComputed = window.getComputedStyle(html!);

    return {
      drawer: {
        width: drawerComputed.width,
        maxWidth: drawerComputed.maxWidth,
        display: drawerComputed.display,
        flexDirection: drawerComputed.flexDirection,
        actualWidth: drawer!.getBoundingClientRect().width,
      },
      body: {
        width: bodyComputed.width,
        maxWidth: bodyComputed.maxWidth,
        display: bodyComputed.display,
        actualWidth: body!.getBoundingClientRect().width,
      },
      html: {
        width: htmlComputed.width,
        maxWidth: htmlComputed.maxWidth,
        actualWidth: html!.getBoundingClientRect().width,
      },
    };
  });

  console.log("Parent containers:", JSON.stringify(parentStyles, null, 2));

  // Check all children of drawer
  const drawerChildren = await page.evaluate(() => {
    const drawer = document.querySelector(".drawer");
    return Array.from(drawer!.children).map((child) => ({
      tag: child.tagName,
      classes: child.className,
      width: child.getBoundingClientRect().width,
    }));
  });

  console.log("Drawer children:", JSON.stringify(drawerChildren, null, 2));
});
