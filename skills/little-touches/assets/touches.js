// Little touches: small, dependency-free helpers for the patterns in SKILL.md.
// Every helper starts from what is visible now, so repeated or reversed input
// continues smoothly instead of snapping. Durations are starting points.

export const config = { speed: 1 };

export const ease = {
  out: "cubic-bezier(0.23, 1, 0.32, 1)",
  move: "cubic-bezier(0.77, 0, 0.175, 1)",
  drawer: "cubic-bezier(0.32, 0.72, 0, 1)",
};

export const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const ms = (d) => d / config.speed;

/** Slow every helper, e.g. setSpeed(0.5) for a 0.5x review pass. */
export function setSpeed(speed) {
  config.speed = speed;
}

function animate(el, keyframes, duration, easing = ease.out, extra = {}) {
  return el.animate(keyframes, { duration: ms(duration), easing, ...extra });
}

function stop(el) {
  for (const a of el.getAnimations()) a.cancel();
}

/**
 * Move a live element into a new parent and let it travel there (FLIP).
 * The element is never duplicated, so it stays one object throughout.
 */
export function moveInto(el, parent, { before = null, duration = 520, easing = ease.drawer, scale = true } = {}) {
  const first = el.getBoundingClientRect();
  stop(el);
  parent.insertBefore(el, before);
  const last = el.getBoundingClientRect();
  if (reduced()) return animate(el, [{ opacity: 0 }, { opacity: 1 }], 160);
  const dx = first.left + first.width / 2 - (last.left + last.width / 2);
  const dy = first.top + first.height / 2 - (last.top + last.height / 2);
  const s = scale && last.width ? first.width / last.width : 1;
  return animate(
    el,
    [{ transform: `translate(${dx}px, ${dy}px) scale(${s})` }, { transform: "none" }],
    duration,
    easing,
  );
}

/**
 * Render keyed tokens into a container. Tokens whose key survives slide to
 * their new place; new tokens rise in; removed tokens fade out where they were.
 * items: [{ key, text, className? }]
 */
export function renderKeyed(container, items, { duration = 320, enterY = "0.35em" } = {}) {
  if (getComputedStyle(container).position === "static") container.style.position = "relative";
  for (const n of [...container.children]) if (n.dataset.ghost) n.remove();

  const old = new Map();
  for (const node of container.children) {
    old.set(node.dataset.key, { node, rect: node.getBoundingClientRect() });
  }
  for (const { node } of old.values()) stop(node);

  const fresh = new Set();
  const kept = new Map();
  const next = items.map(({ key, text, className = "" }) => {
    const hit = old.get(key);
    const node = hit ? hit.node : document.createElement("span");
    node.dataset.key = key;
    node.className = className;
    if (node.textContent !== text) node.textContent = text;
    if (hit) {
      kept.set(node, hit.rect);
      old.delete(key);
    } else fresh.add(node);
    return node;
  });
  container.replaceChildren(...next);

  const box = container.getBoundingClientRect();
  const calm = reduced();

  for (const { node, rect } of old.values()) {
    node.dataset.ghost = "1";
    node.setAttribute("aria-hidden", "true");
    Object.assign(node.style, {
      position: "absolute",
      left: `${rect.left - box.left}px`,
      top: `${rect.top - box.top}px`,
      pointerEvents: "none",
      whiteSpace: "pre",
    });
    container.append(node);
    const out = calm
      ? [{ opacity: 1 }, { opacity: 0 }]
      : [{ opacity: 1, transform: "none" }, { opacity: 0, transform: `translateY(-${enterY}) scale(0.92)` }];
    animate(node, out, duration * 0.6).finished.then(() => node.remove(), () => {});
  }

  for (const node of next) {
    if (fresh.has(node)) {
      const enter = calm
        ? [{ opacity: 0 }, { opacity: 1 }]
        : [{ opacity: 0, transform: `translateY(${enterY}) scale(0.92)` }, { opacity: 1, transform: "none" }];
      animate(node, enter, duration, ease.out, { delay: calm ? 0 : ms(duration * 0.12), fill: "backwards" });
      continue;
    }
    if (calm) continue;
    const first = kept.get(node);
    const last = node.getBoundingClientRect();
    const dx = first.left - last.left;
    const dy = first.top - last.top;
    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) continue;
    animate(node, [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }], duration, ease.out);
  }
}

/**
 * Change text so only the part that differs animates. Shared leading and
 * trailing tokens stay put (and slide if the middle changes width).
 * by: "word" for sentences ("Learn more about tokens" -> "... fees"),
 *     "char" for labels that share letters ("Continue" -> "Confirm").
 */
