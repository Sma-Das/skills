# Isometric illustrations

The dark cards on bendingspoons.com each carry one line illustration. This page says what makes those drawings work, and how to make new ones for any subject with [iso.js](../assets/js/iso.js). [The gallery](../assets/isometric.html) shows eleven example scenes on black, lime, and white, and [iso-scenes.js](../assets/js/iso-scenes.js) holds their source.

## What the source does

The eight source drawings were studied from 2x crops of each card and from the Lottie files the page loads. Five are vector files of 9 to 36 layers. One mixes vector traces with image layers. Two (the cube ring and the stacked panels) are 150-frame image sequences, so only their look could be studied.

**Projection.** Flat faces lie on an isometric grid. Diamonds measure about 1.85 times wider than tall, which puts the ground axes about 28 degrees above horizontal, close to the true 30. Verticals are vertical. Scenes built from discs and domes use a lower camera: the circles are 2.9 to 3.8 times wider than tall, which is an axis angle of 15 to 19 degrees. Nothing has perspective. Parallel lines stay parallel.

**Solids.** A solid is drawn one of four ways, and one drawing mixes at most three of them:

- Opaque. Three faces with no outline. The top is the lightest (grey 33% at the back to 53% at the front), the left face is tinted green and fades down, the right face is nearly black. It hides everything behind it.
- Glass. A bright outline with a faint gradient inside, 3% to 14%. Layers behind show through.
- Wire. Visible edges at about half strength. Hidden edges are either left out or dashed at about a quarter strength.
- Ghost. Every edge dashed. It means a slot, a copy, or something not there yet.

**Lines.** Strokes are 1 to 1.5px at card size and never heavier than 2.5px. Brightness carries the hierarchy: the hero outline is near full white or lime, secondary edges sit near 45%, and floor lines fall from 30% to nothing. Long lines fade out before they reach the card edge. Dashes are about 5 on and 4 off.

**Depth.** Five cues do the work, in this order of use:

1. Occlusion. Nearer solids cover farther ones, and a ring around a solid passes behind it and then in front.
2. A floor: concentric outlines or a grid under the hero, fading outward, with the outermost outline dashed.
3. Stacking. The same plate repeated up the vertical, evenly spaced, the lower copies fainter.
4. Brightness. Things farther from the viewer are dimmer.
5. A soft glow on the floor under the lit part. There are no cast shadows.

**Colour.** Lines are white. Green comes in two strengths. A muted sage (`#83a36f`) carries secondary green lines and the tint of faces. The page's lime (`#c7ff9f`) is saved for one element: one outline, one ring, or one set of small lights. A drawing has one lit thing or one lit kind of thing, never two.

**Detail.** Each drawing is one hero and one supporting motif repeated: a column and floor rings, a chip and fourteen traces, a cube and six satellites, a sphere and a dome. There is no text. Where text or data is implied, it is three to five short strokes on a top face.

**Composition.** The drawing fills the lower 60% of a square card under the centred text. The hero is centred and 40 to 75% of the card wide. The floor and long lines run off the sides and bottom, and the hero itself is often cut by the bottom edge. The top third of the art area stays black.

**Motion.** Every file loops in 5 or 6 seconds, and little moves:

- Layers breathe: they rise 5 to 7% of the frame height over 2 seconds, hold for a fifth of a second, and settle over 2.4 seconds, on an ease like `cubic-bezier(.65,0,.29,1)`. Repeated layers start 0.12 to 0.16s apart.
- Glows pulse from 0 to 60% and back.
- Dashes march along their path at constant speed.
- Short bright segments travel along traces, one per trace, out of step with each other.
- Small points drift in and fade.

Nothing spins, bounces, or changes shape.

## The tool

`iso.js` turns a scene description into one SVG string. It has no dependencies and runs in the browser and in Node.

```js
import { mount, render, play } from "./js/iso.js";

mount(element, scene);                 // put it in the page; returns a function that re-renders
const svg = render(scene);             // or get the string
play(element, seconds => scene);       // re-render every frame, for motion CSS cannot do
```

