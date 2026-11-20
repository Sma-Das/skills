# Component recipes

All classes come from [bendingspoons.css](../assets/bendingspoons.css). [The specimen](../assets/specimen.html) shows each recipe in context.

## Page frame

```html
<div class="bs-page">
  <nav class="bs-nav" data-theme="dark">…</nav>
  <main>
    <section class="bs-band is-dark bs-hero" data-nav-theme="dark">…</section>
    <section class="bs-band" data-nav-theme="light"><div class="bs-wrap">…</div></section>
  </main>
  <footer class="bs-footer" data-nav-theme="dark">…</footer>
</div>
```

A band sets the colours for everything inside it, so the same component works on any band:

| Class | Background | Use for | `data-nav-theme` |
| --- | --- | --- | --- |
| `.bs-band` | white | pastel cards | `light` |
| `.bs-band.is-soft` | `#f6f6f6` | white rows, tiles, galleries | `light` |
| `.bs-band.is-dark` | black | hero, figures, statements, carousels | `dark` |
| `.bs-band.is-raised` | `#252525` | black cards | `dark` |
| `.bs-band.is-accent` | lime | proof, documents, the closing action | `accent` |

Add `.is-tall` to a statement band for 200px of padding. Use `.bs-wrap` for text and `.bs-wrap.is-tight` for card grids. Start a band with `.bs-head`, which holds a `.bs-title` and an optional `.bs-lede`.

Don't put two bands of the same colour next to each other unless they belong together, as the hero, figures, and statement do.

## Nav

```html
<nav class="bs-nav" data-theme="dark" aria-label="Main">
  <div class="bs-nav-inner">
    <a class="bs-logo" href="/">Your logo</a>
    <div class="bs-nav-end">
      <a class="bs-nav-cta" href="/roles">See open roles</a>
    </div>
  </div>
</nav>
```

- The home page nav has a logo and one filled pill, nothing else. Secondary pages replace the pill with up to four text links in `.bs-nav-links`. Mark the current one with `aria-current="page"`.
- Call `navTheme(nav)` from [nav-theme.js](../assets/js/nav-theme.js). It reads `data-nav-theme` from the band under the nav and sets the nav's `data-theme`. Without JS, set `data-theme` in the markup to match the first band.
- The nav is fixed, so give the first band top padding of at least the nav height. `.bs-hero` already does.
- `.bs-logo` styles a text logo. For an image logo, use one file that follows `currentColor`, or two files.

## Hero

```html
<section class="bs-band is-dark bs-hero" data-nav-theme="dark">
  <h1 class="bs-display">Small-town cinemas,<br><em class="bs-em">relit</em> and <em class="bs-em">reopened</em></h1>
  <div class="bs-ring" data-ring aria-hidden="true">
    <div class="bs-ring-track">
      <div class="bs-ring-card" style="--tint: var(--tint-yellow)">…</div>
      <!-- twelve cards -->
    </div>
  </div>
</section>
```

- Write the headline as two lines of two to four words. Put `.bs-em` on one or two words: the verbs, or the word that carries the claim.
- Call `ring(el)` from [ring.js](../assets/js/ring.js). Use twelve cards. With fewer, the cards grow and the cylinder tightens; below eight it stops reading as a wall.
- Each card is one image, one muted looping video, or one flat tint with a name. Use the things the page is about: products, projects, places, customers.
- Options: `period` (seconds per turn, 60), `intro` (extra degrees at the start, 27), `introTime` (3), `spread` (gap between cards as a ratio, 1.05).
- The ring is decoration, so hide it from assistive technology and name the same things in a later band.
- A secondary page uses the same headline on white, with `.bs-em` in black and a photo strip or nothing below it.

## Figures

```html
<p class="bs-stat bs-rise"><span class="bs-stat-num">2</span><span class="bs-stat-plus">+ </span>million<span class="bs-stat-desc">seats filled a year</span></p>
```

Stack two to four figures in a black band, one per row. The numeral is serif and lime, the unit is grotesque and white, and the caption is one short phrase. Round the number hard: "2+ million", not "2,140,000". Call `rise(el)` from [reveal.js](../assets/js/reveal.js) on each one.

For a row of small figures, use `.bs-figure` with a `<b>` numeral and a caption.

