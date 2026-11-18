# Designing three-line icons

## The data

Each line is `[x1, y1, x2, y2, opacity]` in a 14×14 box. The opacity is 1 for a drawn line and 0 for a parked one. Use the helpers from [icons.js](../assets/js/icons.js):

```js
// my-icons.js. The audit and filmstrip scripts read the ICONS and GROUPS exports, so keep these names.
import { ICONS as BASE_ICONS, GROUPS as BASE_GROUPS, HIDDEN, line, dot, spoke } from "./icons.js";

export const GROUPS = {
  ...BASE_GROUPS,
  // One drawing, many angles. Draw it pointing right; symmetry is the turn after which it looks identical.
  caret: { symmetry: 360, lines: [line(5.5, 4, 8.5, 7), line(5.5, 10, 8.5, 7), HIDDEN] },
};

export const ICONS = {
  ...BASE_ICONS,
  "caret-up": { group: "caret", rotate: -90 },
  "caret-down": { group: "caret", rotate: 90 },
  // Volume as rising bars (a speaker body with curved waves won't fit in three lines).
  volume: { lines: [line(3, 9, 3, 11.5), line(7, 6, 7, 11.5), line(11, 2.5, 11, 11.5)] },
  // Muted keeps the short bar and turns the two tall bars into a cross.
  muted: { lines: [line(3, 9, 3, 11.5), line(6, 4, 12, 10), line(12, 4, 6, 10)] },
  slash: { lines: [line(3.5, 10.5, 10.5, 3.5), HIDDEN, HIDDEN] },
};
```

Pass both to the engine: `mountMorphIcon(el, { icon: "volume", icons: ICONS, groups: GROUPS })`. Check the new icons with `node scripts/audit.mjs --icons ./my-icons.js --only caret-up,caret-down,volume,muted,slash`. The module can also `export default { icons, groups }`.

To make an existing ungrouped drawing part of a rotation group, override its entry. Don't copy its coordinates into a second icon. For example, the bundled `grip` is the `more` row of dots turned 90°, both in the `dots` group.

An icon is either `{ lines }` or `{ group, rotate }`, never both. `spoke(deg, length)` draws a line through the centre at `deg` from vertical, which suits asterisks, sparkles, and slashes.

## Geometry

- **Grid and safe area.** The box is 14 units. Keep every endpoint inside 0.75–13.25 so round caps aren't clipped; the audit enforces this. Most glyphs span 2–12, a 10-unit body, which matches common 24px icon sets drawn at 20px.
- **Stroke.** The default is 1.5 units with round caps and joins. At 20px that is about a 2.1px stroke. Change `strokeWidth` for the whole set, never per icon. A morph between two weights looks like a bug.
- **Optical centre.** Centre the visual mass on (7, 7), not the bounding box. The play triangle sits 0.5 right of centre (x 4.5–12) because its point is light. A check sits slightly low. A chevron's apex is offset so the whole V centres.
- **Rotate about the centre.** Group drawings rotate about (7, 7), so draw the base shape centred on that point. Otherwise it orbits when it turns.
- **Direction convention.** Draw base shapes pointing right. Rotation follows SVG: +90 points down, 180 points left, −90 points up, −45 points up-right.

## Choosing groups

Put icons in one group when one is literally the other turned. Arrow directions, chevron directions, plus and cross (cross is plus at 45°), external (an arrow at −45°), and a caret pair are all examples. Rotation keeps every line rigid, which reads as one object turning instead of a shape rebuilding itself.

Set `symmetry` to the smallest turn that maps the drawing onto itself. A plus is 90, a three-spoke asterisk is 60, and an arrow is 360. The engine turns at most half of that, and on an exact tie it turns clockwise. With a symmetry of 90, cross to plus keeps turning the same way rather than unwinding.

Don't put two drawings in one group just because they look alike. Download and upload are not one drawing rotated: the tray would flip to the top.

## The three-line budget

What fits: bars and stacks (menu, equals, minus), crosses and stars (plus, cross, asterisk), dots (more, grip), V shapes and chevrons, a check, a triangle (play), two bars (pause), arrows with two-line heads, a chevron over a line (download, upload, collapse), a slash, and a "greater than or equal" sign. Some concepts can be redrawn to fit:

| Concept | Three-line form |
| --- | --- |
| Volume / muted | rising bars / the short bar plus a cross (see the example above) |
| Sort ascending / descending | a caret group at −90 and +90 |
| Drag handle | `grip`, which is `more` turned 90° |
| Collapse / expand all | a chevron over a line, flipped, as two icons |
| Bold or code | not recognisable in lines; use a static icon |

What doesn't fit: closed rectangles (stop, square, window, which need four lines), circles and curves (search, refresh, user, clock), and anything with text. When a request needs one of these:

- Offer the nearest three-line form, and say what changes. Stop could become a filled square drawn as one very thick short line, but that breaks stroke consistency. Usually the better answer is an existing glyph with the right meaning.
- Or keep it as a normal static icon outside the morph set, and crossfade it. Draw it in the same 14-unit viewBox with the same 1.5 stroke, round caps, and safe area, so it sits in the same toolbar without looking heavier. A stroked square for stop matches; a filled one looks heavier than everything else.
- Don't raise the line count for one icon. Every icon would then carry a parked fourth line, and every pair needs re-auditing.

