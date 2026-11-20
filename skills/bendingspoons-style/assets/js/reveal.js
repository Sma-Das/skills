// Scroll reveals. Three effects, all measured from the source.
//
//   import { blurReveal, rise, slideIn } from "./reveal.js";
//   for (const p of document.querySelectorAll(".bs-statement")) blurReveal(p);
//   for (const el of document.querySelectorAll(".bs-rise")) rise(el);
//   slideIn(document.querySelector(".bs-wordmark"), document.querySelector(".bs-footer"));
//
// Without JS, and with reduced motion, everything is simply visible.

const still = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const clamp = v => Math.min(1, Math.max(0, v));

// One shared scroll loop. Each scrubbed effect gives target() in 0..1 and a
// render(progress). The shown progress chases the target, and `lag` is roughly
// how many seconds it takes to catch up.
const scrubs = new Set();
let frame = 0;
let last = 0;
function tick(now) {
  frame = 0;
  const dt = last ? Math.min(0.1, (now - last) / 1000) : 0.016;
  last = now;
  let moving = false;
  for (const scrub of scrubs) {
    const target = scrub.target();
    const gap = target - scrub.shown;
    if (Math.abs(gap) < 0.0005) {
      if (scrub.shown !== target) { scrub.shown = target; scrub.render(target); }
      continue;
    }
    scrub.shown += gap * (1 - Math.exp((-dt * 4) / scrub.lag));
    scrub.render(scrub.shown);
    moving = true;
  }
  if (moving) schedule(); else last = 0;
}
function schedule() { if (!frame) frame = requestAnimationFrame(tick); }
function addScrub(scrub) {
  if (!scrubs.size) {
    addEventListener("scroll", schedule, { passive: true });
    addEventListener("resize", schedule, { passive: true });
  }
  scrub.shown = scrub.target();
  scrub.render(scrub.shown);
  scrubs.add(scrub);
  return () => {
    scrubs.delete(scrub);
    if (!scrubs.size) {
      removeEventListener("scroll", schedule);
      removeEventListener("resize", schedule);
    }
  };
}

// Rebuild a paragraph as word spans that hold one span per letter. A word never
// breaks, even when part of it sits inside a child element such as .bs-accent:
// the element is cloned into each word it touches. Line breaks are kept.
function split(el, chars) {
  const out = document.createDocumentFragment();
  let word = null;
  let clones = null;

  function holder(chain) {
    let parent = word;
    for (const node of chain) {
      let clone = clones.get(node);
      if (!clone) { clone = node.cloneNode(false); clone.removeAttribute("id"); clones.set(node, clone); parent.append(clone); }
      parent = clone;
    }
    return parent;
  }

  (function walk(node, chain) {
    for (const child of node.childNodes) {
      if (child.nodeType === 1 && child.tagName === "BR") { out.append(child.cloneNode()); word = null; continue; }
      if (child.nodeType === 1) { walk(child, [...chain, child]); continue; }
      if (child.nodeType !== 3) continue;
      for (const letter of child.textContent) {
        if (/\s/.test(letter)) { if (word) out.append(" "); word = null; continue; }
        if (!word) {
          word = document.createElement("span");
          word.className = "bs-word";
          clones = new Map();
          out.append(word);
        }
        const span = document.createElement("span");
        span.className = "bs-char";
        span.textContent = letter;
        holder(chain).append(span);
        chars.push(span);
      }
    }
  })(el, []);

  el.replaceChildren(out);
}

// Letters come into focus as the paragraph crosses the reading line: each goes
// from opacity 0 and blur(20px) to sharp, one after another. The sweep starts
// when the paragraph's top reaches 80% of the viewport height and ends when
// its bottom does.
export function blurReveal(el, { line = 0.8, blur = 20, stagger = 0.05, lag = 0.8 } = {}) {
  if (still()) return () => {};
  const original = el.innerHTML;
  const chars = [];
  el.setAttribute("aria-label", el.textContent.replace(/\s+/g, " ").trim());
  el.setAttribute("role", "paragraph");
  split(el, chars);
  for (const child of el.children) child.setAttribute("aria-hidden", "true");
  if (!chars.length) return () => {};
  const total = 1 + stagger * (chars.length - 1);
  const state = new Float32Array(chars.length).fill(-1);

  const remove = addScrub({
    lag,
    target() {
      const box = el.getBoundingClientRect();
      return clamp((innerHeight * line - box.top) / box.height);
    },
    render(progress) {
      const head = progress * total;
      for (let i = 0; i < chars.length; i++) {
        const t = clamp(head - stagger * i);
        const eased = 1 - (1 - t) ** 3;
        if (Math.abs(eased - state[i]) < 0.004) continue;
        state[i] = eased;
        chars[i].style.opacity = eased.toFixed(3);
        chars[i].style.filter = eased > 0.996 ? "" : `blur(${(blur * (1 - eased)).toFixed(2)}px)`;
      }
    },
  });

  return function destroy() {
    remove();
    el.innerHTML = original;
    el.removeAttribute("aria-label");
    el.removeAttribute("role");
  };
}

// A block rises 100px and fades in once, when its top reaches 80% of the
// viewport height. The CSS on .bs-rise carries the 1s overshoot.
export function rise(el, { line = 0.8 } = {}) {
  if (still()) return () => {};
  let frame = 0;
  el.classList.add("is-armed");

  function check() {
    frame = 0;
    if (el.getBoundingClientRect().top > innerHeight * line) return;
    el.classList.add("is-in");
    stop();
  }
  const schedule = () => { if (!frame) frame = requestAnimationFrame(check); };
  function stop() {
    cancelAnimationFrame(frame);
    removeEventListener("scroll", schedule);
    removeEventListener("resize", schedule);
  }
  addEventListener("scroll", schedule, { passive: true });
  addEventListener("resize", schedule, { passive: true });
  check();

  return () => { stop(); el.classList.remove("is-armed", "is-in"); };
}

// The footer logotype slides down from 80% above its resting place as the
// footer scrolls into view, and lands when the page reaches its end. Its
// parent needs overflow: hidden.
export function slideIn(el, trigger = el.parentElement, { from = -80, line = 0.8, lag = 1 } = {}) {
  if (still()) return () => {};
  const remove = addScrub({
    lag,
    target() {
      const box = trigger.getBoundingClientRect();
      const start = box.top - innerHeight * line;      // 0 when the trigger's top is at the line
      const end = box.bottom - innerHeight;            // 0 when its bottom meets the viewport's
      return end >= start ? 1 : clamp(start / (start - end));
    },
    render(progress) {
      el.style.transform = progress > 0.999 ? "" : `translateY(${(from * (1 - progress)).toFixed(2)}%)`;
    },
  });
  return () => { remove(); el.style.transform = ""; };
}