## Statement

```html
<section class="bs-band is-dark is-tall" data-nav-theme="dark">
  <div class="bs-wrap">
    <p class="bs-statement">We take on cinemas that have gone dark and fold them into <span class="bs-accent">one shared back office</span>.</p>
  </div>
</section>
```

- Use three paragraphs of one or two sentences. Each has one `.bs-accent` phrase of two to four words.
- Call `blurReveal(p)` from [reveal.js](../assets/js/reveal.js) on each paragraph. It splits the text into letters, keeps the sentence in `aria-label`, and never breaks a word.
- On a white band, the same recipe makes a quote list: add `.bs-quote` for the oversized mark and drop the accent phrases.

## Pastel card

```html
<article class="bs-tint" style="--tint: var(--tint-cyan)">
  <div class="bs-tint-body">
    <div class="bs-tint-head">
      <h3 class="bs-tint-name">Vista</h3>
      <a class="bs-chip" href="…">See the programme <svg>…</svg></a>
    </div>
    <ul class="bs-timeline">
      <li class="is-date"><svg>…</svg>Reopened March 2024</li>
      <li>Rebuilt both booths and rewired the house lights</li>
    </ul>
  </div>
  <div class="bs-tint-media">…</div>
</article>
```

- Lay the cards out in `.bs-grid-2` on a white band. Heights may differ between rows.
- The head holds the product's name or logo on the left and one chip on the right. A logo should be about 40px tall and one colour.
- The list has one dated line and three results. Start each result with a past-tense verb and put a number in it.
- The media is product UI, a still, or a muted loop. It touches the card's sides and bottom. Leave no padding under it.
- Add `.is-inverted` for a dark tint such as indigo. Give every card a different tint.
- End the band with `<p class="bs-more">And many more</p>` when the grid is a selection.

## Dark card

```html
<article class="bs-dark-card">
  <div class="bs-dark-card-text">
    <h3 class="bs-serif-title">Reelhouse</h3>
    <h4>Print and file booking</h4>
    <p>One sentence that says what it does.</p>
  </div>
  <div class="bs-dark-card-art"><svg class="bs-wire" viewBox="0 0 652 400">…</svg></div>
</article>
```

- Lay the cards out in `.bs-grid-2.is-snug` on an `.is-raised` band. Each is square from 1280px up.
- The title is a name in upright serif. The sub-title says what kind of thing it is in two to four words. The body is one sentence of about 25 words.
- Draw the art as an isometric wireframe in a 652 by 400 box, anchored to the bottom. Inside `.bs-wire`, plain shapes get a white 40% hairline. Add `.is-faint` for construction lines, `.is-dashed` for hidden edges, `.is-fill` for a 5% face, `.is-accent` or `.is-fill-accent` for the one lit part, and one blurred `.is-glow` ellipse behind it.
- Good subjects: stacked plates, a cube ringed by smaller cubes, rings widening from a point, a sphere under a dome, a chip with traces. One idea per card.
- On a lime or white surface, add `.is-on-light` and the same drawing uses black lines.

## Carousel

```html
<section class="bs-band is-dark bs-carousel" data-nav-theme="dark">
  <h2 class="bs-title">Talks</h2>
  <ul class="bs-carousel-track" tabindex="0" aria-label="Talks, scroll sideways">
    <li class="bs-slide">
      <img src="…" alt="">
      <h3 class="bs-slide-caption">Booth notes with Ines Varga</h3>
      <div class="bs-slide-action"><a class="bs-glass" href="…"><svg>…</svg>Watch</a></div>
    </li>
  </ul>
  <div class="bs-carousel-nav">
    <button class="bs-round" type="button" aria-label="Previous" data-prev>…</button>
    <button class="bs-round" type="button" aria-label="Next" data-next>…</button>
  </div>
</section>
```

The track spans the full band, so don't wrap it in `.bs-wrap`. Call `carousel(el)` from [carousel.js](../assets/js/carousel.js). The track scrolls and snaps without the script; the script adds the 80% scale on side slides, the caption fade, and the buttons. Side slides are inert until they reach the centre.

## Rows

