# CODING-STANDARDS

Implementation and review standards. Extends `AGENTS.md`. A nested `AGENTS.md` wins on conflict.

## General principles

- Clean, readable, maintainable. Straightforward over clever.
- One responsibility per function/module/component. Meaningful names. Self-documenting code; comment
  only when the reason isn't obvious.
- Early returns and guard clauses over deep nesting.
- Match the repo's existing style before introducing a new pattern.
- **Tabs for indentation, always.**

## TypeScript

- Strict mode. Explicit types over `any`; `unknown` when a value must be narrowed safely.
- `interface` for stable object shapes; `type` for unions, mapped types, utility composition.
- `const` over `let` unless reassignment is required. `?.` / `??` intentionally, not reflexively.
- Model invalid states out of the type system. Validate external input with **Zod** at the boundary,
  then trust the inferred type inward.
- For discriminated unions, narrow on the discriminant before reading variant-specific fields — don't
  destructure the shared field up front, or TS widens it back to the union (see the `Icon` component).

## Structure and organization

- Routing is **TanStack Router, file-based**, rooted at `src/app/`. A page lives at the path matching
  its URL — never hand-place pages by domain. The shell (providers + root layout) is `app/__root.tsx`.
- **Recursive ownership:** a thing lives with its nearest single owner — a route *or* a component. One
  owner → colocate as a `-`-prefixed file (router-ignored); two+ → promote.
- **Components two-tier:** one consumer → `src/components/`; two+ → `src/app/components/`.
- **Logic single home:** `utils/`, `hooks/`, `stores/` promote to `src/<kind>/` only — no `app/` version.
- Dependencies flow one way: routes → shared. No cross-route imports, no shared → route imports.
- `components/ui` holds the primitives (kept vanilla); their variants are separate files in
  `components/ui/cva/`. `components/` holds shared composites. Non-React logic goes in `utils/`.

## State and data

- **Server state → TanStack Query.** Don't mirror server data into Zustand. Keys are explicit, colocated
  with the route or `src/utils/api.ts`.
- **Client state → Zustand**, only when genuinely shared across routes. Default to local `useState`.
- **Data access → Hono RPC.** The typed client (`hc<AppType>`) lives in `src/utils/api.ts`. Components
  call typed functions/queries; transport stays out of components.
- **Forms → React Hook Form + `zodResolver`.** One Zod schema is the source of truth for validation and
  the inferred form type.

## UI and components

- Functional components, props typed explicitly. Start from the Miami Wind primitives before building a
  new one. Primitives stay **vanilla**; variant/theme changes go in the primitive's **separate** cva file
  (`components/ui/cva/<name>.ts`, linked by the `mw-cva` plugin) — never in the component, never per-call
  `className`s.
- Use Miami Wind accents only for brand/semantic roles (primary, secondary, destructive, links, syntax),
  referencing theme tokens / Tailwind `--color-*` vars. Neutrals come from theme tokens — don't hardcode
  greys or hex.
- Handle loading, empty, error, and success states intentionally.
- Interaction states are required: pointer cursor on clickables, visible hover, distinct active/selected,
  and `focus-visible` shown via a background/border shift. **No `ring-*` or `outline` focus styling** —
  see `DESIGN.md`.
- Icons go through the `Icon` component (iconify string or `type="custom"` SVG). Custom SVGs use
  `currentColor`. Don't hand-roll `<svg>` or call `@iconify/react` directly.

## Auth

- `auth/` is the provider integration boundary, not an auth server. `client.ts` = provider SDK,
  `server.ts` = middleware/guards Hono mounts. Self-hosted (better-auth) adds a handler in
  `server/routes/auth`. The provider is a scaffold-time choice; don't assume one in shared code.

## Error handling

- Handle errors at the correct boundary; surface meaningful messages without leaking internals.
- Async work has explicit loading / success / failure paths.
- Validate and normalize inbound data (forms, handlers, env, webhooks) before use.
- Retries/transactions/idempotency explicit only where the workflow needs them.

## Performance

- Avoid unnecessary renders, recomputation, fetching. Memoize deliberately. Lazy-load large route
  chunks where it improves UX. Optimize assets/network only where it meaningfully matters.

## Testing

- Vitest in the global `test/` folder mirroring `src/` and `server/` (`src/utils/foo.ts` →
  `test/utils/foo.test.ts`).
- Test critical paths and bug fixes, not just happy paths. Unit-test logic that breaks independently of
  the UI. Behavior-describing names. Mock external deps when isolation helps. Few trustworthy tests over
  many brittle ones.

## Security

- Validate all user-controlled input. Authorization at real trust boundaries (server), not only UI.
- Never expose secrets in client code or logs. Sanitize before DB writes, shell, or HTML rendering.
  Least-privilege, secure-by-default.

## Build and tooling

- Use the repo's Bun scripts; `bun run check` is the completion gate. Biome owns format + lint (tabs).
  Don't add ESLint/Prettier.

## Review heuristics

- Every changed line traces back to the request or a necessary verification step.
- New abstractions must earn their existence. If code got more configurable, ask whether that was
  required. If a simpler implementation solves the same problem, prefer it.
