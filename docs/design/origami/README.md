# Origami redesign — implementation handoff

A full visual redesign of Thật Space in a paper / origami style. The design lives
on a Claude Design canvas (https://claude.ai/artifact/XCbH4LnnadhG4eYfQuZn8n);
this folder is the repo copy of its source, so the redesign can be built without
access to the canvas.

**Status: design only.** No app code has changed. The artboards have not been
checked in a browser, so treat this README and the artboard markup as the spec, and
expect to tune what you see.

## Files

| Artboard | Route | Interactive behaviour to build |
| --- | --- | --- |
| `artboards/Main.dc.html` | `/` | Cursor-following origami lotus, bloom on click, parallax, "How it unfolds" accordion, card hover |
| `artboards/Forum.dc.html` | `/forum` | Topic filter and sort (now really filter `forumThreads`) |
| `artboards/Thread.dc.html` | `/forum/[slug]` | Static |
| `artboards/TuVi.dc.html` | `/tuvi` | Generate unfolds the 12-palace chart; highlighted palaces switch the reading |
| `artboards/Matchmaking.dc.html` | `/matchmaking` | Compatibility modal (the existing one, restyled as an unfolding letter) |
| `artboards/Profile.dc.html` | `/profile` | Static, envelope-flap hover |
| `artboards/PaperKit.dc.html` | — | Tokens, type and reusable parts reference |

Assets: `public/logo.jpg` (unchanged) and `public/textures/paper-grain.png` (new,
256×256 tileable grain at low alpha, used as a `background-image` overlay).

### Reading a `.dc.html` file

Each artboard is plain HTML inside `<x-dc>…</x-dc>`, with:
- `<helmet><style>` — the hover, keyframe and pseudo-element CSS (port into
  `globals.css` or component CSS).
- `{{ name }}` holes and `<sc-for list=… as=…>` / `<sc-if value=…>` — the
  equivalents of JSX `{name}`, `.map()` and conditionals. Their data comes from
  `renderVals()` in the `<script type="text/x-dc">` block at the bottom.
- `onClick="{{ fn }}"` etc. — React event handlers.
- `href="Forum.dc.html"` style links — map to the routes in the table above.

Port the markup to JSX and Tailwind; keep the data in `lib/` as it is now.

## Tokens

Brand colours are unchanged. Every other tone is a shade or tint of them, used
for the light and dark sides of a fold.

| Token | Hex | Use |
| --- | --- | --- |
| `ink` (primary) | `#5C3D2E` | Text, primary buttons, dark bands |
| `kraft` (secondary) | `#C4A882` | Accents, ledges, tape, CTA band. Decorative only: fails contrast as text on cream |
| `washi` (cream) | `#F5F0E8` | Page ground |
| `ink-deep` | `#3F2A1F` | Footer, button ledge, darkest folds |
| `ink-700` | `#4E3326` | Body text on sheets |
| `ink-500` | `#6E4D3C` | Secondary text |
| `ink-400` | `#7A5A48` | Meta text (passes 4.5:1 on cream) |
| `accent` | `#8A6450` | Eyebrows, italic accents |
| `kraft-600` | `#A88B66` | Shade side of kraft folds |
| `kraft-300` | `#D2BE9C` | Dashed dividers, avatar shade |
| `crease` | `#E2D4BC` | 2px "crease" under sheets, borders |
| `washi-200` | `#EFE7DA` | Recessed panels |
| `sheet` | `#FBF8F2` | Cards / paper sheets |

Suggested Tailwind `theme.extend.colors` replaces the current `primary`,
`secondary`, `cream` and `brown` entries. Then remove the many hardcoded
`bg-[#…]` / `text-[#…]` arbitrary values across the pages.

## Type

- Display: **Fraunces** (variable, `SOFT` axis 50; weight 300–500, italic for accent words).
- Text: **Be Vietnam Pro** 400/500/600. Chosen for full Vietnamese diacritics.
- Load both via `next/font/google` in `src/app/layout.tsx` (subsets `latin`,
  `vietnamese`), replacing Playfair Display and Inter. Remove the stray `Lato`
  reference in `globals.css` and `tailwind.config.ts`.
- Eyebrow labels: 12–13px, 600, `letter-spacing: .12em`, uppercase.

## Paper rules

- Corners are sharp: `border-radius: 2px` on buttons, 0 on sheets.
- Sheet shadow: `0 2px 0 #E2D4BC, 0 20px 30px -24px rgba(63,42,31,.55)`. Hover
  raises 2–10px and deepens the blur. No glows, blurred blobs or gradient washes.
- Fold surfaces are hard-stop two-tone gradients, e.g.
  `linear-gradient(135deg, #DCCAAE 50%, #C4A882 50%)` (folded-square avatars).
- Dog-ear: absolutely positioned square,
  `linear-gradient(225deg, <ground> 50%, <fold> 50%)`, top-right; grows on hover.
- Primary button: ink fill, `box-shadow: 0 3px 0 #3F2A1F`, small folded corner via
  `::after`. Secondary: 2px ink outline on a `0 3px 0 #C4A882` ledge.
- Reveal motion: `rotateX` hinge from the top edge,
  `cubic-bezier(.2,.8,.2,1)`, 0.6–0.9s. Respect `prefers-reduced-motion`.
- Icons: inline stroke SVG (1.6–1.8 stroke). No emoji. The emoji in forum titles and
  zodiac glyphs (♈ etc.) were dropped from the display; strip them in `lib/` or at
  render.

## The hero lotus (most important piece)

Build it as a client component, e.g. `src/components/OrigamiLotus.tsx`. Source is
in `Main.dc.html`: the `.hero` section, the "origami lotus stage" block and the
`Component` class.

Structure:
- A stage with `perspective: 1300px`. The head (`transform-style: preserve-3d`) holds
  29 petals in 4 layers (`buildPetals()`), plus an octagonal seed pod at
  `translateZ(42px)`.
- Each petal is a kite of two clip-path halves (left light, right dark), positioned
  with its base at the flower centre:
  `rotate(θ) translateZ(z) rotateX(-(cup - open*openBy) deg)`, transform-origin at
  the bottom centre. Back layers are flatter (cup 16°), front layers stand up (72°).
- A stem div rotates from its bottom to follow the head's x offset, with two leaves.

Motion, all through CSS custom properties on the hero element, with **no React
re-render per frame**:
- `pointermove` on the hero sets targets: `--ry = dx·40°`, `--rx = −dy·32°`,
  `--tx/--ty` small translate, `--lx/--ly` = normalised cursor direction,
  `--px/--py` = parallax for the moon, cranes and copy.
- A `requestAnimationFrame` loop eases the current values toward the targets
  (factor ~0.075) and writes them with `style.setProperty`.
- Lighting: each petal half has
  `filter: brightness(calc(1 + var(--lx)*c + var(--ly)*s))`, where `c, s` are that
  facet's precomputed normal × 0.16. Facets facing the cursor brighten.
- Idle (no pointer for 2.2s): gentle sine sway. Disabled under
  `prefers-reduced-motion`.
- Click toggles bloom: eases `--open` 0↔1 (petals open wider).
- On touch devices, `pointermove` fires during a drag; otherwise the idle sway
  carries it.

Watch for: any `filter`, `overflow: hidden` or `opacity < 1` on an ancestor between
the stage and the petals flattens `preserve-3d`. The head is a `<button>` (for
bloom) and must keep `transform-style: preserve-3d`.

## Copy and content notes

- All copy comes from the current pages and `lib/` data, except the four "How it
  unfolds" steps on the landing page, which are new.
- In the Tử Vi chart, only the three palaces covered by the existing sample reading
  (Phu Thê, Quan Lộc, Phúc Đức) are interactive. The other nine show names only.
  Palace positions are a sample layout, not computed from a birth chart.
- The footer year was changed to 2026.
- The CTA still claims "thousands of Vietnamese women", carried over from the
  original; it is unverified for a demo.

## Tests

`__tests__/` asserts on text and roles. Keep headings, link names and button labels
where they still exist. Renamed or new elements ("Tìm Duyên" nav label, step
buttons, palace buttons) will need test updates.
