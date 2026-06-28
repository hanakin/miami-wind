# Miami Wind Color Theme
A Color scheme which is a blend of colors from [Tailwind CSS](https://tailwindcss.com/docs/colors) and Greyscale colors from [Catppuccin Mocha](https://catppuccin.com/) inspired by the theme [Miami Nights](https://github.com/monkeytypegame/monkeytype/blob/master/frontend/static/themes/miami_nights.css) for [Monkeytype](https://www.monkeytype.com).

## Color Palette

## Base Colors (Primary Colors)
### Spec

- Pink `#F472B6`: Primary ui elements and accents, CODE: keywords, highlight, importance
- Cyan `#22D3EE`: Secondary ui elements and accents, main accent color
- Yellow `#FEF08A`: neutral, CODE: strings, italic
- Purple `#C084FC`: CODE: headings
- Blue `#818CF8`: CODE: comments, header alt, hr
- Green `#34D399`: CODE: code, functions
- Red `#F87171`: CODE: error
- Orange `#FDBA74`: CODE: markup, values, bold

## Additional Colors (Bright Colors)
### Spec
Primarily used as hover states for base colors except Cyan, which has more uses...
- Pink `#EC4899`:
- Cyan `#38BDF8`: Links, CODE: variables, properties
- Yellow `#FDE047`: warning
- Purple `#A78BFA`:
- Blue `#2563EB`: info
- Green `#4ADE80`: success, good,
- Red `#F43F5E`: error, bad, fail,
- Orange `#FB923C`:

## Greyscale

The `grey-50 … grey-1300` ramp (light → dark). Full data in `pallette.json`.

- `grey-50`   `#cdd6f4`
- `grey-100`  `#bac2de`
- `grey-200`  `#a6adc8`
- `grey-300`  `#9399b2`
- `grey-400`  `#7f849c`
- `grey-500`  `#6c7086`
- `grey-600`  `#585b70`
- `grey-700`  `#45475a`
- `grey-800`  `#313244`
- `grey-900`  `#1e1e2e`
- `grey-1000` `#181825`
- `grey-1100` `#11111b`
- `grey-1200` `#0d0d14`
- `grey-1300` `#09090b`

---

## Projects using it
- [VSCode/Cursor](https://github.com/hanakin/miami-wind-vscode)
- [Obsidian](https://github.com/hanakin/miami-wind-obsidian-theme)
- [Omarchy](https://github.com/hanakin/omarchy-miami-wind-theme)

## Registry (shadcn)

This repo is also a **shadcn source registry**. Beyond the palette above, it distributes — via
`bunx shadcn add @miami-wind/*` — everything that makes an app a "Miami Wind" app, and is the single
source of truth for it.

It ships **only what shadcn doesn't already give you**:

1. **Conventions** — `AGENTS.md`, `DESIGN.md`, `CODING-STANDARDS.md` (+ thin Claude/Gemini/Copilot
   pointers), installed to the project root.
2. **Theme** — the dark-only Miami Wind token set (layered CSS variables; see `DESIGN.md`). Built on the
   greyscale + the Tailwind accents above.
3. **CVAs** — one variant file per shadcn primitive you customize (`cva/button.ts`, …).
4. **Custom primitives** — components shadcn lacks (e.g. `icon`).
5. **The `mw-cva` plugin** — links a vanilla shadcn component to its separate cva by filename, with
   inline fallback. Required for the cva layer.

It does **not** duplicate shadcn's component source or `cn`.

### Use it

```sh
bunx shadcn@latest add @miami-wind/registry   # conventions + theme + mw-cva + icon + button cva
```

Add the vanilla shadcn components separately (e.g. `bunx shadcn@latest add button`); the `@miami-wind`
cva customizes them, wired by `mw-cva` in your `vite.config.ts`:

```ts
import { mwCva } from "./mw-cva";
export default defineConfig({ plugins: [mwCva(), react()] });
```

The theme is **authored** in `registry.json` (dark-only, layered); `pallette.json` is the canonical
palette reference (and feeds the editor-theme repos) — it does not generate the theme.

### Develop

```sh
bun install
bun run check     # biome + typecheck
```
