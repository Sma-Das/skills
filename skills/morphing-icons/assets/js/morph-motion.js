// The same rules built on Motion (motion.dev) for projects that already depend on it.
// Planning (pairing, baking, shortest turns) comes from icons.js; Motion only runs the springs.
// Tested with motion 14.9. The bundled engine in morph-icon.js needs no dependency and is the default.
import { animate, motionValue } from "motion";
import { DEFAULT_SET, planLines, resolve, rotateLine, shortestTurn } from "./icons.js";

export const TRANSITION = { type: "spring", visualDuration: 0.3, bounce: 0 };

/**
 * createMotionMorph(initial, { icons, groups, transition, onUpdate })
 * `to(name)` returns a promise of true when the transition finishes, or false when a newer one supersedes it.
 * Exposes 16 motion values: values.lines[i][k] (x1, y1, x2, y2, opacity) and values.angle.
 * Bind them to <motion.line> / <motion.g> props in React, or read them in `onUpdate` to write attributes.
 */
export function createMotionMorph(initial, options = {}) {
  const set = { icons: options.icons ?? DEFAULT_SET.icons, groups: options.groups ?? DEFAULT_SET.groups };
  const transition = options.transition ?? TRANSITION; // replaces the default; a tween must not inherit type: "spring"
  let target = resolve(set, initial);
  let frameGroup = target.group;
  const lines = target.lines.map(l => l.map(n => motionValue(n)));
  const angle = motionValue(target.rotate);
  const all = [...lines.flat(), angle];
  if (options.onUpdate) {
    // Sixteen values change in the same frame; report once per frame.
    let queued = false;
    const flush = () => { queued = false; options.onUpdate(read()); };
    for (const v of all) v.on("change", () => { if (!queued) { queued = true; queueMicrotask(flush); } });
  }
  let running = [];
  let release = () => {};

  const read = () => ({ lines: lines.map(l => l.map(v => v.get())), angle: angle.get() });
  const jump = (data, deg) => { data.forEach((l, i) => l.forEach((n, k) => lines[i][k].jump(n))); angle.jump(deg); };
  // A stopped Motion animation never settles, so each transition resolves when it finishes or is superseded.
  const stop = () => { running.forEach(a => a.stop()); running = []; release(); };
  const track = (animations, onFinish) => {
    running = animations;
    return new Promise(resolve => {
      let live = true;
      release = () => { if (live) { live = false; resolve(false); } };
      Promise.all(animations).then(() => {
        if (!live) return;
        live = false;
        onFinish?.();
        resolve(true);
      });
    });
  };

  function to(name, { instant = false } = {}) {
    const next = resolve(set, name);
    if (next.name === target.name && !instant) return Promise.resolve(true);
    target = next;
    stop();
    if (instant) { jump(next.lines, next.rotate); frameGroup = next.group; return Promise.resolve(true); }
    if (frameGroup === next.group) {
      const from = angle.get();
      return track([animate(angle, from + shortestTurn(from, next.rotate, next.symmetry), transition)]);
    }
    // Different shape: bake the angle into the coordinates, pair lines, then move endpoints.
    const now = read();
    const shown = now.lines.map(l => rotateLine(l, now.angle));
    const plan = planLines(shown, next.lines.map(l => rotateLine(l, next.rotate)));
    jump(plan.start, 0);
    frameGroup = null;
    return track(plan.end.flatMap((l, i) => l.map((n, k) => animate(lines[i][k], n, transition))), () => {
      running = [];
      jump(next.lines, next.rotate); // same picture, now in the group's own frame
      frameGroup = next.group;
    });
  }

  return { values: { lines, angle }, to, read, stop, get icon() { return target.name; } };
}
