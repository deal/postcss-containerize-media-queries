# `postcss-containerize-media-queries`

A PostCSS plugin that converts standard media queries to container queries with fallbacks.

## Usage

### Library (ex., @deal/bluxome) usage

- Installation:

  ```bash
  yarn add @deal/postcss-containerize-media-queries --dev
  ```

- Add the plugin to `postcss.config.js`:

  ```js
  module.exports = {
    plugins: [
      // other plugins...
      require('@deal/postcss-containerize-media-queries')(),
    ],
  }
  ```

### Web app (ex., consumer-app) usage

- Inherits from [@deal/web-build-tools](https://github.com/deal/web-build-tools) v24.0.1+

  ```bash
  yarn add @deal/web-build-tools@^24.0.1
  ```

- **MUST** include the following style rule:

  `src/app/containers/App/styles.css`:

  ```css
  :root {
    container-type: inline-size;
  }
  ```

- Descendants of [ResponsiveBreakpointOverrideContainer](https://github.com/deal/consumer-app/blob/master/src/app/containers/ResponsiveBreakpointOverrideContainer/index.tsx) component (or any `container-type: inline-size;` element) will respond to container's inline size (width) instead of viewport's:

  ```tsx
  return (
    <ResponsiveBreakpointOverrideContainer id="mobile-pdp-container" style={{ maxWidth: 768 }}>
      <ProductPage sellable={sellable} />
    </ResponsiveBreakpointOverrideContainer>
  )
  ```

## Example

`input.css`:

```css
.mobile-only-box {
  display: flex;
}

@media bluxomeMediaMd {
  .mobile-only-box {
    display: none;
  }
}
```

`output.css`:

```css
.mobile-only-box {
  display: flex;
}

@supports not (contain: inline-size) {
  @media (min-width: 768px) {
    .mobile-only-box {
      display: none;
    }
  }
}

@container (min-width: 768px) {
  .mobile-only-box {
    display: none;
  }
}
```