export function morphText(el, nextText, { by = "word", duration } = {}) {
  const split = (s) => (by === "char" ? [...s] : s.split(/(\s+)/).filter(Boolean));
  const prev = split(el.dataset.text ?? el.textContent);
  const next = split(nextText);
  let p = 0;
  while (p < prev.length && p < next.length && prev[p] === next[p]) p++;
  let s = 0;
  while (s < prev.length - p && s < next.length - p && prev.at(-1 - s) === next.at(-1 - s)) s++;
  const gen = (Number(el.dataset.gen) || 0) + 1;
  el.dataset.gen = gen;
  el.dataset.text = nextText;
  if (!el.getAttribute("aria-label") && el.tagName !== "BUTTON") el.setAttribute("aria-live", "polite");
  const items = next.map((text, i) => {
    let key;
    if (i < p) key = `p${i}`;
    else if (i >= next.length - s) key = `s${next.length - 1 - i}`;
    else key = `m${gen}-${i}`;
    return { key, text, className: "lt-token" };
  });
  // Make sure existing plain text is tokenised once, keyed the same way.
  if (!el.querySelector("[data-key]")) {
    el.replaceChildren(...prev.map((text, i) => {
      const span = document.createElement("span");
      span.className = "lt-token";
      span.textContent = text;
      span.dataset.key = i < p ? `p${i}` : i >= prev.length - s ? `s${prev.length - 1 - i}` : `m0-${i}`;
      return span;
    }));
  }
  renderKeyed(el, items, { duration: duration ?? (by === "char" ? 260 : 320) });
}

/**
 * Format a number with grouping and render each glyph keyed so digits keep
 * their identity and each comma slides to its new place as the value grows.
 * Digits are keyed from the left (typing order), separators by group from the right.
 */
export function renderNumber(el, digits, { prefix = "$", locale = "en-US" } = {}) {
  const raw = digits.replace(/[^\d.]/g, "");
  const [int = "", frac] = raw.split(".");
  const sep = (1000).toLocaleString(locale).replace(/\d/g, "") || ",";
  const items = [];
  if (prefix) items.push({ key: "prefix", text: prefix, className: "lt-prefix" });
  const intDigits = int === "" ? "0" : int;
  [...intDigits].forEach((d, i) => {
    const fromRight = intDigits.length - i;
    items.push({ key: `d${i}`, text: d, className: "lt-digit" });
    if (fromRight > 1 && (fromRight - 1) % 3 === 0) {
      items.push({ key: `sep${(fromRight - 1) / 3}`, text: sep, className: "lt-sep" });
    }
  });
  if (frac !== undefined) {
    items.push({ key: "dot", text: ".", className: "lt-sep" });
    [...frac].forEach((d, i) => items.push({ key: `f${i}`, text: d, className: "lt-digit" }));
  }
  el.setAttribute("aria-label", `${prefix}${Number(raw || 0).toLocaleString(locale)}`);
  renderKeyed(el, items, { duration: 300 });
}

/** Animate a box's height around a content change (stepped trays, sheets). */
export function resizeAround(el, mutate, { duration = 420, easing = ease.drawer } = {}) {
  const from = el.getBoundingClientRect().height;
  stop(el);
  mutate();
  const to = el.getBoundingClientRect().height;
  if (reduced() || Math.abs(from - to) < 1) return;
  animate(el, [{ height: `${from}px`, overflow: "hidden" }, { height: `${to}px`, overflow: "hidden" }], duration, easing);
}

/** Slide panel content toward the tab that was chosen: fly, don't teleport. */
export function slidePanels(outgoing, incoming, direction, { distance = 28, duration = 340 } = {}) {
  stop(incoming);
  if (outgoing) stop(outgoing);
  if (reduced()) {
    animate(incoming, [{ opacity: 0 }, { opacity: 1 }], 160);
    return;
  }
  const d = direction * distance;
  if (outgoing) {
    animate(outgoing, [{ opacity: 1, transform: "none" }, { opacity: 0, transform: `translateX(${-d}px)` }], duration * 0.7, ease.out, { fill: "forwards" });
  }
  animate(incoming, [{ opacity: 0, transform: `translateX(${d}px)` }, { opacity: 1, transform: "none" }], duration, ease.out);
}