## Line pairing and why slot order doesn't matter

When two shapes differ, `planLines` tries all six permutations of the three slots, and both orientations of every visible pair. It then picks the lowest total squared endpoint travel. A line that appears is costed as growing from its midpoint, and a line that vanishes as shrinking into its own. So the engine prefers keeping a line in place to sliding it across the icon. You never have to order an icon's lines to suit every possible partner; with 22 icons there are 462 transitions.

If a specific pair still looks wrong, change the drawing, not the engine. Nudge an endpoint so the least-travel pairing becomes the natural one, or give a parked line a different role. Then confirm with `scripts/filmstrip.mjs` and the sequencer.

## Timing

The bundled spring has stiffness 320, damping 36, and mass 1, with a damping ratio of about 1.0. Motion looks finished in about 370ms at the median and 600ms at most (the audit's `done` column) and fully at rest by about 650ms (`rest`). There's no overshoot. Arrows overshooting their final angle look broken, and the original post called out overshooting rotations as a flaw. To tune it, pass `spring: { stiffness, damping }`. Keep damping at or above `2 * sqrt(stiffness)` to avoid overshoot. Raise stiffness for snappier toolbar toggles, and lower it for a larger hero icon. `timeScale` on the DOM adapter slows everything down for review.

The original demo uses a tween instead: 300ms with `cubic-bezier(0.32, 0.72, 0, 1)` for both the rotation and the line morph, according to its published client code. It feels very similar at rest. The bundled engine uses a spring because a spring keeps velocity when someone clicks again mid-morph. In the Motion variant, `createMotionMorph(name, { transition: { duration: 0.3, ease: [0.32, 0.72, 0, 1] } })` reproduces the original timing.

Under reduced motion, the DOM adapter lands on the target immediately (`set(name, { instant: true })`). Don't replace this with a crossfade unless the product asks for one. The state change is communicated by the control's label either way.

## Building it on Motion

If the project already uses Motion and wants the springs to run there, [morph-motion.js](../assets/js/morph-motion.js) applies the same rules with `motionValue` and `animate`, and takes its planning from `icons.js`. It exposes 16 motion values. In React, bind them to elements (tested with React 19 and motion 14.9):

```jsx
import { motion } from "motion/react";
import { useMemo, useEffect } from "react";
import { createMotionMorph } from "./morph-motion.js";

export function MotionMorphIcon({ icon, size = 20 }) {
  const morph = useMemo(() => createMotionMorph(icon), []);
  useEffect(() => { morph.to(icon, { instant: matchMedia("(prefers-reduced-motion: reduce)").matches }); }, [icon]);
  useEffect(() => () => morph.stop(), []);
  const { lines, angle } = morph.values;
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" aria-hidden="true" style={{ overflow: "visible" }}>
      <motion.g style={{ rotate: angle, originX: "7px", originY: "7px", transformBox: "view-box" }}>
        {lines.map(([x1, y1, x2, y2, opacity], i) => <motion.line key={i} x1={x1} y1={y1} x2={x2} y2={y2} opacity={opacity} />)}
      </motion.g>
    </svg>
  );
}
```

Its default transition is `{ type: "spring", visualDuration: 0.3, bounce: 0 }`. `to()` resolves `true` when it finishes and `false` when a newer call supersedes it. One difference from the bundled engine: when a morph starts, Motion values jump to the baked coordinates, so velocity carries through a retarget within a morph or within a rotation, but not across the switch between them. In practice the switch happens at the start of a morph and isn't visible.

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| Arrow lines bend or the head detaches while turning | The directions are separate icons, so they morph | Put them in one group with `rotate` values |
| A morph spins and reshapes at once | Rotation wasn't baked before the morph | Use `createMorph` or `createMotionMorph`; don't animate the group transform yourself across groups |
| A line streaks in from the middle | A parked line starts at the centre with opacity already visible | Keep parked lines at opacity 0; the planner grows them in place |
| Lines cross over each other mid-morph | The least-travel pairing pairs them across | Adjust one drawing's endpoints, check with a filmstrip |
| Dots don't render | Zero-length lines without round caps | Keep `stroke-linecap="round"`; the adapter adds a 0.001 length |
| Icon looks off-centre while turning | The base drawing isn't centred on (7, 7) | Re-centre the base shape |
| Icon is clipped at the edge | An endpoint is outside the 0.75–13.25 safe area | Pull it in; the audit reports it |
| Rapid clicks queue animations | Each click waits for the previous one | Retarget immediately: call `set()` on every click; never await the previous one |

## The original prompt

The post's starting prompt, which this skill expands on:

> Build an icon component where any icon can smoothly morph into any other. Every icon should use exactly three SVG lines. Icons that need fewer lines collapse the extras to invisible center points. For icons that are the same shape at different rotations (like arrows), use rotation instead of coordinate morphing.

The lesson from the post is to set the constraint before asking for smoothness. Then judge the result by watching it, and say exactly which transition looks wrong.