```sh
node scripts/iso-render.mjs scene.json art.svg            # a JSON scene
node scripts/iso-render.mjs scene.mjs art.svg --theme lime # a module that default-exports a scene
node scripts/iso-render.mjs --scene stack art.svg          # one of the examples; --list names them
```

Use `mount` when the page already runs scripts. Use the script to write a static file when it does not, or when the art should appear with scripts off.

### Space

x runs down and to the right, y runs down and to the left, z runs up. One unit is the same length on all three. The viewer looks from positive x, y, and z, so every solid shows its top, its +x face on the right, and its +y face on the left. `at` is the centre of an item's base.

### Scene

```js
{
  width: 652, height: 400,   // the viewBox; the dark-card art area
  angle: 30,                 // axis angle. 30 is isometric. 15 to 24 suits discs, domes, funnels
  theme: "dark",             // "dark", "light" (on white), or "lime" (on the lime band)
  scale: 60,                 // pixels per unit. Leave it out to fit the content to the frame
  align: "bottom",           // where the content sits: "center", "bottom", "top"
  offset: [0, 30],           // then nudge it, in pixels. A positive y lets the hero run off the bottom
  padding: 24,               // space kept clear when fitting
  weight: 1.25,              // base stroke width
  depthFade: 0.35,           // how much the farthest things dim. 0 turns it off
  label: "Four stacked plates, the top one lit",   // the accessible name. Without it the SVG is hidden
  items: [ … ]
}
```

Only solids and free lines count when fitting. Floors, glows, drop lines, dots, and labels do not, so they can run off the frame. Give any item `fit: false` to leave it out, or `fit: true` to count it.

### Solids

| Type | Size options | Notes |
| --- | --- | --- |
| `box` | `size: [w, d, h]` | `turn` rotates it in the ground plane, in degrees |
| `slab` | `size: [w, d, h]`, `radius` | A thin box. `radius` rounds the corners |
| `plate` | `size: [w, d]`, `radius` | Flat: an outline and a top face |
| `cylinder` | `radius`, `height` | |
| `disc` | `radius` | A flat circle |
| `hex` | `radius`, `height` | |
| `prism` | `radius`, `sides`, `height`, `taper` | Any regular base. `taper` below 1 narrows the top |
| `cone` | `radius`, `height` | |
| `pyramid` | `size: [w, d]`, `height` | `sides` makes other bases |
| `sphere` | `radius` | Sits on `at`. `equator: true` adds a ring |
| `dome` | `radius` | Half a sphere. `meridians: [0, 90]` adds arcs |

Any solid also takes `outline: [[x, y], …]`, a counter-clockwise base shape of your own.

Every solid takes these:

| Option | Values | Effect |
| --- | --- | --- |
| `material` | `"solid"`, `"panel"`, `"glass"`, `"wire"`, `"ghost"` | See below. The default is `"wire"` |
| `accent` | `true` | The lit part: lime outline, green-tinted faces, a glow on the floor under it |
| `tone` | `"ink"`, `"sage"`, `"accent"` | Line and tint colour without the glow |
| `opacity` | 0 to 1 | Dims the whole item |
| `hidden` | `true` or a number | Draw back edges dashed |
| `dash` | `true` or `[on, off]` | Dash the edges |
| `stroke` | `{ color, opacity, width, dash }` | Override the edge |
| `fill` | `{ color, top: [a, b], left: [a, b], right: [a, b], base }` | Override face tints. Pairs run back to front on top, top to bottom on sides |
| `glow` | `false` or a strength | For an `accent` item |
| `layer` | number | Draw order across the scene. Floors use -1, solids 0. Higher is later |
| `animate` | see Motion | |

Materials:

- `solid` hides what is behind it, has no outline, and shades its three faces. Use it for one heavy hero.
- `panel` hides what is behind it and keeps a bright outline. It is the workhorse for clusters.
- `glass` has an outline and faint faces, and shows what is behind. Use it for stacked layers.
- `wire` is edges only. Add `hidden: true` for dashed back edges.
- `ghost` is dashed edges only.

### Lines and marks

