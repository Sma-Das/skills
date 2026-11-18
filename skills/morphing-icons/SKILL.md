---
name: morphing-icons
description: "Build icons that morph into one another by moving three SVG lines: hamburger to close, play to pause, plus to minus, arrows that turn. Includes a dependency-free engine, React wrapper, sequencer, filmstrips, and a transition audit."
---

# Morphing icons

An icon that turns into another icon explains a state change better than a swap: the menu becomes the close button you are about to press, play becomes pause, an arrow turns to point where you are going. This skill builds that from one constraint. Every icon is exactly three SVG lines, so any icon can become any other by moving line endpoints. The technique comes from Benji Taylor's [Morphing icons with Claude](https://benji.org/morphing-icons-with-claude).

## The rules that make it work

1. **Exactly three lines per icon, always.** The DOM never changes. Only the endpoints and opacity of three `<line>` elements move. A crossfade or `AnimatePresence` swap is the wrong technique: it fades, and nothing transforms.
2. **Park unused lines as invisible centre points.** An icon that needs two lines (plus, check, pause) sets its third to `HIDDEN`, which is `[7, 7, 7, 7, 0]` in the 14×14 box. Opacity hides it, and the engine grows or shrinks it at its own midpoint, so it never streaks in from the centre.
3. **Rotate icons that share a shape. Don't morph them.** Arrow directions, chevron directions, plus and cross, "external" (an arrow at −45°), and more and grip (a row of dots turned 90°) are one drawing at different angles. Interpolating their coordinates makes the lines bend and warp. Put them in a group and the engine turns the whole drawing, along the shortest way given the shape's symmetry. A plus has 90° symmetry, so plus to cross is a 45° turn.
4. **Morphs between different shapes never spin.** When a rotated icon morphs into another shape, the engine bakes the current angle into the coordinates first, then moves the endpoints.
5. **Let the engine pair the lines.** For each morph it tries all six line orderings and both directions of every line, and picks the pairing with the least endpoint travel. Your slot order doesn't decide the path, so menu to minus keeps the middle bar and shrinks the outer two.
6. **Every transition is interruptible.** Endpoints and angle are springs that start from whatever is on screen, keeping their velocity. Clicking mid-morph retargets the motion. Nothing snaps or queues.

## Use the bundled engine

[icons.js](assets/js/icons.js) is a pure ES module with no dependencies. It holds the 22 icons, the rotation groups, the planner, and a near-critically-damped spring (stiffness 320, damping 36, no overshoot). Motion looks finished in about 370ms (median), up to 600ms when lines grow across the whole icon. [morph-icon.js](assets/js/morph-icon.js) mounts it into the DOM and writes attributes once per animation frame. It honours `prefers-reduced-motion` by landing on the target immediately.

```js
import { mountMorphIcon } from "./morph-icon.js";
const icon = mountMorphIcon(button, { icon: "menu", size: 20 });
button.addEventListener("click", () => icon.set(icon.icon === "menu" ? "cross" : "menu"));
```

For React, use [MorphIcon.jsx](assets/react/MorphIcon.jsx): `<MorphIcon icon={open ? "cross" : "menu"} />`. It renders once, and changing `icon` animates. If the project already uses Motion or another animation library and wants the icon built on it, follow the [Motion recipe](references/design.md#building-it-on-motion). Keep the same rules.

Bundled icons: menu, plus, cross, minus, equals, asterisk, more, grip, check, play, pause, download, upload, external, and arrow and chevron in all four directions. To add your own, pass `icons` and `groups` objects that extend the defaults (see the [design reference](references/design.md)).

Accessibility belongs to the control, not the drawing. Put the icon inside a `<button>` whose `aria-label` (or `aria-expanded` / `aria-pressed`) describes the state, and keep the SVG `aria-hidden`, which is the default. Pass `label` only when the icon stands alone. Change the button's label in the same handler that changes the icon.

## Design new icons

Read [the design reference](references/design.md) before you draw anything. In short:

- Draw on the 14×14 grid with endpoints inside 0.75–13.25 (half the stroke width), centred optically on (7, 7). The defaults are a 1.5 stroke with round caps.
- If a shape is an existing drawing at another angle, add it to that group with a `rotate`. Don't give it new coordinates.
- If the glyph needs more than three straight lines (a square, a circle, a magnifier, a gear), it doesn't belong in this set. Say so, and offer the closest three-line version (volume becomes rising bars, for example) or a separate static icon drawn to the same grid and stroke. Don't quietly add a fourth line, because every other icon would then need one. The reference has a table of common redraws.
- Dots are zero-length visible lines (`dot(x, y)`), and round caps draw them.

## Check the feel, not only the code

An agent can confirm that transitions work, but it can't tell when one feels wrong. The original post found the same gap. Give yourself and the user ways to see the motion:

1. `node scripts/audit.mjs [--icons ./my-icons.js] [--only new-a,new-b] [--strict]` validates the set (three lines, hidden lines parked, safe area) and simulates every pair, or only pairs that involve the named icons. It flags lines that pinch mid-morph and endpoints that leave the viewBox.
2. `node scripts/filmstrip.mjs <from> <to> --out /abs/strip.svg` renders the in-between frames as stills, sampled until the motion looks finished. To view one as an image, open `file:///abs/strip.svg` in a browser and screenshot it (for example `agent-browser open` then `agent-browser screenshot`).
3. Serve the skill folder over HTTP and open [the sequencer](assets/sequencer.html). Click icons to build a sequence, then click the preview to step through it. It has autoplay, a ×5 slow motion, a reduced-motion toggle, and a frame strip of the last transition. `?seq=menu,cross,plus` restores a sequence, so the user can send you the exact one that felt off.
4. Ask the user to watch the transitions that matter in their product, such as menu↔cross or play↔pause. Fix what they describe: change a drawing, move a shape into a group, or adjust the spring. Don't argue from the numbers.

Before you finish, run the audit and the tests (`node --test assets/js/icons.test.mjs`). Check reduced motion, rapid repeated clicks, and keyboard activation in the real interface.
