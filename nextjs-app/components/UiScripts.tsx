"use client";

import { useEffect } from "react";

export default function UiScripts() {
  useEffect(() => {
    // Dynamically import FlyonUI JS on the client
    import("flyonui/dist/js/flyonui.js").catch(() => {
      // Optional: swallow if not found / not needed
    });
  }, []);

  return null;
}
