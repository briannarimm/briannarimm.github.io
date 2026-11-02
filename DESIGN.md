# Design language

A reusable spec for the look and feel of briannaimm.com. Hand this file to a person or to Claude when building another page, and the result should read as the same family.

**In one sentence:** a dark, quiet stage lit by slow dusty-blue and dusty-pink light, with editorial serif headlines, restrained sans-serif body text, depth from soft gradients and shadows, and small, deliberate motion.

The source of truth is [style.css](style.css) and [script.js](script.js). This document explains the intent so you can apply it to new layouts, not just copy the old ones.

---

## 1. Principles

1. **Sleek, not techy.** No neon, no monospace, no terminal motifs, no emoji. Prefer soft, desaturated color and a warm serif over cold saturation (cyan, magenta).
2. **Dark stage, soft light.** Near-black background; color arrives as blurred, slow-moving light behind the content, never as flat fills.
3. **Editorial hierarchy.** Big light serif for headlines, small uppercase labels for metadata, calm sans-serif for reading.
4. **One accent at a time.** Blue is the primary accent, for links, icons, and active states. Pink is the secondary, for tags, dates, and labels. The two meet only in the blue-to-pink gradient. Indigo shows up only in the background and the focus ring.
5. **Motion is garnish.** Everything animated is slow, small, or triggered by the user, and every animation turns off for `prefers-reduced-motion`.
6. **Depth on purpose.** Gradients and layered shadows make cards and buttons feel physical, never flat and never skeuomorphic.
7. **Content first.** Glass cards and glow frame the content. They never compete with it.

---

## 2. Color

Define everything as CSS custom properties on `:root`. The site is dark by default. A light theme is available (see "Themes" below).

### Dark (default)

| Token | Value | Use |
| --- | --- | --- |
| `--bg` | `#0a0e13` | Page background (Ink). Also the text color on gradient buttons and the active filter |
| `--fg` | `#f3f1ec` | Headlines and primary text (warm off-white, never pure white) |
| `--muted` | `#9aa3ad` | Body copy on cards, nav links, captions, footer |
| `--card` | `rgba(255,255,255,0.04)` | Glass fill for pills and chips |
| `--border` | `rgba(255,255,255,0.09)` | Hairlines, card and chip borders |
| `--wm-blue` | `#a5c5e2` | Wordmark Blue. Fills and the gradient (for example the active filter) |
| `--wm-pink` | `#e3b7c3` | Wordmark Pink. Fills and the gradient |
| `--wm-white` | `#e6e6ec` | Wordmark White. The wordmark's period on dark |
| `--wm-period` | `#e6e6ec` | The period of the inline wordmark (switches with the theme) |
| `--accent-blue` | `#a5c5e2` | Primary accent: links, icons, section numbers, timeline dots and organizations, hover rings, active states |
| `--accent-pink` | `#e3b7c3` | Secondary accent: tags, dates, sidebar labels |
| `--c` (indigo) | `#7f95e8` | Focus outline only |
| `--grad` | `linear-gradient(120deg, #a5c5e2, #e3b7c3)` | The brand gradient: primary buttons, primary link pills, featured hairlines |
| `--shadow-1` | `0 1px 0 rgba(255,255,255,0.06) inset, 0 8px 24px -12px rgba(0,0,0,0.6)` | Resting depth on cards and tiles |
| `--shadow-2` | `0 20px 60px -24px rgba(165,197,226,0.45)` | Hover and focus lift |
| `--card-fill` | `linear-gradient(160deg, rgba(255,255,255,0.07), rgba(255,255,255,0.02))` | Card and tile fill |
| `--btn-depth` | `inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -1px 0 rgba(0,0,0,0.25)` | Top highlight and bottom edge of gradient buttons |
| `--text-soft` | `#d6d2e4` | Long-form reading paragraphs (About, item pages) |
| `--hover-line` | `rgba(255,255,255,0.3)` | Hover border on secondary buttons and filters |
| `--dot` | `rgba(255,255,255,0.22)` | Inactive carousel dots |
| `--code-bg` | `rgba(255,255,255,0.07)` | Inline code and code blocks |
| `--frame-mid`, `--spot`, `--aurora-k` | see sections 5 and 6 | Portrait frame middle stop, spotlight color, aurora opacity factor |

