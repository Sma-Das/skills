// Dash glyphs: small SVG illustrations built only from rounded strokes in one
// colour at varying opacity. They inherit `currentColor`, so set color: var(--brand).
//
//   import { glyph } from "./glyphs.js";
//   el.innerHTML = glyph("burst");
//
// Kinds: burst, ring, comb, frame, waves, arc. Pick one per card and keep the set
// visually related (same stroke width, same opacity range).

const r1 = n => Math.round(n * 10) / 10;

function line(x1, y1, x2, y2, opacity, width = 2) {
  return `<line x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}" stroke="currentColor" stroke-width="${width}" stroke-linecap="round" opacity="${r1(opacity)}"/>`;
}

function svg(w, h, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" fill="none" aria-hidden="true" focusable="false">${body}</svg>`;
}

// Radial burst around a small open centre; inner strokes are brighter.
function burst() {
  const c = 70, parts = [];
  const rings = [[10, 26, 32, 1, 2.6], [28, 46, 32, 0.6, 2], [48, 66, 24, 0.35, 1.6]];
  rings.forEach(([a, b, n, op, w], ring) => {
    for (let i = 0; i < n; i++) {
      const t = (i / n) * Math.PI * 2 + ring * 0.09;
      const jitter = ((i * 37) % 7) / 7;
      const len = b - (b - a) * jitter * 0.35;
      parts.push(line(c + Math.cos(t) * a, c + Math.sin(t) * a, c + Math.cos(t) * len, c + Math.sin(t) * len, op * (0.7 + 0.3 * (1 - jitter)), w));
    }
  });
  parts.push(`<circle cx="${c}" cy="${c}" r="7" stroke="currentColor" stroke-width="2.5"/>`);
  return svg(140, 140, parts.join(""));
}

// Ring of tangential strokes whose opacity sweeps around the circle.
function ring() {
  const c = 75, r = 62, n = 56, parts = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2 - Math.PI / 2;
    const sweep = 0.5 + 0.5 * Math.cos(t + Math.PI * 0.75);
    const inner = r - 6 - sweep * 10;
    parts.push(line(c + Math.cos(t) * inner, c + Math.sin(t) * inner, c + Math.cos(t) * (r + 4), c + Math.sin(t) * (r + 4), 0.15 + 0.85 * sweep, 1.5 + sweep * 1.5));
  }
  return svg(150, 150, parts.join(""));
}

// A comb of thin ticks with a bold slanted pair at the centre: "one choice among many".
function comb() {
  const parts = [];
  const n = 25, mid = 12;
  for (let i = 0; i < n; i++) {
    if (i === mid || i === mid + 1) continue;
    const x = 10 + i * 8;
    parts.push(line(x, 28, x, 58, 0.25 + 0.35 * (1 - Math.abs(i - mid) / mid), 1.2));
  }
  const x = 10 + mid * 8;
  parts.push(line(x - 1, 22, x + 3, 64, 1, 3), line(x + 6, 22, x + 10, 64, 1, 3));
  return svg(214, 86, parts.join(""));
}

// A rectangular frame of slanted ticks around an empty centre: "contained, kept in place".
function frame() {
  const parts = [];
  const cols = 30, rows = 8;
  for (let rI = 0; rI < rows; rI++) {
    for (let c = 0; c < cols; c++) {
      const edge = rI < 2 || rI > rows - 3 || c < 6 || c > cols - 7;
      if (!edge) continue;
      const x = 8 + c * 8, y = 8 + rI * 15;
      const slant = c < 6 ? -3 : c > cols - 7 ? 3 : 0;
      const op = rI === 0 || rI === rows - 1 ? 0.3 : 0.55 + 0.45 * (c % 3 === 0);
      parts.push(line(x - slant, y, x + slant, y + 10, op, 1.4));
    }
  }
  return svg(256, 132, parts.join(""));
}

// Dashed rows with a bright diagonal stitch crossing them: "flow through layers".
function waves() {
  const parts = [];
  for (let rI = 0; rI < 6; rI++) {
    const y = 12 + rI * 18;
    for (let x = 4; x < 236; x += 12) parts.push(line(x, y, x + 6, y, 0.3, 1.2));
    const cx = 92 + rI * 7;
    for (let k = 0; k < 4; k++) parts.push(line(cx + k * 9, y + 3, cx + k * 9 + 9, y - 3, 1 - k * 0.15, 2.4));
  }
  return svg(240, 120, parts.join(""));
}

// A partial arc of strokes that thickens toward one end: "building over time".
function arc() {
  const c = 64, r = 48, n = 44, parts = [];
  for (let i = 0; i < n; i++) {
    const p = i / (n - 1);
    const t = -Math.PI * 0.5 + p * Math.PI * 2 * 0.98;
    const grow = Math.max(0, 1 - p * 1.4);
    const inner = r - 4 - grow * 12;
    parts.push(line(c + Math.cos(t) * inner, c + Math.sin(t) * inner, c + Math.cos(t) * (r + 2), c + Math.sin(t) * (r + 2), 0.2 + grow * 0.8, 1.2 + grow * 2.4));
  }
  return svg(128, 128, parts.join(""));
}

const KINDS = { burst, ring, comb, frame, waves, arc };

export function glyph(kind) {
  const make = KINDS[kind];
  if (!make) throw new Error(`Unknown glyph "${kind}". Use one of: ${Object.keys(KINDS).join(", ")}`);
  return make();
}

export const glyphKinds = Object.keys(KINDS);

// Light a card's glyph around the pointer: strokes near it brighten and thicken,
// echoing the hero dash field. Hover enhancement only; the glyph reads fine without it.
//
//   for (const card of document.querySelectorAll(".xs-card")) lightGlyph(card);
export function lightGlyph(card, { radius = 46 } = {}) {
  const svgEl = card.querySelector(".xs-card-art svg");
  if (!svgEl || !matchMedia("(hover: hover)").matches) return () => {};
  const lines = [...svgEl.querySelectorAll("line")].map(el => {
    const g = n => Number(el.getAttribute(n));
    return { el, x: (g("x1") + g("x2")) / 2, y: (g("y1") + g("y2")) / 2, o: g("opacity"), w: g("stroke-width") };
  });
  let frame = 0, point = null;

  function paint() {
    frame = 0;
    for (const l of lines) {
      const k = point ? Math.max(0, 1 - Math.hypot(point.x - l.x, point.y - l.y) / radius) : 0;
      l.el.setAttribute("opacity", r1(l.o + (1 - l.o) * k));
      l.el.setAttribute("stroke-width", r1(l.w * (1 + 0.7 * k)));
    }
  }
  function onMove(event) {
    const m = svgEl.getScreenCTM();
    if (!m) return;
    const p = new DOMPoint(event.clientX, event.clientY).matrixTransform(m.inverse());
    point = { x: p.x, y: p.y };
    if (!frame) frame = requestAnimationFrame(paint);
  }
  function onLeave() { point = null; if (!frame) frame = requestAnimationFrame(paint); }
  card.addEventListener("pointermove", onMove, { passive: true });
  card.addEventListener("pointerleave", onLeave, { passive: true });
  return () => {
    cancelAnimationFrame(frame);
    card.removeEventListener("pointermove", onMove);
    card.removeEventListener("pointerleave", onLeave);
    point = null; paint();
  };
}
