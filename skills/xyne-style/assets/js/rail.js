// Scroll-linked section rail: marks the item whose section is under the reading line
// and fills its underline with progress through that section (--progress 0..1).
//
//   import { rail } from "./rail.js";
//   rail(document.querySelector(".xs-rail"));   // links must point at #section ids
//
// Without JS the active item (aria-current="true" in markup) shows a full underline.

export function rail(nav, { line = 0.35 } = {}) {
  const links = [...nav.querySelectorAll('a[href^="#"]')];
  const items = links
    .map(link => ({ link, section: document.getElementById(decodeURIComponent(link.hash.slice(1))) }))
    .filter(item => item.section);
  if (!items.length) return () => {};

  let frame = 0;
  let current = null;

  function update() {
    frame = 0;
    const y = innerHeight * line;
    let active = null;
    for (const item of items) {
      const box = item.section.getBoundingClientRect();
      if (box.top <= y && box.bottom > y) { active = item; item.progress = (y - box.top) / box.height; break; }
    }
    // Above the first section nothing is active; past the last, the last stays complete.
    if (!active && items.at(-1).section.getBoundingClientRect().bottom <= y) { active = items.at(-1); active.progress = 1; }
    for (const item of items) {
      const on = item === active;
      if (on) item.link.setAttribute("aria-current", "true"); else item.link.removeAttribute("aria-current");
      item.link.style.setProperty("--progress", on ? Math.min(1, Math.max(0, item.progress)).toFixed(3) : "0");
    }
    if (active !== current) {
      current = active;
      // Keep the active item visible when the rail is a horizontal scroller on small screens.
      if (active && nav.scrollWidth > nav.clientWidth) {
        const left = active.link.offsetLeft - nav.clientWidth / 2 + active.link.offsetWidth / 2;
        nav.scrollTo({ left, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
      }
    }
  }

  const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
  addEventListener("scroll", schedule, { passive: true });
  addEventListener("resize", schedule, { passive: true });
  update();

  return function destroy() {
    cancelAnimationFrame(frame);
    removeEventListener("scroll", schedule);
    removeEventListener("resize", schedule);
  };
}
