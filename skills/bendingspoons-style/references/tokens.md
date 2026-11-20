# Tokens

These values were measured from the computed styles of bendingspoons.com (home, careers, and events) at 1440px and 390px in November 2026. Motion values were read from the page's own scripts, which use GSAP. The **Skill token** column shows the value [bendingspoons.css](../assets/bendingspoons.css) ships. It differs from the source only where the source fails WCAG AA.

## Colour

| Role | Source | Skill token | Notes |
| --- | --- | --- | --- |
| Black band, footer, page | `#000000` | `--night` | Hero, figures, statement, carousel |
| Raised black band | `#252525` | `--night-raised` | Holds black cards |
| Light band | `#ffffff` | `--bg` | Product cards |
| Soft band | `#f6f6f6` | `--surface` | Behind white rows and tiles |
| Card on a light band | `#ffffff` | `--card` | Rows, tiles, document cards |
| Ink | `#000000` | `--ink` | 21:1 on white |
| Ink soft | black 75% (10.37:1) | `--ink-soft` | "And many more" |
| Muted | black 60% (5.74:1 on white, 5.64:1 on `#f6f6f6`) | `--muted` | Row descriptions |
| Border | `#d4d4d4`, black 20% | `--border` | Ghost buttons |
| Compact button | `#141415` (white text 18.41:1) | `--off-black` | |
| Accent | `#c7ff9f` | `--accent` | 18.23:1 on black, 13.31:1 on `#252525`, 1.15:1 on white |
| Text on accent | `#000000` (18.23:1) | `--on-accent` | |
| Text on black | `#ffffff` (21:1) | `--night-ink` | |
| Caption on raised black | white 65% (7.31:1) | `--night-soft` | |
| Card body on black | white 50% (5.32:1) | `--night-muted` | |
| Footer label, legal | white 40% (3.66:1) | white 60% (7.37:1) `--night-label` | 14px text, so it needs 4.5:1 |
| Nav hairline, footer rule | white 5% | `--night-line` | |
| Arrow button outline | white 30% | `--night-outline` | |
| Nav over dark | black 10%, 16px blur, rule white 5% | `.bs-nav` | |
| Nav over light or lime | white 10%, 16px blur, rule white 20% | `--nav-tint-light`, `--nav-line-light` | |

### Pastel tints

Each product card on the source page has one of these. Body copy on a tint is the ink at 50% in the source, which fails AA on every tint. The skill uses 64%.

| Tint | Value | Source bullets (50%) | Skill bullets (64%) |
| --- | --- | --- | --- |
| `--tint-cyan` | `#72e5ff` | 3.65:1 | 5.8:1 |
| `--tint-lime` | `#d3efab` | 3.77:1 | 6.2:1 |
| `--tint-blush` | `#ffe3e3` | 3.80:1 | 6.3:1 |
| `--tint-orange` | `#ffa575` | 3.38:1 | 5.1:1 |
| `--tint-lavender` | `#efe9fe` | 3.82:1 | 6.3:1 |
| `--tint-olive` | `#e2e2a0` | 3.74:1 | 6.0:1 |
| `--tint-yellow` | `#ffcb00` | 3.61:1 | 5.7:1 |
| `--tint-sky` | `#c1d6f9` | 3.65:1 | 5.8:1 |
| `--tint-pink` | `#ffc9ee` | 3.67:1 | 5.9:1 |
| `--tint-indigo` | `#5867ed` | white 50%: 2.30:1 | white 100%: 4.59:1 |

Indigo is the only tint that takes white text, and white on it only just passes. Keep its bullets at full white and its text at 15px medium or larger.

`data-fidelity="exact"` restores the three failing source values: bullets at 50% on every tint and footer labels at 40%.

**Dark appearance.** The source has no dark mode. The skill derives one from the source's own dark values: light band `#141415`, soft band `#1c1c1d`, card `#252525`, ink white, muted white 60% (7.13:1 on `#141415`, 6.84:1 on `#1c1c1d`, 6.45:1 on `#252525`), border white 20%. Serif-italic emphasis turns lime on every band except the lime one. `--night`, `--accent`, and the tints do not change, so black bands, the lime band, and pastel cards look the same in both themes.

## Type

Loaded font files on the source: Instrument Sans (variable, 400 to 700), Instrument Serif (400, roman and italic), Fragment Mono (400). All three are on Google Fonts under the SIL Open Font License. Some source rules ask for weight 300, which Instrument Sans does not have, so they render at 400.

