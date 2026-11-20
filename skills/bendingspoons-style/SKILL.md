---
name: bendingspoons-style
description: "Restyle a product or marketing site in the bendingspoons.com design language: full-bleed black, white, and lime bands, a tight grotesque with serif-italic emphasis, very round pastel cards, isometric line illustrations, and blur-in scroll motion."
---

# Bending Spoons style

Use this design language when a project should look and feel like bendingspoons.com. It is a poster system: full-bleed bands of black, white, and one lime, very large centred type with one or two words in serif italic, and very round cards that carry all the colour. Apply the language to the user's own product. Keep their name, logo, copy, and data. Do not reproduce Bending Spoons' logo, wordmark, product names, photography, videos, or marketing text.

## Get the structure right first

Build the page from full-width bands. Each band has one background and one job. There are five backgrounds: black `#000`, white, soft grey `#f6f6f6`, raised black `#252525`, and lime `#c7ff9f`. The home page runs black (hero, figures, statement), white (product cards), raised black (dark cards), black (carousel), lime (proof and the call to action), then a black footer. Secondary pages are mostly white and soft grey with lime bands between.

Inside a band, content sits in one container capped at 1440px. Gutters are 64px for text and 48px for card grids, the nav, and the footer, and 24px on phones. Band padding is 120px top and bottom, 200px around a statement, and 80px on phones. Centre almost everything: headings, ledes, card grids, and the action under them. Card grids are two equal columns that collapse to one below 1024px. Nothing is left-aligned except the statement paragraphs, list rows, and the footer.

A band holds one idea. Give it a centred title, one grid or one list, and at most one button. When something seems crowded, split it into two bands before you shrink anything.

## Typography carries the voice

Use three faces, each for one job. All three are free on Google Fonts, so there is nothing to substitute.

- **Instrument Sans** for everything by default. Display sizes are weight 400 with very tight tracking: -0.06em on the 100px hero, -0.04em on 67px titles, -0.02em on text. Line height is 0.93 to 1 on display and 1.3 on text.
- **Instrument Serif** for emphasis. Set one or two words of a display line in serif italic, set the numeral of a big figure in upright serif, and set dark-card titles in upright serif at 42px.
- **Fragment Mono** for labels: 14px, uppercase, used only for footer column headings and small captions.

The signature move is the mixed line: grotesque words with one or two serif-italic words inside it at the same size. On a dark band the italic words are lime. On white, grey, and lime bands they stay black. Never set a whole heading in serif italic, and never use more than two italic words in a line.

Long-form claims are statements: 64px grotesque (32px on phones), left-aligned, three short paragraphs, each with one phrase in lime. Big figures stack one per row: a 185px serif numeral in lime, a 125px grotesque unit beside it, and a 32px caption under it.

## Colour comes in bands and cards

The chrome is black and white. Lime `#c7ff9f` is the only accent. It appears as emphasis text on black, as a whole band, as a tile fill, as an icon colour on a black block, and as the hover fill of the main button. Never put lime text on white: it is 1.15:1.

All other colour belongs to cards. Each product card gets one flat pastel from a set of ten (cyan `#72e5ff`, lime `#d3efab`, blush `#ffe3e3`, orange `#ffa575`, lavender `#efe9fe`, olive `#e2e2a0`, yellow `#ffcb00`, sky `#c1d6f9`, pink `#ffc9ee`, indigo `#5867ed`). Text on a pastel is black. Indigo is the one dark tint and takes white text. Give neighbours different tints and never repeat one on a page.

The source fails WCAG AA in three places: bullet copy on the pastel cards is black at 50% (3.4 to 3.8:1), bullets on the indigo card are white at 50% (2.3:1), and footer labels and legal text are white at 40% (3.66:1). The tokens raise these to 64%, 100%, and 60%. Use `data-fidelity="exact"` only when the user explicitly accepts the contrast failures. The [token reference](references/tokens.md) lists every measured value and its contrast.

The source has no dark mode. The skill derives one: white and grey bands turn off-black (`#141415`, `#1c1c1d`), white cards turn `#252525`, emphasis turns lime everywhere, and the black bands, the lime band, and the pastel cards stay exactly as they are.

## Shape, depth, and texture

Corners are very round, and the radius grows with the size of the thing: 24px on list rows and icon blocks, 32px on hero cards, 40px on dark cards, tiles, and slides, 50px on pastel cards, 60px on the white card that sits on the lime band. Buttons, chips, and arrow buttons are full pills. Nothing has a square corner. On phones the large radii drop to 36px and slides to 20px.

Cards have no borders. Depth comes from three things:

- a glow under each pastel or black card in the card's own colour: `0 100px 100px -100px <colour>`
- a soft, wide shadow under white rows and document cards (`0 10px 24px` at 5%, `0 12px 57px` at 10%)
- glass: the fixed nav is a 10% tint with a 16px backdrop blur, and the pill over a slide is 30% black with an 8px blur

