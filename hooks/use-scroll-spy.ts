"use client";

import { useEffect, useState } from "react";

/**
 * Observa uma lista de seções (por id) e retorna o id da seção
 * atualmente visível na tela — usado para destacar o link ativo no menu.
 *
 * @param sectionIds  ids das <section> presentes na página
 * @param rootMargin  margem do IntersectionObserver (compensa o header fixo)
 */
export function useScrollSpy(
  sectionIds: string[],
  rootMargin = "-45% 0px -50% 0px"
): string {
  const [activeId, setActiveId] = useState<string>(sectionIds[0] ?? "");

  useEffect(() => {
    if (sectionIds.length === 0) return;

    const visibility = new Map<string, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          visibility.set(entry.target.id, entry.intersectionRatio);
        }

        // Escolhe a seção com maior proporção visível dentro da faixa central.
        let best: string | null = null;
        let bestRatio = 0;
        for (const [id, ratio] of visibility) {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            best = id;
          }
        }

        if (best) setActiveId(best);
      },
      {
        rootMargin,
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    );

    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [sectionIds, rootMargin]);

  return activeId;
}