| Role | Face | Size at 1440 / 390 | Weight | Line height | Tracking | Other |
| --- | --- | --- | --- | --- | --- | --- |
| Hero display | Instrument Sans | 100px / 45px | 400 | 1 (0.93 to 1.1 on other pages) | -0.06em / -0.03em | Centred |
| Display emphasis | Instrument Serif italic | inherits | 400 | inherits | -0.025em | Lime on dark, ink on light |
| Section title | Instrument Sans | 67px / 36px | 400 | 0.93 / 1.12 | -0.04em / -0.01em | Centred, 64px below |
| Statement | Instrument Sans | 64px / 32px | 400 | 1.2 | -0.02em | Left, 100px between paragraphs |
| Figure numeral | Instrument Serif | 185px / 67px | 400 | 0.93 | -0.02em | Lime |
| Figure plus sign | Instrument Serif | 145px | 400 | 0.93 | -0.02em | Lime, aligned to the bottom |
| Figure unit | Instrument Sans | 125px / 50px | 400 | 0.93 | -0.06em | |
| Figure caption | Instrument Sans | 32px | 400 | 1.41 | -0.03em | 8px above |
| Lede | Instrument Sans | 23px / 20px | 400 | 1.4 | -0.02em | Max 640px, centred |
| Dark-card title | Instrument Serif | 42px | 400 | 1.12 | -0.01em | Upright |
| Dark-card sub-title | Instrument Sans | 18px | 500 | 1.3 | -0.02em | |
| Dark-card body | Instrument Sans | 16px | 300 asked, 400 drawn | 1.3 | -0.02em | White 50% |
| Body | Instrument Sans | 17px | 400 | 1.3 | -0.02em | Footer links, card copy |
| Card bullet | Instrument Sans | 15px | 500 | 1.3 | -0.02em | |
| Row title | Instrument Sans | 25px | 500 | 1.2 | 0 | |
| Document title | Instrument Sans | 28px | 600 | 1.3 | -0.02em | |
| Tile label | Instrument Sans | 24px | 600 | 1.15 | -0.02em | Two lines, centred |
| Slide caption | Instrument Sans | 25px / 16px | 600 | 1.2 | 0 | |
| Small figure | Instrument Serif | 45px | 400 | 1.03 | -0.03em | |
| Caption between rules | Instrument Sans | 22px | 500 | 1.36 | -0.02em | |
| Nav button | Instrument Sans | 16px / 14px | 600 | 1.3 | +0.025em | The only positive tracking |
| Nav link | Instrument Sans | 16px | 600 | 1.3 | -0.02em | 80% opacity, 100% and underlined when current |
| Main button | Instrument Sans | 20px | 500 | 1.3 | -0.02em | |
| Chip | Instrument Sans | 16px | 500 | 1.3 | -0.02em | |
| Glass pill | Instrument Sans | 24px / 14px | 600 | 1.66 | -0.02em | |
| Label | Fragment Mono | 14px | 400 | 1.3 | -0.02em | Uppercase |
| Legal | Instrument Sans | 14px | 400 | 1.3 | -0.02em | |
| Footer tagline | Instrument Sans + Serif italic | 50px / 20px | 400 | 1.2 | -0.02em | |

The source switches sizes at breakpoints. The skill scales the display sizes with `clamp()` between the two measured ends, so the values at 390px and 1440px match and the sizes between are interpolated.

The logotype in the nav and footer is Bending Spoons' brand, so don't copy it. Use the project's own logo.

## Layout

| Thing | 1440px | 390px |
| --- | --- | --- |
| Container | max 1440px, centred | full width |
| Gutter, text bands | 64px | 24px |
| Gutter, card grids, nav, footer | 48px | 24px |
| Band padding | 120px (figures 104px) | 80px (figures 64px) |
| Statement band padding | 200px | 80px |
| Nav height | 80px, fixed | 64px |
| Hero | one viewport tall; headline 120px from the top; ring below | same |
| Card grid | 2 columns, 48px gap (pastel) or 40px gap (black) | 1 column, 24px gap, from below 1024px |
| Row list | 896px wide, 16px between rows | full width |
| Title to content | 64px | 20px |
| "And many more" | 120px above | 80px above |
| Lime band | 3 columns, 24px gap, button 80px below | stacked |
| Footer | 56px 48px 36px; columns 88px apart; last column max 480px | 56px 24px 36px; two columns |

Breakpoints on the source: 640, 768, 1024, 1280, and 1440px. The skill uses 48rem (768px) for spacing and radii, 64rem (1024px) for two-column grids, and 80rem (1280px) for square dark cards.

## Shape and depth

| Thing | Value |
| --- | --- |
| Pill | fully round: buttons, chips, glass pill, arrow buttons |
| Hero ring card | 32px (16px on phones), 3:4 |
| List row, icon block | 24px |
| Compact button | 30px |
| Dark card, tile, document card, person card, slide | 40px (36px on phones; slide 20px) |
| Pastel card | 50px (36px below 1024px) |
| White card on the lime band | 60px (30px on phones), bottom 30% masked to transparent |
| Wide media frame | 70px |
| Card glow | `0 100px 100px -100px <card colour>` on pastel and black cards |
| Row shadow | `0 10px 24px rgb(0 0 0 / .05)` |
| Document shadow | `0 12px 57px rgb(30 19 67 / .1)` |
| Media shadow | `0 19px 44px rgb(0 0 0 / .17)` |
| Borders | none on cards; 2px on the main button; 1px on the nav button, compact buttons, and arrow buttons |

## Components, measured

