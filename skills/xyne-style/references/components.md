# Component recipes

All classes come from [xyne.css](../assets/xyne.css). [The specimen](../assets/specimen.html) shows each recipe in context.

## Page frame

```html
<div class="xs-page">
  <div class="xs-lines" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></div>
  <header class="xs-shell xs-header">…</header>
  <main>
    <section class="xs-shell xs-section">…</section>
  </main>
</div>
```

The rules overlay is absolutely positioned. It paints over unpositioned section backgrounds and under anything positioned. `.xs-card`, `.is-band`, `.is-night`, the header, and the footer are positioned, so they cover the rules. On a custom surface that should hide the rules, add `position: relative`.

## Headings with one highlight

```html
<h2 class="xs-title xs-c3 xs-s4">A <span class="xs-hl">steadier</span> way to run work in the field</h2>
```

- Pick the word that carries the claim, such as an adjective or the product noun. Highlighting a word at the end of a line is fine.
- A heading has at most one highlight, and the page should have no more than about one per band.
- In running text, use `.xs-mark`. It uses the text face with no width change.
- Short stacked headings can each end with a line break instead of a full stop, for example "Product first / Partner led / On site when needed".

## Hero

- Make the field fill the space above the headline, at roughly 60% of the first viewport: `dashField(el)` from [dash-field.js](../assets/js/dash-field.js). Set the host's `color` to `var(--brand)`.
- Options: `lockTouch: true` makes the field a drag surface on touch screens. It blocks page scroll over the field, as the source does, so use it only when the field is short. `idle: true` adds a slow drift when nobody is pointing. `reach` and `falloff` tune the radius and curve.
- Put a mega headline of one to three words bottom left, with mono kickers under it naming three properties.
- Put the lede bottom right with a first-line indent of about 4rem, followed by the `.xs-cta`.
- On phones the field shrinks to about 16rem and everything stacks.

## Feature tiles

Use a grey band containing a grid of six `.xs-card` tiles in two rows of three:

```html
<article class="xs-card">
  <div class="xs-card-art" data-glyph="burst"></div>
  <h3 class="xs-label xs-barlabel">Open source</h3>
  <p class="xs-body">One or two lines that explain the label.</p>
</article>
```

Render the art with `glyph(kind)` from [glyphs.js](../assets/js/glyphs.js), then call `lightGlyph(card)` so strokes near the pointer brighten. Give each card a different glyph, chosen so its shape echoes the idea: a burst for openness, a comb for choice, a frame for containment, a ring for inheritance, waves for flow, an arc for growth over time.

## Red band

The red band holds three statements on columns 1, 3, and 5, each a `.xs-barlabel` (the bar turns white) above a short `.xs-body`. Give it at least twice the usual vertical padding. Keep the copy to three lines or fewer.

## Product rail and panel

A sticky mono index on the left (`.xs-rail`, numbered `01`, `02`, …) sits beside a stack of grey `.xs-panel` sections. Each panel holds a sub-title, a paragraph, an `.xs-checks` list with brand check-circle icons, and a visual: a screenshot in `.xs-frame`, a bar chart, or a diagram.

Link each rail item to its panel's id and call `rail(nav)` from [rail.js](../assets/js/rail.js). It marks the panel under the reading line (35% down the viewport) and sets `--progress` on that link, so the 2px underline fills as you scroll through the panel. Without JS, put `aria-current="true"` in the markup and the underline shows in full. Below 64rem the rail becomes a horizontal scroller that keeps the active item in view.

Inside a mock, an element that floats over the screenshot (a toast, an agent reply) gets `.xs-float`. That is the only shadow in the system.

## Comparison bars with a linked stat

Use this for a head-to-head, such as yours against a baseline and an alternative. Give each series one swatch: ink, brand, and faint. The brand series is always the product. Each `.xs-bar` is a `<button>` with `--v` (0–100) and `data-label`, `data-value`, `data-unit`, and `data-sub`. `bars(root, statCard)` from [bars.js](../assets/js/bars.js) grows the bars in on first view. Hovering, focusing, or tapping a bar dims the rest and counts its value into the `.xs-stat` card, which floats over the panel's left edge in `.xs-float`. Tapping pins a bar, and tapping it again unpins it. The card is `aria-live="polite"`.

## Layered system diagram (light)

Stack these from top to bottom:

1. An `.xs-node` for the consumer.
2. `.xs-streams` connectors. Each is an `.xs-stream.is-up` or `.is-down` with an `<em>` label. Add `.is-brand` for the path that matters.
3. An `.xs-group`, a dashed outline with an `.xs-group-label` on the line, holding `.xs-layer` blocks. Each layer has a hatched `.xs-layer-head` and an `.xs-layer-row` of nodes. Mark the layer that is the product's differentiator `.is-brand`, so it gets a brand hatch and tinted nodes.
4. More connectors, then the source node.

Hovering a layer turns its hatch brand. Hovering a node tints it. Give the whole diagram `role="img"` and an `aria-label` that states the flow in one sentence.

## Dark diagram

Draw architecture or capability maps as stacked rows of `.xs-tile` on an `.is-night` band:

- The top row has `.is-solid` tiles, for the things people use.
- Cross-cutting concerns go in a full-width `.is-hatched` strip, with labels at each end.
- The core rows use plain tiles with a white 6% hairline.
- Policy layers go in a full-width `.is-dashed` strip.
- The bottom row is `.is-solid`, with a `<small>` second line.

Tile text is mono uppercase. Small arrows between rows are optional, at white 30%.

## Buttons

- `.xs-pill` is the header action and compact forms. `.is-ghost` is the secondary.
- `.xs-cta` is the main page action. It needs both spans (`.xs-cta-face`, and `.xs-cta-fill` with `aria-hidden`) so the fill can reveal itself over the face.
- Text links and nav items change to `--brand-ink` on hover. They have no underline unless they appear in running text.

## Applying the style to app screens

Product screens keep the system and drop the marketing devices:

- Keep: the column rules (sidebars and panes start on them), the type roles, mono uppercase section labels with the brand bar, flat tiles on `--surface`, 1px radius, red only for selection, focus, and primary action, and `--brand-ink` for small red text.
- Drop: the hero field, the red band, highlight boxes in UI headings, and section padding. App density uses 8, 12, 16, and 24px.
- Tables: use mono uppercase column headers in `--muted`, tabular figures, hairline row dividers in `--border`, and a brand 2px left bar on the selected row.
- Forms: give inputs a 1px `--border`, a 1px radius, and a `--brand` focus ring. Put labels in Manrope 550 at 13px, not mono.