Contrast on `--bg`: `--fg` 17.1:1, `--muted` 7.6:1, blue 10.8:1, pink 10.9:1. Ink on blue or pink is 10.8:1 or more.

### Light

Set under `:root[data-theme="light"]`, and under `@media (prefers-color-scheme: light)` for visitors who did not choose.

| Token | Value | Use |
| --- | --- | --- |
| `--bg` | `#f6f3ec` | Warm paper background |
| `--fg` | `#15181d` | Primary text (16.1:1) |
| `--muted` | `#5d6670` | Secondary text (5.3:1) |
| `--card` | `rgba(255,255,255,0.65)` | Glass fill |
| `--border` | `rgba(21,24,29,0.10)` | Hairlines |
| `--accent-blue` | `#365f86` | Blue for text, icons, and active states (6.0:1) |
| `--accent-pink` | `#94475f` | Pink for tags and labels (5.7:1) |
| `--c` | `#4a5fc9` | Focus outline (5.0:1) |
| `--wm-period` | `#0a0e13` | The wordmark's period on light |
| `--card-fill` | `linear-gradient(160deg, rgba(21,24,29,0.07), rgba(21,24,29,0.02))` | Card and tile fill |
| `--text-soft` | `#15181d` | Long-form reading paragraphs |
| `--hover-line` | `rgba(21,24,29,0.3)` | Hover borders |
| `--dot` | `rgba(21,24,29,0.22)` | Inactive carousel dots |
| `--code-bg` | `rgba(21,24,29,0.06)` | Code backgrounds |
| `--frame-mid`, `--spot`, `--aurora-k` | `rgba(21,24,29,0.04)`, `rgba(10,14,19,0.05)`, `0.5` | Portrait frame middle stop, spotlight, half-strength aurora |

`--wm-blue`, `--wm-pink`, `--grad`, `--shadow-1`, and `--shadow-2` keep the same values in both themes.

**Rules**

- Components use `--accent-blue` and `--accent-pink`, which switch with the theme. Use `--wm-blue`, `--wm-pink`, and `--grad` only as fills.
- Never use the pastels (`#a5c5e2`, `#e3b7c3`) as text on the light theme.
- One accent color per element.
- Body paragraphs inside cards use `--muted`. Long-form reading paragraphs use the softer `--text-soft`.
- Never use `--fg` at full strength for large blocks of small text on dark; it glares.
- No gradient text anywhere. The name in the header and hero is the SVG wordmark (section 10).
- Keep contrast at or above WCAG AA in both themes.

**Retired.** Do not use these values. They belong to the earlier gold palette: gold `#d8b47a`, light gold `#ecd3a6`, burnished gold `#b8894a`, emerald `#1f8f78`, teal `#6fcdb3` and `#1a6f66`, periwinkle `#9fb0f5`, the gold-teal-indigo gradient, and the tokens `--a` and `--b`.

---

## 3. Typography

| Role | Font | Notes |
| --- | --- | --- |
| Display and headings | **Fraunces** (400 for h1/h2, 600 for h3) | Fallback `"Iowan Old Style", Georgia, serif` |
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
| h1 (item and collection titles) | `clamp(2.8rem, 10vw, 6.5rem)` | 400 | `-0.03em` | 1.02 |
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
- Section headings carry a small number (`01`, `02`) in `--accent-blue`, set at `0.9rem`, `vertical-align: super`.

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
`background: var(--card-fill); border: 1px solid var(--border); box-shadow: var(--shadow-1); backdrop-filter: blur(10px); border-radius: 1.2rem; padding: 1.6rem;`
Anatomy: uppercase **tag** (`--accent-pink`), serif **h3**, muted **paragraph**, optional **more** link with an arrow. Linked cards lift into a 1px `--accent-blue` ring plus `--shadow-2` on hover and tilt up to 8 degrees toward the cursor. A "coming soon" card uses a dashed border, a transparent fill, and no shadow. Tiles, education cards, link rows, sidebar blocks, and the citation box use the same fill and resting shadow.