| Type | Options | Use |
| --- | --- | --- |
| `ring` | `radius` or `outline`, `at`, `dash`, `opacity` | A circle or outline as a line. It passes behind and in front of solids correctly |
| `rings` | `shape: "round"`, `"square"`, `"circle"`; `count`, `size`, `step`, `tinted` | The floor: concentric outlines that fade outward. The last is dashed |
| `grid` | `size`, `step`, `opacity` | The other floor: a square grid that fades to its edges |
| `line` | `points: [[x, y, z], …]`, `round`, `fade: "end"`, `"start"`, `"both"`, `dash`, `travel` | Any polyline. `round` softens corners. `travel: true` adds a moving segment |
| `link` | `from`, `to`, `via: "xyz"` | A connector that runs along the axes in the order given, with a dot at each end |
| `drop` | `at`, `to` | A dashed vertical down to the floor with a small ring |
| `dot` | `at`, `radius`, `accent` | A point. With `accent` it has a halo |
| `rows` | `at`, `size: [w, d]`, `rows` | Short strokes on a top face, standing in for text |
| `glow` | `at`, `radius`, `strength` | A soft light on the floor |
| `label` | `at`, `text`, `plane: "screen"`, `"x"`, `"y"`, `"top"` | Mono uppercase text. The source uses none; one or two at most |

### Composites

These expand into plain items and can nest.

| Type | Options | Makes |
| --- | --- | --- |
| `group` | `at`, `items` | Items moved together |
| `stack` | `count`, `gap`, `item`, `accent: index`, `fade`, `animate` | Copies up the z axis. `fade` dims the lower ones. `animate: true` makes them breathe apart |
| `array` | `count: [nx, ny]`, `step`, `item`, `heights`, `accent: index`, `skip` | Copies on a ground lattice |
| `orbit` | `count`, `radius`, `item` or `items`, `turn`, `lift`, `accent`, `spokes` | Copies on a circle, joined by a line |
| `steps` | `count`, `step`, `heights` or `base` and `rise`, `axis`, `accent` | Copies along an axis with changing height |

### Motion

Motion is CSS inside the SVG, and it only runs under `prefers-reduced-motion: no-preference`.

| `animate` | Effect |
| --- | --- |
| `"float"` or `{ type: "float", amp: 0.25, delay, duration }` | Rise `amp` units and settle, on the source's timing |
| `"pulse"` or `{ type: "pulse", low: 0.35 }` | Fade down to `low` and back |
| `"march"` | On a dashed line: the dashes move along it |
| `travel: true` on a `line` or `link` | A short bright segment runs the path. Use `delay` to put several out of step |

The loop is 5 seconds. Use `play` only for motion that changes geometry, such as turning a box with `turn`. It pauses off screen and draws one still frame under reduced motion.

### Colour

The SVG takes its line colour from `color`, so it follows the text around it. Four custom properties re-colour a mounted drawing without rendering it again: `--iso-ink` for lines, `--iso-surface` for the fill that hides things behind a solid, `--iso-hot` for the lit part, and `--iso-soft` for secondary green. Set `--iso-surface` to the background the drawing sits on. `bendingspoons.css` does this for dark cards.

## Composition patterns

Each has an example in [iso-scenes.js](../assets/js/iso-scenes.js). Start from the nearest one.

| Pattern | Example scenes | Good for | Recipe |
| --- | --- | --- | --- |
| Hero on a plate | `dome`, `beacon` | One product, one idea, focus | One solid or sphere, a `rings` floor or a disc, a glow. Let the bottom edge cut it |
| Stacked layers | `stack`, `database` | Storage, versions, layers of a system, history | A `stack` of 3 to 5 glass slabs or panel cylinders, the top or middle one lit, `rings` under it |
| Cluster on a grid | `seats`, `city` | Many of something, capacity, a market, a fleet | An `array` of panel boxes with varied `heights` on a faint `grid`, one lit |
| Hub and ring | `orbit` | Integrations, a team, monitoring, a network | A panel core and an `orbit` of 5 to 7 smaller solids in two or three materials, two lit |
| Steps | `steps` | Growth, ranking, progress, pricing tiers | A `steps` run of panel boxes, a dashed trend `line` over the tops, a lit dot at the peak |
| Flow | `pipeline`, `chip` | Pipelines, payments, delivery, attribution | Stations joined by `link`s with `travel`, or one flat hero with many fading `line`s that leave the frame |
| Funnel | `funnel` | Filtering, intake, selection, search | `ring`s that shrink as z falls, a lit disc at the bottom, a low `angle` |

