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

- Make the field fill the space above the headline, at roughly 60% of the first viewport: `dashField(el)` from [dash-field.js](../assets/js/dash-field.js).
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

Render the art with `glyph(kind)` from [glyphs.js](../assets/js/glyphs.js). Give each card a different glyph, chosen so its shape echoes the idea: a burst for openness, a comb for choice, a frame for containment, a ring for inheritance, waves for flow, an arc for growth over time.

## Red band

The red band holds three statements on columns 1, 3, and 5, each a `.xs-barlabel` (the bar turns white) above a short `.xs-body`. Give it at least twice the usual vertical padding. Keep the copy to three lines or fewer.

## Product rail and panel

A sticky mono index on the left (`.xs-rail`, numbered `01`, `02`, …) sits beside a grey `.xs-panel`. The panel holds a sub-title, a paragraph, an `.xs-checks` list with brand check-circle icons, and a full-width `.xs-frame` with a screenshot or mock. Set `aria-current="true"` on the active item. Drive it with an IntersectionObserver when each product has its own panel. Below 64rem the rail becomes a horizontal scroller.

Inside a mock, an element that floats over the screenshot (a toast, an agent reply) gets `.xs-float`. That is the only shadow in the system.

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
