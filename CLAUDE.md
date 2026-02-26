# yurivictor personal website

Personal homepage. Horizontal-scrolling single-page layout.

## Build & Dev

```bash
npm start          # watch SCSS + live-server (src/)
npm run build      # full production build → dist/
```

Build pipeline order: `build:scss` → `build:autoprefixer` → `build:css-lint` → `build:css-minify` → `build:js-minify` → `build:copy-assets` → `build:copy-html`

- SCSS compiled with `sass`
- CSS post-processed with `autoprefixer` then minified via `cssnano` + `css-minify`
- JS minified with `uglify-js`
- Assets (fonts) copied from `src/assets/` to `dist/assets/`

## Project Structure

```
src/
  index.html
  assets/          # fonts (woff/woff2) — PP Neue Montreal & PP Pangaia
  css/             # compiled CSS (generated, do not edit)
  js/
    main.js
  scss/
    main.scss      # entry point, imports everything
    _variables.scss
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
dist/              # production output (generated)
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
