# Tokens

These values were measured from the computed styles of xyne.ai at 1440px and 390px in November 2026. The **Skill token** column shows the value [xyne.css](../assets/xyne.css) ships. It differs from the source only where the source fails WCAG AA.

## Colour

| Role | Source | Skill token | Notes |
| --- | --- | --- | --- |
| Page | `#ffffff` | `--bg` | |
| Alternate band, footer | `#f5f7fa` | `--surface` | Cool grey, slightly blue |
| Tile on band | `#ffffff` | `--card` | |
| Ink | `#1c1e1f` | `--ink` | Headings and body |
| Ink soft | `#2a2b2d` | `--ink-soft` | Body copy beside a sub-heading |
| Muted | `#6f7f8f` (4.11:1 on white) | `#62717f` (5.01:1) `--muted` | Card copy, footer headings |
| Faint | `#b1bdc9` | `#8b97a3` `--faint` | Inactive rail items only, which are decorative |
| Border | `#e3e9ef` | `--border` | Screenshot frames |
| Column rule | `rgba(63,74,86,.1)` dashed 1px | `--grid-line` | |
| Brand | `#ff4f4f` | `--brand` | Fills, marks, large text |
| Brand, small text | `#ff4f4f` (3.24:1) | `#d93035` (4.75:1) `--brand-ink` | Nav active, CTA label, rail active |
| CTA fill | `#ff4f4f` (white 3.24:1) | `#d93035` `--cta` | Pills and CTA disc behind 14px white text |
| Red band | `#ff4242` (white 3.44:1) | `#d93035` `--band` | Body copy on the band is 17px, so it needs 4.5:1 |
| Band body text | `#ffd9d9` | `#ffe3e3` `--on-band-soft` | |
| Highlight text | `#f5f7fa` on `#ff4f4f` (3.02:1) | `--on-brand-display` | Passes only at large sizes, so keep highlights at 24px or more |
| Brand tint | `#fff6f6` | `--brand-tint` | 5% brand mixed into white |
| Dark band | `#242628` | `--night` | |
| Dark tile | white 2% fill, white 6% hairline | `--night-tile`, `--night-line` | |
| Dark dashed band | white 14% dashed | `--night-dash` | |

`data-fidelity="exact"` restores every source value in the left column.

**Dark appearance.** The source has no dark mode. The skill derives one from its dark band: page `#1c1e1f`, surface `#242628`, card `#2a2c2f`, ink `#f2f4f7`, muted `#9aa5b4`, rules white 6%, small brand text `#ff6b6b`. `--brand` and `--cta` stay the same, so the red reads as the same colour in both themes.

## Type

| Role | Face | Size | Weight | Line height | Tracking | Other |
| --- | --- | --- | --- | --- | --- | --- |
| Hero mega | Google Sans Flex | ~176px at 1440 (`12.2vw`) | 420 | 1 | -0.06em source, -0.045em skill | `wdth` 96 |
| Section title | Google Sans Flex | 56.7px (`3.93vw`) | 420 desktop, 450 mobile | 1.07 | -0.02em | `ss01`, `cpsp` |
| Display statement | Google Sans Flex | 100.6px (`7vw`) | 420 | 1 | -0.04em | Brand colour |
| Sub-title | Google Sans Flex | 36.6px | 500 | 1.01 | -0.01em | |
| Highlight word | Google Sans Flex | inherits | inherits | inherits | inherits | `wdth` 120–128, padding-inline 0.14em, `box-decoration-break: clone` |
| Lede | Manrope | 17.1px | 500 | 1.5 | +0.015em | |
| Body | Manrope | 15.6px | 500 | 1.5 | +0.02em | Muted |
| Statement | Manrope | 20.9px | 600 | 1.45 | 0 | Inline highlight padded 4px |
| Nav | Manrope | 15px | 550 | 1.5 | +0.01em | Hover and active in brand |
| Button | Manrope | 14px | 550 | 20px | 0 | Pill, 8px 16px padding |
| Card label | Geist Mono | 14.8px | 600 | 1.6 | +0.1em | Uppercase, 4px brand bar |
| Kicker, CTA | Geist Mono | 13.4px | 500 | 1.7 | +0.1em | Uppercase |
| Rail index | Geist Mono | 13.4px | 500 (600 active) | 1.7 | +0.06em | Uppercase, `01` prefix |
| Diagram tile | Geist Mono | 15px | 400 | 1.5 | +0.04em | Uppercase |
| Footer heading | Manrope | 13px | 600 | 1.8 | +0.02em | Muted |

The wordmark uses Syncopate 700 lowercase. That is Xyne's brand, so don't copy it. Use the project's own logo.

## Grid

```
--grid-cols: 2 | 4 (≥48rem) | 6 (≥64rem)
--grid-col-max: 384px | 256px | 240px
--grid-margin: 1.25rem | 1.5rem
grid-template-columns:
  [full-start] minmax(var(--grid-margin), 1fr)
  [content-start] repeat(var(--grid-cols), [col] minmax(0, var(--grid-col-max)))
  [col content-end] minmax(var(--grid-margin), 1fr) [full-end];
```

The grid has no column gap. Spacing between cards comes from a 2.5rem end margin on each card.

## Spacing, shape, motion

- Header: 60px sticky, white, 12px vertical padding.
- Section padding: `clamp(6rem, 11.5vw, 12.5rem)`. The dark band uses `clamp(6rem, 12vw, 13rem)`. Space below a title is `clamp(2rem, 4.9vw, 5.25rem)`.
- Card padding: 24px. Card art area: about 150px tall, centred.
- Radius: 1px everywhere (516 elements on the source page), full round for pills, 12px for screenshot frames.
- Transitions: colour at 200ms `cubic-bezier(.4,0,.2,1)`, rail at 300ms, CTA `clip-path` at 300ms `cubic-bezier(0,0,.2,1)`.
- Hero field: 43 × 12 strokes at 1440px, each 29 × 3px at rest, opacity 0.62, leaning toward the pointer and brightening near it.
