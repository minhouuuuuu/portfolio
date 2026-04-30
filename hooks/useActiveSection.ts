"use client";

import { useState, useEffect } from "react";

export function useActiveSection(sectionIds: string[]): string | null {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const threshold = windowHeight * 0.4;

      let currentSection: string | null = null;

      for (const sectionId of sectionIds) {
        const element = document.getElementById(sectionId.replace("#", ""));
        
        if (element) {
          const rect = element.getBoundingClientRect();
          const sectionTop = rect.top + scrollY;
          const sectionBottom = sectionTop + rect.height;

          if (scrollY + threshold >= sectionTop && scrollY + threshold < sectionBottom) {
            currentSection = sectionId;
            break;
          }
        }
      }

      if (!currentSection && scrollY < threshold) {
        currentSection = sectionIds[0];
      }

      setActiveSection(currentSection);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [sectionIds]);

  return activeSection;
}
