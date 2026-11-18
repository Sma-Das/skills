#!/usr/bin/env node
// Validate an icon set and simulate every transition, flagging the ones likely to look wrong.
//   node audit.mjs                       audit the bundled icons
//   node audit.mjs --icons ./my-icons.js a module exporting ICONS and GROUPS
//   node audit.mjs --strict              exit 1 on any error or flagged pair
//   node audit.mjs --only volume,muted   only transitions to or from these icons
//   node audit.mjs --top 20 --all        show more rows, or every pair
import { resolve as resolvePath } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import { DEFAULT_SET, SIZE, isVisible, length, resolve, simulate, visibleLines, visualEnd } from "../assets/js/icons.js";

const MARGIN = 0.75; // half the default stroke width: a round cap past this is clipped by the viewBox
const PINCH = 0.5; // a line that keeps its length end to end should not shrink below half of it mid-morph

/** Structural problems that break the three-line contract. Returns a list of messages. */
export function validate(set = DEFAULT_SET) {
  const errors = [];
  for (const [name, icon] of Object.entries(set.icons)) {
    let r;
    try { r = resolve(set, name); } catch (e) { errors.push(e.message); continue; }
    if (!Array.isArray(r.lines) || r.lines.length !== 3) { errors.push(`${name}: needs exactly 3 lines`); continue; }
    r.lines.forEach((l, i) => {
      if (l.length !== 5 || l.some(n => typeof n !== "number" || !Number.isFinite(n))) errors.push(`${name}: line ${i} must be [x1, y1, x2, y2, opacity]`);
      else if (!isVisible(l) && l[4] !== 0) errors.push(`${name}: line ${i} opacity must be 0 or 1`);
      else if (isVisible(l) && l[4] !== 1) errors.push(`${name}: line ${i} opacity must be 0 or 1`);
      else if (!isVisible(l) && !(l[0] === SIZE / 2 && l[1] === SIZE / 2 && l[2] === SIZE / 2 && l[3] === SIZE / 2)) errors.push(`${name}: hidden line ${i} should be HIDDEN (centre point)`);
    });
    for (const l of visibleLines({ lines: r.lines, angle: r.rotate })) {
      if (!isVisible(l)) continue;
      for (const n of l.slice(0, 4)) if (n < MARGIN - 1e-6 || n > SIZE - MARGIN + 1e-6) errors.push(`${name}: endpoint ${n.toFixed(2)} is outside the safe area ${MARGIN}–${SIZE - MARGIN}`);
    }
    if (!r.lines.some(isVisible)) errors.push(`${name}: has no visible line`);
    if (icon.group && icon.lines) errors.push(`${name}: set either group or lines, not both`);
  }
  return [...new Set(errors)];
}

/** Simulate one transition and measure it. */
export function measure(set, from, to) {
  // The final frame re-seats lines in the target's slot order; measure up to the frame before it.
  const raw = simulate(from, to, set);
  const all = raw.map(visibleLines);
  const frames = all.length > 2 ? all.slice(0, -1) : all;
  const first = frames[0], last = frames.at(-1);
  let pinch = 1, clip = 0, travel = 0;
  for (let i = 0; i < 3; i++) {
    const keep = isVisible(first[i]) && isVisible(last[i]) && length(first[i]) > 0.5 && length(last[i]) > 0.5;
    const floor = Math.min(length(first[i]), length(last[i]));
    for (let f = 1; f < frames.length; f++) {
      const l = frames[f][i], p = frames[f - 1][i];
      if (keep) pinch = Math.min(pinch, length(l) / floor);
      if (l[4] > 0.1) for (const n of l.slice(0, 4)) clip = Math.max(clip, MARGIN - n, n - (SIZE - MARGIN));
      if (l[4] > 0.1 || p[4] > 0.1) travel += Math.hypot(l[0] - p[0], l[1] - p[1]) + Math.hypot(l[2] - p[2], l[3] - p[3]);
    }
  }
  const flags = [];
  if (pinch < PINCH) flags.push(`pinch ${(pinch * 100).toFixed(0)}%`);
  if (clip > 0.05) flags.push(`clips ${clip.toFixed(2)}`);
  return { from, to, rotation: resolve(set, from).group === resolve(set, to).group, frames: all.length, done: Math.round(visualEnd(raw) * 1000 / 60), ms: Math.round((all.length - 1) * 1000 / 60), pinch, clip, travel, flags };
}

export function audit(set = DEFAULT_SET) {
  const names = Object.keys(set.icons), pairs = [];
  for (const a of names) for (const b of names) if (a !== b) pairs.push(measure(set, a, b));
  return { errors: validate(set), pairs };
}

async function main(argv) {
  const arg = flag => { const i = argv.indexOf(flag); return i >= 0 ? argv[i + 1] : undefined; };
  let set = DEFAULT_SET;
  if (arg("--icons")) {
    const mod = await import(pathToFileURL(resolvePath(arg("--icons"))).href);
    set = { icons: mod.ICONS ?? mod.default?.icons, groups: mod.GROUPS ?? mod.default?.groups ?? {} };
  }
  const { errors, pairs: every } = audit(set);
  const only = arg("--only")?.split(",").filter(Boolean);
  if (only) for (const n of only) if (!set.icons[n]) errors.push(`--only: unknown icon "${n}"`);
  const pairs = only ? every.filter(p => only.includes(p.from) || only.includes(p.to)) : every;
  const flagged = pairs.filter(p => p.flags.length);
  for (const e of errors) console.log(`ERROR  ${e}`);
  const rows = argv.includes("--all") ? pairs : [...flagged, ...pairs.filter(p => !p.flags.length).sort((a, b) => b.travel - a.travel)].slice(0, Number(arg("--top") ?? 12));
  console.log(`\n${"from → to".padEnd(34)} ${"kind".padEnd(8)} ${"done".padStart(5)} ${"rest".padStart(5)} ${"pinch".padStart(6)} ${"travel".padStart(7)}  flags`);
  for (const p of rows) console.log(`${`${p.from} → ${p.to}`.padEnd(34)} ${(p.rotation ? "rotate" : "morph").padEnd(8)} ${String(p.done).padStart(5)} ${String(p.ms).padStart(5)} ${`${(p.pinch * 100).toFixed(0)}%`.padStart(6)} ${p.travel.toFixed(1).padStart(7)}  ${p.flags.join(", ")}`);
  console.log(`\n${Object.keys(set.icons).length} icons, ${pairs.length} transitions${only ? ` involving ${only.join(", ")}` : ""}, ${errors.length} errors, ${flagged.length} flagged.`);
  console.log(`done: ms until it looks finished (longest ${Math.max(...pairs.map(p => p.done))}). rest: ms until the spring stops (longest ${Math.max(...pairs.map(p => p.ms))}).`);
  console.log("pinch: shortest a kept line gets mid-morph, as a share of its length. travel: total endpoint distance.");
  console.log("Flags are prompts to look, not verdicts: open the sequencer or a filmstrip for each one.");
  if (argv.includes("--strict") && (errors.length || flagged.length)) process.exitCode = 1;
}

if (process.argv[1] && resolvePath(process.argv[1]) === fileURLToPath(import.meta.url)) await main(process.argv.slice(2));
