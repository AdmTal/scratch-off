# Scratch-Off

Drop a script tag on any page. Boom — it's a lottery ticket now.

Users scratch to reveal your content. It's dumb and delightful.

## What you get

- Looks like a real scratch ticket (silver, shiny, the whole thing)
- Works on phones and desktop
- Makes scratchy sounds
- Little paint flakes fall off as you scratch
- Auto-reveals at ~90% scratched
- Zero dependencies

## Install

Script tag. Done.

```html
<script src="https://your-netlify-site.netlify.app/scratch-off.iife.js"></script>
```

Or npm if that's your thing:

```bash
npm install scratch-off
```

```javascript
import 'scratch-off';
```

That's it. It auto-runs.

## How it works

1. Scans your page
2. Throws a scratch layer on top
3. User scratches
4. Particles fall
5. 90% scratched = overlay fades

## Dev stuff

```bash
npm install        # setup
npm run dev        # dev server
npm run build      # build it
```

Outputs to `dist/` in a few formats (ES, UMD, IIFE).

## Browser support

Modern browsers. You're fine.

## License

MIT

## History

Built with AI. See [prompt_history.md](./prompt_history.md) if you're curious.
