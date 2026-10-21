# Design language

A reusable spec for the look and feel of briannaimm.com. Hand this file to a person or to Claude when building another page, and the result should read as the same family.

**In one sentence:** a dark, quiet stage lit by slow gold-and-emerald light, with editorial serif headlines, restrained sans-serif body text, and small, deliberate motion.

The source of truth is [style.css](style.css) and [script.js](script.js). This document explains the intent so you can apply it to new layouts, not just copy the old ones.

---

## 1. Principles

1. **Sleek, not techy.** No neon, no monospace, no terminal motifs, no emoji. Prefer warmth (gold, serif) over cold saturation (cyan, magenta).
2. **Dark stage, soft light.** Near-black background; color arrives as blurred, slow-moving light behind the content, never as flat fills.
3. **Editorial hierarchy.** Big light serif for headlines, small uppercase labels for metadata, calm sans-serif for reading.
4. **One accent at a time.** Gold is the primary accent. Emerald is the secondary, used for labels and data. Indigo shows up only in the background and focus ring.
5. **Motion is garnish.** Everything animated is slow, small, or triggered by the user, and every animation turns off for `prefers-reduced-motion`.
6. **Content first.** Glass cards and glow frame the content. They never compete with it.

---

## 2. Color

Define everything as CSS custom properties on `:root`.

| Token | Value | Use |
| --- | --- | --- |
| `--bg` | `#0a0e13` | Page background, text on gold buttons |
| `--fg` | `#f3f1ec` | Headlines and primary text (warm off-white, never pure white) |
| `--muted` | `#9aa3ad` | Body copy on cards, nav links, captions, footer |
| `--card` | `rgba(255,255,255,0.04)` | Glass surface fill |
| `--border` | `rgba(255,255,255,0.09)` | Hairlines, card and chip borders |
| `--a` (gold) | `#d8b47a` | Primary accent: underline, dots, hover rings, org names, section numbers |
| `--b` (emerald) | `#1f8f78` | Reserved secondary; the lighter `#6fcdb3` is used for text labels |
| `--c` (indigo) | `#7f95e8` | Focus outline only |
| `--grad` | `linear-gradient(120deg, #ecd3a6, #d8b47a 35%, #6fcdb3 75%, #9fb0f5)` | Name highlight, primary button |

**Background blobs** (blurred circles, see section 6): deep teal `#1a6f66`, burnished gold `#b8894a`, dusk indigo `#3b4a9e`.

**Rules**

