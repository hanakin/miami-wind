# AGENTS

Repo-level instructions for AI coding agents on the Miami Wind baseline stack. This file is the
source of truth. A closer nested `AGENTS.md` overrides parts of it. Companion files (`CLAUDE.md`,
`GEMINI.md`, `AGENT.md`, `.github/copilot-instructions.md`) are thin pointers to this file — never put
real content in them.

## Stack

Default for new projects, assumed present unless a nested `AGENTS.md` documents an exception:

- Runtime / package manager: **Bun**
- Build: **Vite** · Language: **TypeScript (strict)** · Format + lint: **Biome** (tabs)
- UI: **Tailwind CSS v4** + **shadcn/ui**, themed with **Miami Wind** (preset `b43wwIBBY` lineage)
- Icons: **`@iconify/react`** via the `Icon` component (iconify strings or custom SVGs; 20px default)
- Routing: **TanStack Router** (file-based) · Server state: **TanStack Query**
- Client state: **Zustand** · Validation: **Zod** · Forms: **React Hook Form** (+ Zod resolver)
- Backend: **Hono** in `/server` (Hono RPC for end-to-end types)
- Auth: provider integration in `/auth` — Clerk or WorkOS by default (hosted); better-auth is the
  self-hosted fallback (its handler mounts in `/server`). Not in the baseline deps — it's a
  scaffold-time choice; install the chosen provider's packages then.
- Tests: **Vitest** in a global `/test` folder

## Commands

Source of truth for setup, validation, completion. Prefer package scripts over ad hoc commands.

- Install: `bun install`
- Dev: `bun run dev` — runs Vite (web) and Hono (api) together. Vite serves the app on `:5173` and
  proxies `/api/*` to Hono on `:3000`, so the browser only talks to `:5173`. Individually:
  `bun run dev:web` / `bun run dev:api`.
- Build: `bun run build` (frontend). Production: `bun run start` runs Hono, which serves the built
  `dist/` **and** the API on a single port.
- **Completion gate: `bun run check`** (Biome check + typecheck + tests). A task isn't complete until
  this passes for the changed area.
- Iterating: `bun run fmt` (format + safe fixes), `bun run lint`, `bun run typecheck`,
  `bun run test` (`test:watch` to iterate).
- Deps: `bun add <pkg>` / `bun add -d <pkg>`.

## Structure

File-based routing makes the route tree (`src/app/`) the structure. **Do not invent feature folders or
domain taxonomies** — they need global judgment and are unreliable to apply. Instead:

- **Recursive ownership.** A thing lives with its *nearest single owner* — a route **or** a component.
  Used by one owner → colocate with it as a `-`-prefixed file/folder (the router ignores `-`). Used by
  two+ → promote.
- **Components have two tiers.** One consumer → `src/components/`; two+ consumers → `src/app/components/`.
- **Logic has a single shared home.** `utils/`, `hooks/`, `stores/` promote to `src/<kind>/` only —
  there is **no** `app/utils`, `app/hooks`, or `app/stores`.
- **Dependency direction is one-way:** routes → shared. Never shared → routes, never route → route.

```
src/
  main.tsx              Vite-only mount (createRoot → RouterProvider). Next omits this.
  app/                  the route tree + the shell
    __root.tsx          THE SHELL — providers + root layout (= Next's app/layout.tsx)
    index.tsx …         file-based routes
    -<local>            route-local colocation (`-` = router-ignored)
    components/         composites shared by 2+ routes
  components/           composites used by exactly 1 route
    ui/                 primitives (shadcn + scratch-built MW) — kept VANILLA
      cva/              the MW variant layer (button.ts, …), linked by mw-cva (below)
  utils/                shared non-React logic/helpers + api.ts (the typed RPC client)
  hooks/                shared React hooks (2+ consumers)
  stores/               shared client state (2+ consumers)
  styles/globals.css    @import "tailwindcss" + the MW theme tokens
  env.ts                zod-validated env (single file)
server/                 Hono backend (Bun). Exports AppType for RPC. Serves dist/ + API in production.
auth/                   provider integration: client.ts (provider SDK) + server.ts (middleware Hono mounts).
test/                   Vitest. Mirrors src/ and server/ so a file's test is mechanically locatable.
```

End-to-end types: `src/utils/api.ts` imports `type AppType` from `server/` and calls `hc<AppType>()`.
Type-only, erased at build.

**Primitives ↔ cva (mw-cva).** Primitives in `components/ui/` stay **vanilla shadcn** — never hand-edit
them. Their Miami Wind variants live in a **separate** file `components/ui/cva/<name>.ts`. The two never
import each other; the **`mw-cva` Vite plugin** (in `vite.config.ts`, installed at the app root) links
them by filename at load and falls back to the primitive's inline cva when no cva file exists. To restyle
a primitive, edit its `cva/<name>.ts` — not the component.

## Working style

1. **Think before coding.** State assumptions when ambiguous; don't silently pick one interpretation
   among reasonable options. Push back on unnecessary complexity, hidden risk, or contradictions. Ask
   rather than guess when uncertainty would cause rework.
2. **Simplicity first.** The minimum that fully solves the problem. No flexibility, abstraction, config,
   or error handling that wasn't asked for. Prefer existing patterns over new architecture.
3. **Surgical changes.** Touch only what the task needs. Don't refactor adjacent code. Match
   surrounding style. Clean up only the imports/code your own change created.
4. **Goal-driven.** Translate the request into verifiable success criteria first; prove behavior with
   tests, typechecks, linters, or build output.
   ```
   1. Make the smallest change that could work.
   2. Verify with the most direct check available.
   3. Iterate until it passes cleanly.
   ```

## Codebase expectations

- Read existing code before design/architecture decisions. Reuse existing utilities, components, and
  tokens before creating new ones.
- Keep diffs reviewable — each changed line maps to the request. Review is the bottleneck; optimize for it.
- Never hardcode secrets or env-specific credentials. Validate input at boundaries (forms, handlers,
  env) with Zod.
- Document any non-obvious command or constraint here or in the nearest nested `AGENTS.md`.

## Icons

Render through the `Icon` component. Prefer an `mdi:` Iconify name **unless the user specifies another
set for that icon** — a per-icon judgment. Use `type="custom"` only for project SVGs that aren't in
Iconify. Don't hand-roll bare `<svg>` or call `@iconify/react` directly.

## Testing and verification

- Smallest set of checks that credibly verifies the change, then expand.
- Bug fixes: reproduce first when practical, then verify the fix.
- UI work: verify visually — confirm hover, active, focus-visible (background/border shift, **no
  ring**), and disabled states actually render (see `DESIGN.md`).
- If a local server needs a specific port, confirm it belongs to this worktree; stop a stale/foreign
  process and restart on the requested port before handing off the URL.
- If you couldn't run an expected check, say so in the handoff.

## Linked standards

- `DESIGN.md` — visual language and interaction standards.
- `CODING-STANDARDS.md` — implementation and review standards.
Read both before UI or implementation-heavy changes; treat them as extensions of this file.
