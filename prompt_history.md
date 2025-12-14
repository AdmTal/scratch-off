# Prompt History

This document contains the prompts used to create this project with AI assistance. It is maintained for transparency about how this project was developed.

---

## Prompt 1

**Date:** 2024-12-14

**Prompt:**

> Ok, I've set up a new empty repo for you.
>
> I want you to make me a JavaScript library that users can include in their sites, and it will turn their site Into a scratch off lotto ticket.
>
> Basically… the experience is, from the users perspective. The site loads, but all of the elements and text are hidden by a layer of "paint" that can be scratched off with their finger on mobile, or mouse clicks and drags on desktop.
>
> When the entire paint section is like, idk, 90% scratched off, it just fades away, leaving the normal site in place.
>
> So to make this work… visually, it should look like scratch off lottery paint, if you know what I mean, texture wise.
>
> And it's not all one color, it should be a super simple Dumbed down shapes only version of the site that is being covered.
>
> And it's not scrollable, it's just whatever is in view when the page loads and is ready.
>
> And for example, for sample markup like:
>
> ```html
> <h1>My blog</h1>
> <p>welcome To my blog</p>
> ```
>
> The site with the scratch off library would look like, for example (bare with me for crude text)
>
> ```
> ///////////////////////
> / -h1—————-/
> ———————
> / - p —————-/
> //////////////////////
> ```
>
> Get it?
>
> And to install this, basically you'd just need to add script tag like `<script src="tbd" />`
>
> And maybe it makes a little scratching noise as you scratch.
>
> And the flakes should crumble off and drift down naturally in a cool animated way.
>
> —-
>
> The script for now will be hosted in Netlify, so add a Netlify TOML file.
>
> Add a readme for the project, as this is a public repository.
>
> Also, and this is important, I want to be open and transparent about the prompts I used with you to make this. So for every prompt I give you, you should append the prompt to a prompt_history.md file in the root.
>
> use Vite and typescript.

**Result:** Created the initial project structure with:
- Vite + TypeScript configuration
- Core scratch-off library with canvas overlay
- Element detection and shape rendering
- Mouse and touch scratch mechanics
- Lottery ticket texture with noise and metallic effects
- Falling particle animations for paint flakes
- Scratch sound effects using Web Audio API
- 90% threshold auto-fade feature
- Demo HTML page
- Netlify configuration
- README documentation

---