Featured items may carry a 1px gradient hairline (`--grad` at 35% opacity). The site uses none today.

### Pill (chip)
Rounded 999px, 1px border, `--card` fill, `--muted` text, `0.9rem`. Hover: text to `--fg`, border to `--accent-blue`, lift 2px.

### Buttons
Pill-shaped, `0.8rem 1.5rem`, weight 600. Hover lifts 2px.

- **Primary** (`.btn.primary`, `.plink.primary`): `--grad` fill and Ink `#0a0e13` text in both themes, plus the depth recipe (`--btn-depth`) so it reads as a button, not a flat chip:
  ```css
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.35),   /* top highlight */
              inset 0 -1px 0 rgba(0,0,0,0.25);        /* bottom edge */
  ```
  On hover, add `--shadow-2` (blue glow). No more than three depth effects on one element.
- **Secondary:** a glass pill (`--card` fill, `--border`).

### Link row
Full-width glass row: bold label, muted value, `--accent-blue` arrow. On hover, slides 6px right with a faint blue wash (`rgba(165,197,226,0.07)`).

### Timeline
A 1px vertical hairline with an `--accent-blue` dot per entry (`9px`, ringed by the background color and a blue glow). Each entry: `--accent-pink` uppercase date, serif title, `--accent-blue` organization line, muted description capped at `40rem`.

### Portrait
Arch-shaped frame (`border-radius: 999px 999px 1.4rem 1.4rem`, `aspect-ratio: 4/5`) with a 0.5rem gradient border (blue to pink, `linear-gradient(160deg, rgba(165,197,226,0.7), rgba(255,255,255,0.04) 45%, rgba(227,183,195,0.5))`) and a soft blue glow beneath. On light, the middle stop uses `rgba(21,24,29,0.04)`. The photo inside is `object-fit: cover` with `object-position: 50% 28%` so the face stays framed, plus a faint inner highlight and bottom shade. A serif name and uppercase subtitle sit beneath as a caption. Serve responsive sizes with `<picture>` and `srcset` (480, 800, 1200 wide), set `width` and `height`, and use `fetchpriority="high"` for a hero image. Write real alt text that describes the person and setting.

### Collection components
The Papers & Projects collection adds these components. All use the same tokens.

- **Item card:** a glass card with a 16:10 media area on top (thumbnail, or a blue-and-pink placeholder with the first letter of the title in Fraunces), a "Project" or "Paper" chip over the image, the tag and AI-assisted badge, a serif title, and pill links. "View item" is always the primary pill.
- **Filter pills:** pill buttons with a count. The active pill is solid `--wm-blue` with Ink text.
- **Item page:** breadcrumb, label row, a large light serif title, the lead paragraph, and buttons (the first link is the gradient primary button). Below: a carousel or a single framed image, the Markdown body with a sticky sidebar (Files, Tags, Collection), the Dublin Core table, and a citation box.
- **Carousel:** a scroll-snap track with round glass arrow buttons and pill dots (the active dot widens and turns `--accent-blue`). Captions sit in a dark glass label at the bottom left.
- **Dublin Core table:** two columns. Uppercase muted labels on the left, values on the right, hairlines between rows. Links in `--accent-blue`.

### Theme toggle
A pill at the end of the header nav: an inline SVG icon (sun or moon) and the name of the theme it switches to ("Light" or "Dark"). It uses `aria-pressed` (true when light is on) and the standard focus ring. It is never icon-only. On phones the nav wraps and the toggle sits on a second row. The button stays `hidden` until `script.js` runs, because it cannot work without JavaScript; without it, the site follows the system setting.

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

Place one deep dusty blue `#4a6f94` top-left, one deep dusty pink `#9a5d73` bottom-right (opacity about `0.32`), and one smaller indigo `#3b4a9e` mid-page (opacity about `0.2`). Stagger the durations (24s, 30s, 36s) and delays so they never sync. On the light theme, halve every blob's opacity.

**Spotlight:** a fixed radial gradient (`520px`, `rgba(255,255,255,0.07)` on dark, `rgba(10,14,19,0.05)` on light) that follows the cursor via `--mx` and `--my`. Keep it subtle: it should read as a faint sheen, not a flashlight.