## Designing a new illustration

1. **Name the idea in three words.** "Routes many requests." "Keeps old versions." Draw the verb, not the product. If you cannot say it in three words, the drawing will not say it either.
2. **Pick the pattern.** Match the verb to the table above: many things is a cluster, layers is a stack, movement is a flow, choosing is a funnel, one thing is a hero on a plate. Use a different pattern for each card on a page.
3. **Block it out.** Write the hero as one or two solids near the origin in whole units, 2 to 4 units wide. Add the supporting motif as one composite. Render it with no materials, no accent, and no floor, and check that the silhouette reads.
4. **Choose the lit part.** One item, or one kind of item, gets `accent: true`. It should be the thing the three words are about. Everything else is white or sage.
5. **Assign materials.** Make the hero `panel` or `solid`, layers `glass`, and things that are possible or absent `ghost`. Use two or three materials in a drawing, not all five.
6. **Add the floor.** Use `rings` under a single hero or `grid` under a cluster. Keep its opacity under 0.3 so it sits back.
7. **Frame it.** Set `scale` so the hero is 40 to 75% of the width, `align: "bottom"`, and an `offset` that lets the floor, and often the hero, run off the bottom. Leave the top third empty.
8. **Add at most two motions.** Use a float on the hero or a breathing stack, plus a pulse or a travelling segment. Stagger repeated items with `delay`.
9. **Check it small.** Look at it at card size and in a 390px viewport, where it is about 340px wide. Lines must stay distinct, and the lit part must be the first thing seen. If it is busy, remove items before lowering opacity.
10. **Write the `label`.** Describe what is drawn in one sentence, or leave it out when the card text already says it.

## Do and don't

- Do keep one lit element. Don't light two unrelated things.
- Do repeat one supporting shape. Don't add a second kind of decoration.
- Do let the floor and long lines leave the frame. Don't draw a border or a ground plane with edges inside the card.
- Do keep every edge on the three axes, apart from circles and the sides of cones. Don't rotate solids to arbitrary angles in a still drawing.
- Do use opacity for hierarchy. Don't use stroke width above 2px or colour other than white, sage, and lime.
- Do use `ghost` and dashes for things that are absent, optional, or hidden. Don't dash for decoration.
- Do use `rows` where text would be. Don't put words, numbers, logos, or icons in the drawing.
- Do let solids overlap in depth. Don't line them up so that edges of different solids meet on screen: move one by half a unit.
- Don't use perspective, cast shadows, textures, or gradients across more than one face.
- Don't copy a source drawing. Its subjects (a circuit brain, a portrait panel) belong to Bending Spoons. The patterns are free to use.

## On light bands

Pass `theme: "lime"` on the lime band and `theme: "light"` on white or grey. Lines turn black, tints turn dark green, glows become a faint green wash, and halos are dropped. The lit part is black rather than lime, at a slightly heavier weight, because lime cannot be seen on either background. The same scene works in all three themes, so one description can serve a dark card and a lime tile.

On light bands, prefer `panel` and `wire`. `solid` reads as a grey block, and `glass` layers lose their separation, so raise a glass `fill.top` to about `[0.06, 0.2]`.

## Limits

- Ordering is by axis-aligned boxes. Solids that interpenetrate, or a `turn`ed box that overlaps a neighbour's box, can be drawn in the wrong order. Keep a small gap between solids.
- Lines never hide each other, and a `glass` or `wire` solid hides nothing.
- A sphere is a shaded circle. It cannot be cut by a plane, so put a ring behind it and a disc under it rather than through it.
- Curves are 64-segment polygons. Above about 600px across, raise `segments`.
- A scene of many `panel` boxes is large: the 24-box example is 56KB of SVG. Prefer `wire` for the far rows, or fewer items.
