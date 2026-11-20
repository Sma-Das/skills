// Keeps the fixed nav legible: it takes the theme of the band under it.
// Mark each band with data-nav-theme="dark", "light", or "accent".
//
//   import { navTheme } from "./nav-theme.js";
//   navTheme(document.querySelector(".bs-nav"));
//
// The probe point is the source's: 30px from the top, at the horizontal centre.
// Without JS the nav keeps the data-theme in the markup ("dark" by default).

export function navTheme(nav, { probe = 30 } = {}) {
  let frame = 0;

  function update() {
    frame = 0;
    const centre = innerWidth / 2;
    let top = Infinity;
    let found = null;
    for (const band of document.querySelectorAll("[data-nav-theme]")) {
      const box = band.getBoundingClientRect();
      if (box.top <= probe && box.bottom >= probe && box.left <= centre && box.right >= centre && box.top < top) {
        top = box.top;
        found = band;
      }
    }
    if (found && nav.dataset.theme !== found.dataset.navTheme) nav.dataset.theme = found.dataset.navTheme;
  }

  const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
  addEventListener("scroll", schedule, { passive: true });
  addEventListener("resize", schedule, { passive: true });
  const resize = new ResizeObserver(schedule);
  resize.observe(document.body);
  update();

  return function destroy() {
    cancelAnimationFrame(frame);
    removeEventListener("scroll", schedule);
    removeEventListener("resize", schedule);
    resize.disconnect();
  };
}
