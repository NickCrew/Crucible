"use client";

import { useEffect } from "react";
import { useCatalogStore } from "@/store/useCatalogStore";
import { CommandPalette } from "@/components/command-palette";

export function AppInitializer({ children }: { children: React.ReactNode }) {
  const catalog = useCatalogStore();

  useEffect(() => {
    // Sanitize stale transient states from localStorage
    catalog.sanitizeTransientState();
    
    // Initial health check
    catalog.fetchHealth();

    return () => {
      // Cleanup timers on unmount
      catalog.destroy();
    };
  }, [catalog]);

  return (
    <>
      <CommandPalette />
      {children}
    </>
  );
}
