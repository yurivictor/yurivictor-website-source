# yurivictor personal website

Personal homepage. Horizontal-scrolling single-page layout.

In-progress work: migrating to Vite so the Apple section can use a React-based
3D lanyard component. Details live in `ROADMAP.md`, which is gitignored — it
exists only in the maintainer's working copy, so it will be absent from a fresh
clone.

## Build & Dev

```bash
npm start          # watch SCSS + Vite dev server (root: src/)
npm run build      # full production build → dist/
```

Build pipeline order: `build:scss` → `build:autoprefixer` → `build:css-lint` → `build:css-minify` → `build:js` → `build:copy-assets` → `build:copy-html`

- SCSS compiled with `sass`
- CSS post-processed with `autoprefixer` then minified via `cssnano` + `css-minify`
- JS bundled and minified with Vite (`vite.config.mjs`) — two entries,
  `js/main.js` (vanilla) and `js/lanyard.js` (React island)
- Assets (fonts) copied from `src/assets/` to `dist/assets/`

### Deploy

`.github/workflows/deploy.yml` runs `npm ci && npm run build` on push to `main`
and publishes `./dist` to the `yurivictor/yurivictor.github.io` repo. Build
changes need no CI changes as long as `npm run build` still emits `dist/`.

### dist/ is committed, and partly hand-maintained

`dist/` is checked into git. Two things in it are **not** produced by any build
step and exist only because the build never cleans the directory:

- `dist/CNAME` — the custom domain
- `dist/images/` — every image on the site

Never empty `dist/`. This is why `vite.config.mjs` sets `emptyOutDir: false`,
and why new images must be copied into `dist/images/` by hand.

### Vite scope

Vite bundles **JS** and serves **dev** (root `src/`, so `/css`, `/images` and
`/assets` resolve the same way they do in production). It does not touch
`index.html` or the SCSS pipeline:

- `index.html` is copied verbatim by `build:copy-html`
- Fonts are referenced from SCSS as absolute paths (`url('/assets/...')`),
  which Vite would try to resolve at build time if it owned the CSS

Output is ES modules (two entries need to share chunks), so both scripts are
`type="module"` in `index.html`. `main.js` has no imports of its own and still
reads `THREE` off the global set by the CDN tag — module scope doesn't change
that, and deferred execution still beats `DOMContentLoaded`.

The config is `.mjs` because `package.json` has no `"type": "module"`.

### The Apple section is a React island

`#apple-lanyard` in `index.html` is mounted by `src/js/lanyard.js` with a
vendored copy of the React Bits Lanyard. Everything else on the page stays
vanilla and `main.js` knows nothing about it.

- `src/js/lanyard.js` is deliberately JSX-free (uses `createElement`) so the
  file stays `.js` and `index.html` can reference `/js/lanyard.js` unchanged in
  both dev and prod.
- `src/js/lanyard/Lanyard.jsx` is vendored, not a dependency. Its deviations
  from upstream are listed in a comment at the top of the file.
- `card.glb`, `lanyard.png` and `apple_badge-cutout.png` live in `src/images/`
  and are referenced by URL, so they follow the hand-maintained `dist/images/`
  flow rather than being hashed into a chunk.
- The component's CSS was ported to `src/scss/components/_lanyard.scss`.
- **Touch handling.** The page navigates horizontally off document-level touch
  handlers in `App`. `lanyard.js` swallows touch gestures that actually grab
  the card, but lets gestures on the empty canvas through so the section
  doesn't become a dead zone on mobile.

**Payload.** `dist/js/lanyard.js` is ~3.5MB raw / ~1.2MB gzip, of which ~2.1MB
is Rapier's base64-inlined wasm, plus a 2.4MB `card.glb`. See `ROADMAP.md`.

## Project Structure

```
src/
  index.html
  assets/          # fonts (woff/woff2) — PP Neue Montreal & PP Pangaia
  css/             # compiled CSS (generated, do not edit)
  js/
    main.js          # vanilla: SunOrb, NightSky, App (scroll/layout)
    lanyard.js       # React island entry for the Apple section
    lanyard/
      Lanyard.jsx    # vendored from reactbits.dev, see header comment
  scss/
    main.scss      # entry point, imports everything
    _variables.scss
    components/
      _lanyard.scss
    base/
      _fonts.scss      # @font-face declarations
      _reset.scss      # box-sizing, body, a defaults
      _typography.scss # h1–h3, p, strong rules
    layout/
      _sizes.scss
    pages/
      _header.scss
      _portfolio.scss
      _quote.scss
      _about.scss
      _elsewhere.scss
      _footer.scss
dist/              # production output — committed; see caveat above
vite.config.mjs
ROADMAP.md
```

## Fonts

Two typefaces, both from Pangram Pangram. Files live in `src/assets/` and are copied to `dist/assets/` on build.

| SCSS variable          | Font family name          | File                        |
|------------------------|---------------------------|-----------------------------|
| `$font-serif`          | `pp_pangaialight`         | `PPPangaia-Light.woff2`     |
| `$font-sans-serif`     | `pp_neue_montrealregular` | `PPNeueMontreal-Regular.woff2` |
| `$font-sans-serif-bold`| `pp_neue_montrealbold`    | `PPNeueMontreal-Bold.woff2` |

Font feature settings applied globally on `body`:
```css
font-feature-settings: "dlig" 1, "liga" 1;
font-variant-ligatures: discretionary-ligatures;
```

## Key SCSS Variables (`_variables.scss`)

- Colors: `$color-default`, `$color-text-grey`, `$color-border-grey`, `$color-beige`, `$color-brown`, `$color-green`, `$color-orange`
- Fonts: `$font-serif`, `$font-sans-serif`, `$font-sans-serif-bold`
- Sizes: `$font-small` (14px), `$font-default` (18px), `$font-large` (36px), `$font-xlarge` (42px)
- Spacing: `$space-small` (24px), `$space-default` (48px), `$space-large` (42px)
- Breakpoints: `$width-xsmall` (320px) through `$width-xlarge` (1280px)
