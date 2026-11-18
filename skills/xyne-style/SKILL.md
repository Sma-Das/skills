---
name: xyne-style
description: "Restyle a product or marketing UI in the xyne.ai design language: dashed column rules, one vivid coral-red, wide-set highlight words, mono uppercase labels, flat tiles, and dash-field illustrations."
---

# Xyne style

Use this design language when a project should look and feel like xyne.ai. It is an editorial system: a visible column grid, large display type with one highlighted word, small mono labels, flat white tiles on a cool grey band, and one red used with confidence. Apply the language to the user's own product. Keep their name, logo, copy, and data. Do not reproduce Xyne's wordmark, product names, screenshots, or marketing text.

## Get the structure right first

Most of the look comes from the grid, so set it up before you style anything else. Content sits on a named-line grid of 2, 4, or 6 capped columns (384, 256, 240px) with flexible outer margins. Draw a 1px dashed rule at every column line for the full height of the page. Headings, cards, rails, and paragraphs all start on a rule. A card starts on one rule and stops 2.5rem before the next. A heading usually starts at column 2 or 3 and leaves the columns to its left empty. When something seems out of place, check its alignment to the rules before you change its colour or size.

Build the page from full-width bands that alternate in a set order: white, cool grey `--surface`, a full-bleed red band of three statements, white, a near-black band with a diagram, grey, then the footer on grey. Section padding is large, about `clamp(6rem, 11.5vw, 12.5rem)`. Keep that empty space and don't fill it.

## Typography carries the voice

Use three faces, each for one job:

- **Google Sans Flex** for display, weight 420–450, `"wdth" 96`, `ss01` and `cpsp` on, tracking from -0.02em on titles to -0.045em on the hero.
- **Manrope** for text, weight 500, with slightly positive tracking (+0.015em), which is unusual.
- **Geist Mono** for labels, uppercase, tracked +0.1em, 13–15px.

The signature move is one word per heading set wider (`"wdth" 124`) on a solid red box with near-white text. Use it once per heading, on the word that carries the claim, never on a whole line. Put mono labels above body text. In a card, a 4px red bar runs flush to the card's left edge beside the label. Body copy under a label is muted grey and short, at most two lines in a card. If the project already has a typeface it must keep, keep the roles and swap the face. Roboto Flex is the closest substitute with a width axis for the highlight.

## One colour, used decisively

The chrome is white, `#f5f7fa` and `#1c1e1f`. Coral-red `#ff4f4f` is the only hue. It appears as fills (highlight boxes, the red band, the CTA), as marks (dashes, check icons, the active rail underline), and as large display text. Never introduce a second accent. Status colours belong only inside product UI such as tickets and badges, at small size.

The source page fails WCAG AA in several places: brand-red text on white is 3.24:1 and its muted grey is 4.11:1. The tokens keep `#ff4f4f` for fills, marks, and large text, and add `--brand-ink` and `--cta` (`#d93035`) for small red text and for fills behind small white text, plus a darker `--muted`. Use `data-fidelity="exact"` only when the user explicitly accepts the contrast failures for a marketing page. The [token reference](references/tokens.md) lists every measured value and its contrast.

## Shape, depth, and texture stay quiet

Use a 1px radius on nearly everything, including tiles, dashes, and focus rings. Only pills and CTA discs are fully round, and only product screenshots get 12px corners. Tiles have no border or shadow. The one shadow is a soft drop (`0 12px 28px` at 10% ink) on an element that floats over a screenshot or chart.

Texture comes from three hairline devices, never from noise or gradients:

- a −60° hatch of 0.66px strokes every 6px, in ink at 9%, brand at 16%, or white at 6% on dark
- dashed outlines that group related parts, with a mono label sitting on the line
- stream connectors: a 2px rail at 22% with a glowing pulse that travels along it on a 1.8s loop

Use hatch on layer headers and cross-cutting strips, and keep it out of content areas.

## Make it react to the pointer and the finger

Motion responds to the person and never runs for decoration. Transitions are colour changes at 200ms `cubic-bezier(.4,0,.2,1)`. These pieces react:

- **Hero dash field.** Every pill swings toward the cursor or finger, thickens from 3px to 7.5px, and brightens from 62% to full opacity. The response curve was measured from the source and is documented in [dash-field.js](assets/js/dash-field.js). Touch follows the finger without blocking page scroll. `lockTouch` turns the field into a drag surface, which is what the source does.
- **CTA.** The arrow disc grows into a full pill through a `clip-path` circle over 300ms.
- **Section rail.** The active item turns red and its underline fills with your scroll progress through that section.
- **Glyph cards.** Strokes near the pointer light up, echoing the hero.
- **Comparison bars.** Bars grow in when they scroll into view. Hovering, focusing, or tapping a bar dims the others and counts its value into a linked stat card.
- **Diagram nodes and layers.** They take the brand tint and brand hatch on hover.

All of it respects reduced motion: the field stays still, pulses rest mid-line, and counts jump straight to the value. Every reactive state also has a keyboard or static equivalent.

## Illustrate with dashes

Illustrations are made only of short rounded strokes in brand red at varying opacity: the reactive field in the hero, and a small glyph per feature card (burst, ring, comb, frame, waves, arc). Keep stroke width and opacity range consistent across one page. Don't use photography, gradients, or 3D. The one exception is a single striking cut-out image near the end of the page, and only if the user supplies it.

## Apply it

1. Copy [xyne.css](assets/xyne.css) and the scripts ([dash-field.js](assets/js/dash-field.js), [glyphs.js](assets/js/glyphs.js), [rail.js](assets/js/rail.js), [bars.js](assets/js/bars.js)) into the project, or translate the tokens into its existing system (Tailwind theme, CSS modules, design tokens). Load the three fonts. Self-host them for production after you confirm their licences.
2. Wrap the page in `.xs-page` with the `.xs-lines` overlay as its first child, and lay out each band with `.xs-shell`. Column helpers (`.xs-c3`, `.xs-s4`) only work on direct children of `.xs-shell`.
3. Map the product's content onto the band sequence. Choose one highlight word per heading and one glyph per card. Replace any copy that leans on the source's wording.
4. For app screens rather than marketing pages, keep the grid rules, type roles, mono labels, red-as-mark, and flat tiles, and drop the bands and hero field. The [component recipes](references/components.md) cover the rail, panels, diagrams, bars, tiles, and lists.
5. Check the result against [the specimen](assets/specimen.html) in light, dark, and at 390px wide. Confirm that content starts on the rules, that there's one red highlight per heading, that small red text uses `--brand-ink`, that nothing scrolls horizontally, that the field reacts to touch as well as the mouse, and that focus is visible on every control.
