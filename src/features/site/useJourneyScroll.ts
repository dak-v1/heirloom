import { useEffect, type RefObject } from "react";

/**
 * Scroll choreography for the visit's step list: each step slides in as it reaches
 * the screen, a line fills down the dashed rail with the reader, and markers light
 * up as the line passes them. Uses data attributes, so React re-renders never undo it.
 * With reduced motion the steps simply stay put; the rail still tracks progress.
 */
export function useJourneyScroll(ref: RefObject<HTMLOListElement | null>, reduced: boolean) {
  useEffect(() => {
    const list = ref.current;
    if (!list) return;
    const steps = Array.from(list.querySelectorAll<HTMLElement>(":scope > .step"));
    const markers = steps.map((s) => s.querySelector<HTMLElement>(".step__marker"));

    let io: IntersectionObserver | undefined;
    if (!reduced) {
      list.dataset.animated = "true";
      io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (!e.isIntersecting) continue;
            (e.target as HTMLElement).dataset.in = "true";
            io?.unobserve(e.target);
          }
        },
        { rootMargin: "0px 0px -10% 0px", threshold: 0.08 },
      );
      steps.forEach((s) => io!.observe(s));
    } else {
      delete list.dataset.animated;
    }

    let raf = 0;
    const update = () => {
      raf = 0;
      const first = markers[0]?.getBoundingClientRect();
      if (!first) return;
      const listTop = list.getBoundingClientRect().top;
      const anchor = window.innerHeight * 0.6;
      const start = first.top + first.height / 2;
      const max = list.getBoundingClientRect().bottom - 40 - start;
      list.style.setProperty("--fill", `${Math.max(0, Math.min(max, anchor - start)).toFixed(1)}px`);
      list.style.setProperty("--fill-top", `${(start - listTop).toFixed(1)}px`);
      markers.forEach((m, i) => {
        if (!m) return;
        const r = m.getBoundingClientRect();
        steps[i].dataset.reached = String(r.top + r.height / 2 <= anchor);
      });
    };
    const schedule = () => {
      if (!raf) raf = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    const ro = new ResizeObserver(schedule);
    ro.observe(list);
    return () => {
      io?.disconnect();
      ro.disconnect();
      window.cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [ref, reduced]);
}