- **Nav button:** padding 10px 18px (8px 12px on phones), 1px border, white fill on dark.
- **Main button:** padding 16px 28px, 2px border, pill.
- **Compact button:** padding 12px 24px, 1px border, 30px radius, `#141415` fill. Ghost: white fill, black 20% border, muted text.
- **Chip:** padding 10px 12px, fill black 5%, 1px transparent border, 12px arrow 8px after the label.
- **Glass pill:** padding 12px 20px, black 30% fill, 8px backdrop blur, 24px icon, 8px gap.
- **Arrow button:** 56px round, 1px border at 30%, 17 by 13px arrow. Over media it gains a white 20% fill.
- **Pastel card:** padding 36px 32px 0 40px (24px 24px 0 on phones); header row 40px tall with 20px below; media 32px below the list, flush to the sides and bottom.
- **Timeline list:** 15px medium. First line has a 22px calendar icon, 6px gap, full ink. Other lines are indented 28px with a 6px hollow dot at 8px and sit on a 2px rule at 10px that fades from ink 10% to transparent. 4px between lines.
- **Dark card:** square at 652px, 40px top padding, 40px between text and art, text centred, body padded 28px each side, art fills the bottom.
- **Row:** padding 32px, 32px icon 12px before the title, 8px to the description, meta column with 16px and 20px line icons, action column with a 12px gap to its note.
- **Document card:** padding 24px, 24px gap, 120 by 152px black icon block with a lime icon.
- **Tile:** 1.1:1, padding 40px, 188px drawing, lime or white.
- **Person card:** white, 40px radius, 32px padding, rotated 1 to 2 degrees either way, serif name at 45px.
- **Slide:** two-thirds of the band wide (11/12 on phones), 16:9, 40px between slides, caption padded 32px 40px, fade from black 60% at the bottom through 10% to transparent.
- **Footer:** column gap 8px, label 4px above its links, rule white 5% 32px below the columns, wordmark 64px below the rule, tagline directly under the wordmark.

## Motion

| Effect | Value | Source |
| --- | --- | --- |
| Default transition | 150ms `cubic-bezier(.4,0,.2,1)` | Chips, glass pill |
| Colour transition | 200ms (main button), 300ms (nav, nav button, arrow buttons) | Same curve |
| Hero ring | 12 cards, 30 degrees apart, each `rotateY(-30deg × i)` about an axis `R` in front of it and pushed back by `R`, where `R = 1.05 × width / (2 × tan(180deg / 12))` (705px for a 360px card); `perspective: 1000px`; `backface-visibility: hidden` | GSAP timeline |
| Ring size | card width 25% of the viewport (50% below 768px), 3:4 | |
| Ring spin | 360 degrees in 60s, linear, forever | |
| Ring intro | 27 extra degrees over 3s, `circ.out` | |
| Hero headline in | opacity 0 and 50px down to rest, 1s, `power2.out` | |
| Hero ring in | opacity 0, 150px down, `blur(3px) grayscale(100%)` to rest, 1s, `power2.out`, starting halfway through the headline | |
| Blur reveal | every letter from opacity 0 and `blur(20px)`, 1 unit long, 0.05 units apart, `power2.out`; scrubbed from paragraph top at 80% of the viewport to paragraph bottom at 80%; 0.8s lag | GSAP SplitText and ScrollTrigger |
| Figure in | opacity 0 and 100px down to rest, 1s, `back.out(1.3)`, once, when its top passes 80% | |
| Nav theme | probe 30px from the top at the centre; `data-nav-theme` of the band there; 300ms | Page script |
| Carousel | active slide scale 1, others 0.8, 0.3s `power2.out`; caption in over 0.4s after 0.5s, out over 0.3s `power2.in` with a 20px shift; loops | Embla and GSAP |
| Footer wordmark | from 80% above to rest, linear, scrubbed from footer top at 80% to footer bottom at the viewport bottom; 1s lag | |
| Lime band columns | side columns drift 80px against each other and person cards turn a degree or two, scrubbed through the band | Careers page |
| Card video | plays while at least 10% is on screen, paused otherwise | IntersectionObserver |
| Dark-card art | Lottie line animation, looped, playing only while on screen | lottie-react |

The skill's scripts reproduce the first nine rows with no dependencies. `--ease-out` is `power2.out` exactly as a cubic bezier. `--ease-back` approximates `back.out(1.3)`. The skill's carousel uses native scroll snapping, so it does not loop. The lime-band drift and card video are not shipped: use the project's own video with the same rule of playing only while visible. The Lottie art is replaced by [iso.js](../assets/js/iso.js), which draws scenes in the same style with the same loop timing. The [isometric guide](isometric.md) records what was measured from the Lottie files.

## Not measured

- Hover states were read from the stylesheet, not observed, because the test browser reports `hover: none`.
- The glass pill has a halo that fades in over 1s on hover: a blurred radial gradient ring from blue-grey to near-black. Its animation was not traced, and the skill leaves it out.
- Careers has a second hero carousel of video cards with glass captions. Only its static layout was measured.
- The investors, support, and jobs sites are separate sites and were not surveyed.