- Body paragraphs inside cards use `--muted`. Long-form reading paragraphs may use a slightly brighter `#d6d2e4`.
- Never use `--fg` at full strength for large blocks of small text; it glares on the dark background.
- Gradient text is for one thing per page (the person's name). Do not gradient headings.
- Keep contrast at or above WCAG AA. `--muted` on `--bg` passes; do not go darker.

---

## 3. Typography

| Role | Font | Notes |
| --- | --- | --- |
| Display and headings | **Fraunces** (400 for h1/h2, 600 for h3 and brand) | Fallback `"Iowan Old Style", Georgia, serif` |
| Body and UI | **Inter** (400, 500, 600) | Fallback `system-ui, -apple-system, "Segoe UI", sans-serif` |

Load from Google Fonts:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600&family=Inter:wght@400;500;600&display=swap">
```

**Scale**

| Element | Size | Weight | Tracking | Line height |
| --- | --- | --- | --- | --- |
| h1 | `clamp(2.8rem, 10vw, 6.5rem)` | 400 | `-0.03em` | 1.02 |
| h2 | `clamp(1.9rem, 5vw, 2.7rem)` | 400 | `-0.02em` | default |
| h3 (card) | `1.3rem` | 600 | `-0.02em` | default |
| h3 (timeline) | `1.2rem` | 600 | `-0.02em` | default |
| Lead paragraph | `clamp(1.15rem, 2.8vw, 1.6rem)` | 400, `--muted` | | 1.45 |
| Body | `1.0625rem` | 400 | | 1.7 |
| Card body | `0.98rem` | 400, `--muted` | | 1.7 |
| Label (eyebrow, tag, date) | `0.75rem` to `0.85rem` | 600 | `+0.08em` to `+0.1em`, UPPERCASE | |

**Rules**

- Headlines are large, light, and tightly tracked. Do not bold them.
- Small caps-style labels are always uppercase with wide tracking. Never use them for sentences.
- One serif, one sans. Do not add a third family.
- Section headings carry a small gold number (`01`, `02`) set at `0.9rem`, `vertical-align: super`.

---

## 4. Layout and spacing

- **Container:** `width: min(100% - 2rem, 62rem); margin-inline: auto`. That gives a 16px gutter on phones and a 992px max width.
- **Section rhythm:** `padding: 5rem 0` per section. Hero gets `min-height: 82vh` and extra bottom padding.
- **Grids:** `repeat(auto-fit, minmax(17rem, 1fr))` for cards; `minmax(15rem, 1fr)` for compact tiles. Gap `1.25rem` (cards) or `1rem` (tiles).
- **Two-column splits** (hero, about) use `1.3fr / 1fr` and `1.4fr / 1fr`, collapsing to one column below `48rem` (hero) and `40rem` (about).
- **Radii:** cards `1.2rem`, tiles and link rows `1rem`, pills `999px`, portrait frame `999px` top and `1.4rem` bottom.
- **Sticky header** with a gradient-and-blur fade so content slides under it without a hard edge.

---

## 5. Components

### Glass card
`background: var(--card); border: 1px solid var(--border); backdrop-filter: blur(10px); border-radius: 1.2rem; padding: 1.6rem;`
Anatomy: uppercase **tag** (emerald), serif **h3**, muted **paragraph**, optional **more** link with an arrow. Linked cards lift into a 1px gold ring plus a soft gold shadow on hover (`0 20px 60px -24px var(--a)`) and tilt up to 8 degrees toward the cursor. A "coming soon" card uses a dashed border and a transparent fill.

### Pill (chip)
Rounded 999px, 1px border, `--card` fill, `--muted` text, `0.9rem`. Hover: text to `--fg`, border to gold, lift 2px.

### Buttons
Pill-shaped, `0.8rem 1.5rem`, weight 600. **Primary** uses `--grad` with dark `--bg` text and a gold glow shadow. **Secondary** is a glass pill. Hover lifts 2px.

### Link row
Full-width glass row: bold label, muted value, gold arrow. On hover, slides 6px right with a faint gold wash.

### Timeline
A 1px vertical hairline with a gold dot per entry (`9px`, ringed by the background color and a gold glow). Each entry: emerald uppercase date, serif title, gold organization line, muted description capped at `40rem`.

### Portrait
Arch-shaped frame (`border-radius: 999px 999px 1.4rem 1.4rem`, `aspect-ratio: 4/5`) with a 0.5rem gradient border (gold to emerald) and a soft gold glow beneath. The photo inside is `object-fit: cover` with `object-position: 50% 28%` so the face stays framed, plus a faint inner highlight and bottom shade. A serif name and uppercase subtitle sit beneath as a caption. Serve responsive sizes with `<picture>` and `srcset` (480, 800, 1200 wide), set `width` and `height`, and use `fetchpriority="high"` for a hero image. Write real alt text that describes the person and setting.

### Collection components
The Papers & Projects collection adds these components. All use the same tokens.

- **Item card:** a glass card with a 16:10 media area on top (thumbnail, or a gradient placeholder with the first letter of the title in Fraunces), a "Project" or "Paper" chip over the image, the tag and AI-assisted badge, a serif title, and pill links. "View item" is always the primary pill.
- **Filter pills:** pill buttons with a count. The active pill is solid gold with dark text.
- **Item page:** breadcrumb, label row, a large light serif title, the lead paragraph, and buttons (the first link is the gradient primary button). Below: a carousel or a single framed image, the Markdown body with a sticky sidebar (Files, Tags, Collection), the Dublin Core table, and a citation box.
- **Carousel:** a scroll-snap track with round glass arrow buttons and pill dots (the active dot widens and turns gold). Captions sit in a dark glass label at the bottom left.
- **Dublin Core table:** two columns. Uppercase muted labels on the left, values on the right, hairlines between rows. Links in gold.

### Icons
Inline SVG sprite (`<symbol>` plus `<use>`), 1.6px round-capped strokes, sized `1em` and colored with `currentColor`. Do not use Unicode arrows or emoji, which can render as colored emoji on some platforms.

---

## 6. Background and ambient effects

**Aurora:** three fixed, heavily blurred circles behind everything.

```css
.blob { position: absolute; width: 55vmax; height: 55vmax; border-radius: 50%;
        filter: blur(90px); opacity: 0.38; animation: drift 24s ease-in-out infinite alternate; }
@keyframes drift { to { transform: translate(12vmax, 8vmax) scale(1.2) rotate(30deg); } }
```

Place one teal top-left, one gold bottom-right (opacity about `0.32`), and one smaller indigo mid-page (opacity about `0.2`). Stagger the durations (24s, 30s, 36s) and delays so they never sync.

**Spotlight:** a fixed radial gradient (`520px`, `rgba(255,255,255,0.07)`) that follows the cursor via `--mx` and `--my`. Keep it subtle: it should read as a faint sheen, not a flashlight.

---

## 7. Motion

| Effect | Spec |
| --- | --- |
| Scroll reveal | Fade and rise `28px` over `0.8s`; trigger with `IntersectionObserver` at `threshold 0.15`; stagger by `(index % 4) * 90ms` |
| Hover lift | `translateY(-2px)`, `0.2s` |
| Card tilt | Up to `8deg` on `rotateX/rotateY` with `perspective(900px)`, `0.15s ease-out`, resets on leave |
| Portrait parallax | Up to `5px` shift following the cursor |
| Name shimmer | Gradient `background-size: 200%`, panned over `8s` linear, infinite |
| Rotating word | Fade and drop `0.4em` over `0.35s`, change every `2.6s` |
| Scroll hint | `8px` bob over `2s` |

**Required:** wrap pointer-driven effects in a `prefers-reduced-motion` check in JS, and add this CSS so content is never left hidden:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; }
  html { scroll-behavior: auto; }
  .js .reveal { opacity: 1; transform: none; }
}
```

Only hide `.reveal` elements when the `js` class is present on `<html>`, so the page still works without JavaScript.

---

## 8. Content voice

- First person, plain, confident. Short sentences.
- Lead with what the person does for others, then credentials.
- No hype words, no jargon for its own sake, no emoji.
- Dates in `Mon YYYY` form. Labels in uppercase via CSS, not typed in caps.
- Keep private details (phone number, institutional email, former names, case specifics) off the page.

---

## 9. Starting a new page

1. Copy the `:root` tokens, the font links, and the aurora and spotlight markup:

   ```html
   <div class="aurora" aria-hidden="true"><span class="blob b1"></span><span class="blob b2"></span><span class="blob b3"></span></div>
   <div class="spotlight" aria-hidden="true"></div>
   ```

2. Use the container, sticky header, and `section { padding: 5rem 0 }` rhythm.
3. Build content from the components above. Add the `reveal` class to anything that should animate in, and `tilt` to linked cards.
4. Include `script.js` for reveal, spotlight, tilt, and the reduced-motion handling. Drop the parts you do not use (parallax, rotator).
5. Check at 375px and at desktop width, with reduced motion on, and with keyboard focus (the indigo focus ring must stay visible).

### Checklist

- [ ] Background `#0a0e13`, text `#f3f1ec`, one gold accent
- [ ] Fraunces for headings, Inter for body, no third font
- [ ] No emoji or Unicode arrows; icons are inline SVG
- [ ] Gradient text used once
- [ ] Every animation disabled under `prefers-reduced-motion`
- [ ] Images have `width`, `height`, `alt`, and responsive `srcset` where large
- [ ] Layout has no horizontal scroll at 375px
- [ ] Muted text still meets AA contrast

---

## 10. Known loose ends

- `--b` (emerald `#1f8f78`) and its role are mostly carried by the lighter literal `#6fcdb3` in the CSS. If you extend the system, promote `#6fcdb3` to a token (for example `--teal`) and use it everywhere.
- The `.about-grid p` color `#d6d2e4` has a slight violet cast left over from the earlier palette. A warmer neutral such as `#d9d6cf` would match the rest.
- Google Fonts is loaded from a third party. For stricter privacy, self-host the two families.
