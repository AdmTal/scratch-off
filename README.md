# Scratch-Off

The open source repo for [scratchy-lotto.com](https://scratchy-lotto.com).

Drop a script tag on any page. Boom — it's a lottery ticket now.

Users scratch to reveal your content. It's dumb and delightful.

## What you get

- Looks like a real scratch ticket (silver, shiny, the whole thing)
- Works on phones and desktop
- Makes scratchy sounds
- Little paint flakes fall off as you scratch
- Auto-reveals at ~60% scratched
- Zero dependencies

## Install

Script tag. Done.

```html
<script src="https://scratchy-lotto.com/scratch-off.iife.js"></script>
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
5. 60% scratched = overlay fades

## Dev stuff

```bash
npm install        # setup
npm run dev        # dev server
npm run build      # build it
```

Outputs to `dist/` in a few formats (ES, UMD, IIFE).

## Browser support

Modern browsers. You're fine.

## Publishing to NPM

Releases are automated via GitHub Actions. To publish a new version:

1. Go to the GitHub repo → Releases → "Create a new release"
2. Create a new tag like `v1.0.1` (the `v` prefix is required)
3. Click "Publish release"

That's it. GitHub Actions will build and publish to NPM automatically.

### First-time setup

Add your NPM token as a GitHub secret:

1. Get an NPM access token from [npmjs.com](https://www.npmjs.com/settings/~/tokens) (use "Automation" type)
2. Go to repo Settings → Secrets and variables → Actions
3. Add a new secret named `NPM_TOKEN` with your token

## License

MIT

## Contributing

Pull requests are welcome! If you have any ideas to improve this project, feel free to open an issue or submit a PR.