// Three-line icons on a 14x14 grid. Unused lines collapse to the centre at opacity 0.
const C = { x1: 7, y1: 7, x2: 7, y2: 7, o: 0 };
const L = (x1, y1, x2, y2) => ({ x1, y1, x2, y2, o: 1 });
const shapes = {
  menu: [L(2, 3.5, 12, 3.5), L(2, 7, 12, 7), L(2, 10.5, 12, 10.5)],
  plus: [L(7, 2, 7, 12), L(2, 7, 12, 7), C],
  minus: [{ ...C }, L(2, 7, 12, 7), C],
  close: [L(3, 3, 11, 11), L(11, 3, 3, 11), C],
  // Back chevron drawn so each arm is the nearest cross line: X -> < travels a short way.
  back: [L(4.5, 7, 9, 11.5), L(9, 2.5, 4.5, 7), C],
  check: [L(2.5, 7.5, 5.5, 10.5), L(5.5, 10.5, 11.5, 3.5), C],
  arrow: [L(2, 7, 12, 7), L(8, 3, 12, 7), L(8, 11, 12, 7)],
  chevron: [C, L(5, 3, 9, 7), L(5, 11, 9, 7)],
  play: [L(4, 2.5, 4, 11.5), L(4, 2.5, 11.5, 7), L(4, 11.5, 11.5, 7)],
  pause: [L(4.5, 3, 4.5, 11), C, L(9.5, 3, 9.5, 11)],
};

/** Icon name -> base shape plus rotation. Same shape, different angle: rotate, don't morph. */
export const icons = {
  menu: ["menu", 0], plus: ["plus", 0], cross: ["plus", 45], minus: ["minus", 0],
  close: ["close", 0], back: ["back", 0], check: ["check", 0], play: ["play", 0], pause: ["pause", 0],
  "arrow-right": ["arrow", 0], "arrow-down": ["arrow", 90], "arrow-left": ["arrow", 180], "arrow-up": ["arrow", 270],
  "chevron-right": ["chevron", 0], "chevron-down": ["chevron", 90], "chevron-left": ["chevron", 180], "chevron-up": ["chevron", 270],
};

const SVG = "http://www.w3.org/2000/svg";

/** Create a morphable icon. Returns { el, set(name) }. */
export function createIcon(name = "menu", { size = 20, strokeWidth = 1.5, label } = {}) {
  const svg = document.createElementNS(SVG, "svg");
  svg.setAttribute("viewBox", "0 0 14 14");
  svg.setAttribute("width", size);
  svg.setAttribute("height", size);
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", strokeWidth);
  svg.setAttribute("stroke-linecap", "round");
  if (label) {
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", label);
  } else svg.setAttribute("aria-hidden", "true");
  const g = document.createElementNS(SVG, "g");
  const lines = [0, 1, 2].map(() => g.appendChild(document.createElementNS(SVG, "line")));
  svg.append(g);

  const [base, rot] = icons[name];
  let state = { lines: shapes[base].map((l) => ({ ...l })), rot, base };
  let frame = 0;

  const paint = () => {
    state.lines.forEach((l, i) => {
      lines[i].setAttribute("x1", l.x1);
      lines[i].setAttribute("y1", l.y1);
      lines[i].setAttribute("x2", l.x2);
      lines[i].setAttribute("y2", l.y2);
      lines[i].setAttribute("opacity", l.o);
    });
    g.setAttribute("transform", `rotate(${state.rot} 7 7)`);
  };
  paint();

  function set(nextName, { duration = 300 } = {}) {
    const [nextBase, nextRot] = icons[nextName];
    const from = { lines: state.lines.map((l) => ({ ...l })), rot: state.rot };
    // Within a rotation group keep the geometry and turn the shortest way.
    let delta = ((nextRot - from.rot) % 360 + 540) % 360 - 180;
    const target = { lines: shapes[nextBase], rot: from.rot + delta };
    state.base = nextBase;
    if (label) svg.setAttribute("aria-label", nextName.replace("-", " "));
    cancelAnimationFrame(frame);
    if (reduced()) {
      state.lines = target.lines.map((l) => ({ ...l }));
      state.rot = nextRot;
      return paint();
    }
    const t0 = performance.now();
    const length = ms(duration);
    const tick = (now) => {
      const t = Math.min(1, (now - t0) / length);
      const e = 1 - Math.pow(1 - t, 4); // close to ease.out
      state.lines = from.lines.map((a, i) => {
        const b = target.lines[i];
        const lerp = (k) => a[k] + (b[k] - a[k]) * e;
        // Fade collapsed lines quickly so no dot is ever seen.
        const o = b.o > a.o ? Math.min(1, e * 2) : a.o > b.o ? Math.max(0, 1 - e * 2) : b.o;
        return { x1: lerp("x1"), y1: lerp("y1"), x2: lerp("x2"), y2: lerp("y2"), o };
      });
      state.rot = from.rot + delta * e;
      paint();
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
  }

  return { el: svg, set };
}

/** A light tap where the platform supports it. iOS Safari ignores vibrate(). */
export function haptic(pattern = 8) {
  navigator.vibrate?.(pattern);
}