```html
<ul class="bs-rows">
  <li class="bs-row">
    <div><h3><svg>…</svg>Booth school</h3><p class="bs-muted">One line.</p></div>
    <div class="bs-row-meta"><p><svg>…</svg>Place</p><p class="bs-small"><svg>…</svg><time>Date</time></p></div>
    <div class="bs-row-action"><a class="bs-btn is-compact" href="…">Book a place</a><p>Twelve places</p></div>
  </li>
</ul>
```

Use rows on an `.is-soft` band for anything with a title, two facts, and one action: events, jobs, releases. Put a `.bs-rows-label` above each group. A row whose action is not open yet gets `.bs-btn.is-compact.is-ghost`.

## Lime band

The closing band is `.is-accent` with a `.bs-grid-3`: a proof point on each side and a `.bs-feature` card in the middle, then one `.bs-btn` under the grid.

- `.bs-feature` is white with a 60px radius and fades out at the bottom. Put a `.bs-feature-num` in it (with a `<sup>` for "/5" or a unit), a label, and a short stack of quotes that the fade cuts off.
- The side columns hold a drawing or badge and a `.bs-caption`.
- Other things that sit on lime: `.bs-doc` cards in a `.bs-grid-2.is-close`, and `.bs-tilt` person cards with `--tilt` between -2deg and 2deg.

## Documents and tiles

- `.bs-doc` is a white card with a black `.bs-doc-icon` block holding a lime line icon, then a title, one line, and a "Read the document" line with a `.bs-link`.
- `.bs-tile` is a near-square with a line drawing and a two-line label. In a grid, alternate `.is-accent` and plain so lime and white form a checkerboard.

## Buttons

- `.bs-btn` is the main action. Use it once per band. It takes its fill from the band: black on light and lime bands, white on dark. It turns lime on hover.
- `.bs-btn.is-compact` is for rows and forms. `.is-ghost` is the secondary.
- `.bs-nav-cta` is the nav action. It inverts on hover.
- `.bs-chip` is the small link in a card head. It always ends with a 12px up-right arrow.
- `.bs-glass` sits on an image and starts with a 24px icon.
- `.bs-round` is an icon-only arrow button. Give it an `aria-label`.
- Text links in running copy use `.bs-link`: underlined, with the underline dropping 4px on hover.

## Footer

```html
<footer class="bs-footer" data-nav-theme="dark">
  <div class="bs-footer-cols">
    <div><p class="bs-label">Company</p><a href="…" aria-current="page">About us</a>…</div>
    <div class="is-wide"><p class="bs-legal">…</p></div>
  </div>
  <div class="bs-footer-mark">
    <div class="bs-wordmark" aria-hidden="true"><svg viewBox="0 0 1000 182"><text y="160" textLength="1000" lengthAdjust="spacingAndGlyphs">Your name</text></svg></div>
    <p class="bs-tagline">Lights down. <em class="bs-em">Always.</em></p>
  </div>
</footer>
```

- Use three narrow link columns with mono labels, and one wide column on the right for legal text and the address.
- The wordmark fills the width. Use the project's own logotype as an SVG. The text version above is a stand-in that stretches a name to fit.
- The tagline is two or three words in grotesque and one in lime serif italic.
- Call `slideIn(wordmark, footer)` from [reveal.js](../assets/js/reveal.js) so the wordmark slides out from behind the rule as the page ends.

## Applying the style to app screens

Product screens keep the system and drop the marketing devices:

- Keep: Instrument Sans for everything, serif italic for one word in a page title, mono uppercase for small labels, pill buttons, 24px radius on rows and panels, 40px on large cards, lime as the only accent, and the pastel tints as category colours.
- Drop: the bands, the hero ring, the blur reveal, the 100px type, and the 120px padding. App density uses 8, 12, 16, 24, and 32px, and titles top out near 36px.
- Surfaces: `--surface` behind `--card` rows with the row shadow in light, and `#141415` behind `#252525` in dark. No borders on cards.
- Selection and focus: lime fill with black text on dark surfaces, black fill with white text on light ones. Never lime text on a light surface.
- Tables: mono uppercase column headers in `--muted`, 15px medium cells, rows as separate rounded `.bs-row` blocks or divided by a 1px `--border` line.
- Forms: inputs with a 1px `--border`, a 30px radius to match the compact button, and a 2px `--focus` outline.