Hairlines are rare: 1px at white 5% under the nav and above the footer wordmark, 1px at 30% around arrow buttons. The only gradients are the 56px rules that fade out beside "and many more", the dark fade over a slide, and the fade on a pastel card's bullet rule.

## Motion blurs in and drifts

Motion is slow and soft. Hover transitions are colour changes at 150 to 300ms on `cubic-bezier(.4,0,.2,1)`. These pieces move:

- **Hero card ring.** Twelve 3:4 cards stand on a cylinder, face inward, and turn once every 60s at constant speed. The values were read from the source and are documented in [ring.js](assets/js/ring.js). The ring does not react to the pointer or to scroll.
- **Hero entrance.** The headline rises 50px and fades in over 1s. Half a second later the ring rises 150px and goes from `blur(3px) grayscale(1)` to sharp colour.
- **Blur reveal.** Statement paragraphs come into focus letter by letter as they cross the reading line at 80% of the viewport. Each letter goes from opacity 0 and `blur(20px)` to sharp. [reveal.js](assets/js/reveal.js) ties it to scroll with 0.8s of lag.
- **Figures.** Each figure rises 100px and fades in once, over 1s with a slight overshoot.
- **Nav.** The fixed nav swaps between light-on-dark and dark-on-light to match the band under it, over 300ms ([nav-theme.js](assets/js/nav-theme.js)).
- **Carousel.** The centred slide is full size and its neighbours sit at 80%. Captions fade up 0.5s after a slide settles ([carousel.js](assets/js/carousel.js)).
- **Footer wordmark.** The full-width logotype slides down from behind the footer rule as the page reaches its end.
- **Buttons.** The main button's fill turns lime. The nav button inverts. Chips gain a 1px outline. Arrow buttons shrink to 95%. The glass pill grows by a few pixels.

All of it respects reduced motion: the ring is built but still, text and figures are simply visible, and the carousel shows every slide at full size. Every script is optional and the page reads correctly without it.

## Imagery

The source uses four kinds of image. Keep the kinds and supply your own content.

- **Brand tiles** in the hero ring: one flat colour or one looping clip per card, with a single name or mark in the middle.
- **Product UI** at the bottom of a pastel card, bleeding off the bottom edge, often on a white or black panel with rounded top corners.
- **Isometric line illustrations** on the dark cards: one hero solid and one repeated supporting shape, drawn on a 30 degree grid in 1px white lines, with a faint floor that runs off the card, one part lit in lime, and a soft glow under it. Build them with [iso.js](assets/js/iso.js) from a short scene description, not by hand. The [isometric guide](references/isometric.md) has the principles, the scene format, seven composition patterns, and a method for drawing any subject. On lime and white, the same scenes render in black lines.
- **Photographs** only in carousels and galleries, cropped 16:9 with 40px corners and a dark fade under the caption.

Don't use stock illustration, 3D renders, mesh gradients, or icons in colour. Icons are 1.5px line icons in the text colour, or lime on a black block.

## Apply it

1. Copy [bendingspoons.css](assets/bendingspoons.css) and the scripts ([ring.js](assets/js/ring.js), [reveal.js](assets/js/reveal.js), [nav-theme.js](assets/js/nav-theme.js), [carousel.js](assets/js/carousel.js), [iso.js](assets/js/iso.js)) into the project, or translate the tokens into its existing system (Tailwind theme, CSS modules, design tokens). Load the three fonts from Google Fonts, or self-host them. They are under the SIL Open Font License.
2. Wrap the page in `.bs-page`. Make each section a `.bs-band` with one of `.is-dark`, `.is-raised`, `.is-soft`, `.is-accent`, or no modifier for white, and put a `.bs-wrap` inside it. Give each band `data-nav-theme="dark"`, `"light"`, or `"accent"` so the nav can follow it.
3. Map the product's content onto the band sequence: hero with a mixed line, figures, a three-paragraph statement, pastel cards, dark cards, a carousel, a lime band with one button, the footer. Choose the italic words and the lime phrases. Write your own copy for all of it.
4. Give each card its own `--tint` and its own image. For each dark card, follow the [isometric guide](references/isometric.md): name the idea, pick a pattern, write the scene, and mount it with `iso.js` or write a static SVG with `node scripts/iso-render.mjs`. Use a different pattern on each card. Use the user's logotype for the nav and the footer wordmark.
5. For app screens rather than marketing pages, keep the type roles, the pill buttons, the large radii, the pastel tints as category colours, and lime as the single accent. Drop the bands, the ring, and the scroll effects. The [component recipes](references/components.md) cover the nav, cards, rows, tiles, buttons, and footer.
6. Check the result against [the specimen](assets/specimen.html) and [the illustration gallery](assets/isometric.html) in light, dark, and at 390px wide. Confirm that each band holds one idea, that no line has more than two italic words, that lime text never sits on a light background, that no tint repeats, that each illustration has one lit part, that nothing scrolls horizontally, that the page reads with scripts off and with reduced motion, and that focus is visible on every control.
