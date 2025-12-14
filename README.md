# Scratch-Off

Turn any website into a scratch-off lottery ticket experience! This JavaScript library creates an interactive scratch-off layer over your webpage that visitors can scratch away to reveal the content underneath.

## Features

- **Realistic lottery ticket texture** - Authentic silver scratch-off appearance with subtle noise and metallic sheen
- **Smart element detection** - Automatically detects page elements and creates simplified shape representations
- **Touch & mouse support** - Works seamlessly on both desktop and mobile devices
- **Satisfying scratch sounds** - Audio feedback when scratching (uses Web Audio API)
- **Falling particle effects** - Paint flakes crumble and drift down naturally
- **Auto-reveal** - Fades away automatically when ~90% is scratched off
- **Zero dependencies** - Pure TypeScript/JavaScript, no external libraries required

## Installation

### Via Script Tag (Recommended)

Just add a single script tag to your HTML page:

```html
<script src="https://your-netlify-site.netlify.app/scratch-off.iife.js"></script>
```

The library will automatically initialize and create the scratch-off layer over your page.

### Via NPM

```bash
npm install scratch-off
```

Then import in your JavaScript:

```javascript
import 'scratch-off';
```

Or if you want more control:

```javascript
import { ScratchOff } from 'scratch-off';
const scratcher = new ScratchOff();
```

## How It Works

1. When the page loads, the library scans visible elements in the viewport
2. Creates a canvas overlay with a silver scratch-off texture
3. Draws simplified shapes representing each detected element (headers, paragraphs, images, etc.)
4. Users can scratch with mouse drag or touch gestures
5. Paint particles fall off realistically as you scratch
6. When 90% is scratched, the overlay fades away revealing the full page

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+
- Mobile Safari (iOS 11+)
- Chrome for Android

## Development

### Setup

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

This will output the library in multiple formats to the `dist/` folder:
- `scratch-off.js` - ES Module
- `scratch-off.umd.cjs` - UMD format
- `scratch-off.iife.js` - Immediately Invoked Function Expression (for script tags)

## Customization

Currently the library auto-initializes with default settings. Future versions may include configuration options for:

- Custom scratch radius
- Threshold percentage for auto-reveal
- Custom colors and textures
- Sound enable/disable
- Particle effects toggle

## Technical Details

- Built with TypeScript
- Uses HTML5 Canvas for rendering
- Web Audio API for scratch sounds
- RequestAnimationFrame for smooth particle animations
- Composite operations for efficient scratch reveal

## License

MIT

## Prompt History

This project was created with AI assistance. See [prompt_history.md](./prompt_history.md) for the full conversation history and prompts used during development.