---

## 7. Motion

| Effect | Spec |
| --- | --- |
| Scroll reveal | Fade and rise `28px` over `0.8s`; trigger with `IntersectionObserver` at `threshold 0.15`; stagger by `(index % 4) * 90ms` |
| Hover lift | `translateY(-2px)`, `0.2s` |
| Card tilt | Up to `8deg` on `rotateX/rotateY` with `perspective(900px)`, `0.15s ease-out`, resets on leave |
| Portrait parallax | Up to `5px` shift following the cursor |
| Header mark handoff | As the page scrolls, the header wordmark moves and scales in proportion from the hero mark's position to the header. Colors and shape never change |
| Rotating word | Fade and drop `0.4em` over `0.35s`, change every `2.6s` |
| Scroll hint | `8px` bob over `2s` |

Never animate the wordmark's colors or gradient. There is no shimmer.

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

- [ ] Background `#0a0e13`, text `#f3f1ec`, blue and pink accents from tokens, no retired colors
- [ ] Fraunces for headings, Inter for body, no third font
- [ ] No emoji or Unicode arrows; icons are inline SVG
- [ ] No gradient text; the name is the SVG wordmark
- [ ] Both themes checked, and the pastels are never text on light
- [ ] Every animation disabled under `prefers-reduced-motion`
- [ ] Images have `width`, `height`, `alt`, and responsive `srcset` where large
- [ ] Layout has no horizontal scroll at 375px
- [ ] Muted text still meets AA contrast

---

## 10. Wordmark

The mark is "bri." in outlined Fraunces letters with a blue-to-pink gradient and a separate period. It is artwork, not text: never set it from the font.

**Files** (in `images/`)

| File | Use |
| --- | --- |
| `bri-wordmark.svg` | Primary. Dark backgrounds. Gradient letters, Wordmark White period |
| `bri-wordmark-light.svg` | Light backgrounds. Same letters, Ink period |
| `bri-wordmark-mono.svg` | One color (`currentColor`). Favicons, footers, one-ink print, or any surface where the gradient cannot show. Off-white on dark, Ink on light |
| `favicon.svg`, `apple-touch-icon.png` | The mono "b." on an Ink tile. Used in both themes |

On the site, `_includes/wordmark.html` places the primary mark inline. Its period takes `--wm-period`, so the one include gives the primary variant on dark and the light variant on light. Pass a unique `id` for each use on a page.

**Where it appears:** the header (once, `1.35rem` tall) and the hero (once per page, `clamp(3.5rem, 12vw, 7.5rem)` tall). Everywhere else, write the name as text.

**Clear space:** keep a margin on every side at least as wide as the period (about one fifth of the mark's height). Nothing sits inside it.

**Minimum height:** 20 px on screen for the color versions, 14 px for mono. Below that, use the "b." favicon form.

**Do not:**

- Re-type the mark in Fraunces or any other font.
- Change the gradient's colors, direction, or stops, or apply it to some letters only.
- Give the period the gradient, or color the letters flat while the period stays colored (that is the mono version).
- Add a stroke, shadow, glow, bevel, or other effect to the mark. Ambient light may sit behind it, never on it.
- Rotate, skew, or stretch it. Scale it in proportion only.
- Put it on a busy image without a dark or light scrim.
- Attach a surname, capital letter, or tagline to it.
- Animate its colors or gradient.

**Accessibility**

- Inline marks are `aria-hidden="true"` when the surrounding element carries the label. The header link uses `aria-label="Brianna Imm, home"`; the hero heading uses `aria-label="Brianna Imm"`.
- As an `<img>`, use `alt="bri."`, or `alt="Brianna Imm, home"` when it links home.
- On light backgrounds the pastel letters are decorative contrast only. The name must also appear as live text on the page (the portrait caption does this on the home page).

---

## 11. Known loose ends

- Google Fonts is loaded from a third party. For stricter privacy, self-host the two families.
- Media wells (thumbnails, carousel, PDF preview) stay dark in both themes because they frame screenshots.
- The dark `--text-soft` value `#d6d2e4` has a slight violet cast left over from the earlier palette. A warmer neutral such as `#d9d6cf` would match the rest.
