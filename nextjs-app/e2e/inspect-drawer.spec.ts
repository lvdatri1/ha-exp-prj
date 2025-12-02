import { test } from "@playwright/test";

test("inspect drawer structure", async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto("http://localhost:3000");
  await page.waitForSelector("main");

  // Get full HTML structure of drawer
  const drawerHTML = await page.evaluate(() => {
    const drawer = document.querySelector(".drawer");
    return drawer?.outerHTML.substring(0, 2000);
  });

  console.log("Drawer HTML structure:\n", drawerHTML);

  // Get computed styles with more detail
  const styles = await page.evaluate(() => {
    const drawerContent = document.querySelector(".drawer-content");
    const computed = window.getComputedStyle(drawerContent!);
    return {
      width: computed.width,
      maxWidth: computed.maxWidth,
      minWidth: computed.minWidth,
      flex: computed.flex,
      flexGrow: computed.flexGrow,
      flexShrink: computed.flexShrink,
      flexBasis: computed.flexBasis,
      display: computed.display,
      position: computed.position,
      marginInlineStart: computed.marginInlineStart,
    };
  });

  console.log("Drawer-content computed styles:", JSON.stringify(styles, null, 2));

  // Check if lg:drawer-open is active
  const drawerClasses = await page.evaluate(() => {
    const drawer = document.querySelector(".drawer");
    return {
      classList: Array.from(drawer!.classList),
      hasDrawerOpen: drawer!.classList.contains("drawer-open"),
      hasLgDrawerOpen: drawer!.classList.contains("lg:drawer-open"),
    };
  });

  console.log("Drawer classes:", drawerClasses);

  await page.screenshot({ path: "e2e-screenshots/drawer-inspect.png", fullPage: false });
});
