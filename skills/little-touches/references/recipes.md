# Recipes

These are web implementations of the touches in [SKILL.md](../SKILL.md). The helpers in [touches.js](../assets/touches.js) have no dependencies, so you can copy them as they are or port them to the product's animation library. If the product already uses Motion, Framer Motion, React Spring, SwiftUI, or Compose, use that library and keep the idea behind each recipe.

The durations and curves here are this skill's starting points. Benji Taylor doesn't publish timings. Tune each value by watching the result at 1× and at 0.5×.

| Use | Curve | Duration |
| --- | --- | --- |
| Arrival, feedback, text and digit changes | `cubic-bezier(0.23, 1, 0.32, 1)` | 240–320ms |
| Something on screen moving to a new place | `cubic-bezier(0.77, 0, 0.175, 1)` | 300–400ms |
| An element travelling to another region, a sheet, or a tray height change | `cubic-bezier(0.32, 0.72, 0, 1)` | 420–560ms |
| Exits | Same curve as the entrance | About 60% of the entrance |

## Travel: move the element itself

Use FLIP. Measure the element, move it in the DOM, measure it again, then animate from the old position to the new one. The element is never cloned, so its state and focus come along with it.

```js
import { moveInto } from "./touches.js";

// After submit: the spinner leaves the button and lands on the Activity tab.
await moveInto(spinner, activityTabBadge).finished;
activityTab.dataset.pending = "true";
```

- The spinner, the amount, or the avatar is the subject. The destination should show what the subject means when it lands, such as a pending ring on the tab.
- If an ancestor with `overflow: hidden` would clip the path, lift the element into a fixed-position layer for the flight, then put it in its final place.
- Same-document View Transitions can do the same job. Give the element a shared `view-transition-name` on both sides, and check whether your target browsers support it.

## Change only what changed in a sentence or label

`morphText` finds the shared start and end of the old and new text. Those tokens stay where they are, or slide if the changed middle gets wider or narrower. Only the middle fades out and in.

```js
import { morphText } from "./touches.js";

morphText(footer, "Learn more about fees");                // word mode
morphText(primaryButton, "Confirm", { by: "char" });      // "Con" stays put
```

- Use char mode for short labels that share letters, and word mode for sentences.
- Avoid char mode for words that share almost nothing. A full swap looks cleaner than one shared "e".
- Fix the button's width, or animate its width, so the layout around it doesn't jump.

## Moving commas

Key each digit by its position from the left, which is the typing order. Key each separator by its group counted from the right. When the number grows, existing digits keep their identity and each comma slides to its new place.

```js
import { renderNumber } from "./touches.js";

input.addEventListener("input", () => renderNumber(display, input.value, { prefix: "$" }));
```

- Use `font-variant-numeric: tabular-nums` so digits don't change width while they move.
- Leave a real input underneath, or give the display an `aria-label` with the formatted value. The helper sets one.
- Shake or tint the amount when it goes over the balance. A small easter egg can go there, but keep the error message.

## Three-line icon morphs

Every icon is three `<line>` elements on a 14×14 grid. An icon that needs fewer lines parks the extras at `{ x1: 7, y1: 7, x2: 7, y2: 7 }` with opacity 0. Icons that differ only by direction share geometry and rotate. Plus and cross are 45° apart, and arrows and chevrons turn in 90° steps.

```js
import { createIcon } from "./touches.js";

const toggle = createIcon("play", { label: "Play" });
button.append(toggle.el);
button.addEventListener("click", () => toggle.set(playing ? "pause" : "play"));
```

- Each `set()` starts from the lines' current coordinates. Clicking quickly reverses the morph cleanly instead of jumping.
- Fade a collapsing line out in the first half of the morph and a growing line in during the first half. That way you never see a stray dot.
- The `back` shape is drawn so each chevron arm is the nearest line of the cross. Close → back then travels a short way instead of spinning.
- For a production icon system with an audit of every pair, use the sibling [morphing-icons](../../morphing-icons/SKILL.md) skill.
- Watch every pair you use. If a midpoint looks wrong, change the starting coordinates or route the morph through rotation.

## Directional tabs

```js
import { slidePanels } from "./touches.js";

const dir = Math.sign(nextIndex - currentIndex); // 1 = moving right
slidePanels(currentPanel, nextPanel, dir);
```

Move the tab indicator with the same easing as the panels. Keep the travel short, around 24–32px. People should see the direction, not a full page sliding across.

## Trays that change height at each step

```js
import { resizeAround } from "./touches.js";

resizeAround(tray, () => { tray.replaceChildren(nextStep); });
closeIcon.set(stepIndex === 0 ? "close" : "back");
```

Give each step a noticeably different height. If two steps end up the same height, change the content until they don't. Each tray has one title, one job, and one icon that closes it or steps back.

## Edge states

- Use the same transition between loading, empty, paused, and filled states that you use between filled states.
- In an empty state, keep the shared text and animate only the noun that changes.
- Keep valid content on screen while it refreshes. Show progress next to it instead of replacing it with a skeleton.

## Haptics and sound

- On the web, `navigator.vibrate` works on Android Chrome. iOS Safari ignores it. In native apps, use the platform's impact, selection, and notification feedback generators, and fire them on the frame where the visual event happens.
- Preload short sounds with the Web Audio API and play them only after a user gesture. Respect mute, and keep sound for rare completions.

## Watch it slowly

```js
import { setSpeed } from "./touches.js";
setSpeed(0.5); // every helper runs at half speed
```

In development, add a toggle that slows every animation. For CSS animations, set `playbackRate` on each item in `document.getAnimations()`. Record the screen at 60fps, step through it, and fix dropped frames before you show anyone.

## Reduced motion

Every helper checks `prefers-reduced-motion: reduce` when it is called. When reduced motion is on, elements still end up in the right place: travel becomes a short fade, morphs jump to their end state, and tray heights change instantly. The meaning stays, so the pending badge still appears and the label still reads "Confirm".
