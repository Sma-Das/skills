// DOM adapter for the three-line morph engine. Writes attributes directly on each animation frame,
// so a framework never re-renders while an icon moves.
import { CENTER, SIZE, createMorph } from "./icons.js";

const NS = "http://www.w3.org/2000/svg";
const reducedMotion = () => globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

/**
 * Mount a morphing icon into `host` (an element; the SVG is appended to it).
 * Options: icon, size (px or CSS length), strokeWidth (in 14-unit box units), label, timeScale,
 * spring, icons, groups. Returns { set(name), setLabel(text), icon, svg, destroy() }.
 */
export function mountMorphIcon(host, options = {}) {
  const { icon = "menu", size = 20, strokeWidth = 1.5, label, timeScale = 1, ...engine } = options;
  const morph = createMorph(icon, engine);
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", `0 0 ${SIZE} ${SIZE}`);
  svg.setAttribute("width", String(size));
  svg.setAttribute("height", String(size));
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", String(strokeWidth));
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.style.overflow = "visible";
  svg.style.display = "block";
  const group = document.createElementNS(NS, "g");
  const lines = [0, 1, 2].map(() => group.appendChild(document.createElementNS(NS, "line")));
  svg.appendChild(group);
  host.appendChild(svg);

  let raf = 0, last = 0, scale = timeScale;
  const draw = () => {
    const { lines: data, angle } = morph.frame();
    group.setAttribute("transform", `rotate(${angle.toFixed(3)} ${CENTER} ${CENTER})`);
    data.forEach((l, i) => {
      const el = lines[i];
      // A zero-length line only renders its round cap if it has some length.
      const x2 = l[0] === l[2] && l[1] === l[3] ? l[2] + 0.001 : l[2];
      el.setAttribute("x1", l[0].toFixed(3));
      el.setAttribute("y1", l[1].toFixed(3));
      el.setAttribute("x2", x2.toFixed(3));
      el.setAttribute("y2", l[3].toFixed(3));
      el.setAttribute("opacity", l[4].toFixed(3));
    });
  };
  const tick = now => {
    const dt = last ? (now - last) / 1000 : 1 / 60;
    last = now;
    const moving = morph.step(dt * scale);
    draw();
    raf = moving ? requestAnimationFrame(tick) : 0;
    if (!moving) last = 0;
  };
  const setLabel = text => {
    if (text) {
      svg.setAttribute("role", "img");
      svg.setAttribute("aria-label", text);
      svg.removeAttribute("aria-hidden");
    } else {
      svg.removeAttribute("role");
      svg.removeAttribute("aria-label");
      svg.setAttribute("aria-hidden", "true");
    }
  };
  setLabel(label);
  draw();

  return {
    svg,
    get icon() { return morph.icon; },
    set(name, { instant = reducedMotion() } = {}) {
      morph.to(name, { instant });
      if (instant) {
        cancelAnimationFrame(raf);
        raf = 0; last = 0;
        draw();
      } else if (!raf) raf = requestAnimationFrame(tick);
    },
    setLabel,
    setTimeScale(value) { scale = value; },
    destroy() {
      cancelAnimationFrame(raf);
      svg.remove();
    },
  };
}
