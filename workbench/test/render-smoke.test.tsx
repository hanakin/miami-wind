// @vitest-environment jsdom

import { Icon } from "@registry-ui/icon";
import { cleanup, render, screen } from "@testing-library/react";
import type { ComponentType } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { DemoScene } from "~/components/demo-scene";
import { TooltipProvider } from "~/components/ui/tooltip";

afterEach(cleanup);

// Guards against a duplicate React instance: the registry's icon.tsx resolves react/iconify from
// outside this package, so without resolve.dedupe it pulls a second React and hooks crash with
// "Cannot read properties of null (reading 'useState')". Rendering it here exercises that path.
describe("render smoke", () => {
	it("renders the registry Icon (custom primitive) without a hook-dispatcher crash", () => {
		expect(() => render(<Icon icon="mdi:home" size={24} />)).not.toThrow();
	});
});

// Every demo file the scene globs must mount without throwing — the mechanical gate for the rollout.
// Mirrors demo-scene.tsx's glob, so dropping a new demo/<component>/<file>.tsx auto-covers it here.
const demoFiles = import.meta.glob("../src/components/demo/*/*.tsx", { eager: true });
describe("every demo mounts", () => {
	for (const [path, mod] of Object.entries(demoFiles)) {
		const m = path.match(/\/demo\/([^/]+)\/([^/]+)\.tsx$/);
		if (!m) continue;
		const Component = Object.values(mod as Record<string, unknown>).find(
			(v): v is ComponentType => typeof v === "function",
		);
		it(`${m[1]}/${m[2]}`, () => {
			expect(Component).toBeDefined();
			expect(() => {
				const { unmount } = render(
					<TooltipProvider>
						<div data-preview>{Component ? <Component /> : null}</div>
					</TooltipProvider>,
				);
				unmount();
			}).not.toThrow();
		});
	}
});

// Every examples/ override must mount without throwing (force-open portal renders). Dedupe by component
// identity so the per-slot re-export files don't re-mount the same force-open render N times.
const overrideFiles = import.meta.glob("../src/components/examples/*/*.tsx", { eager: true });
describe("every override mounts", () => {
	const seen = new Set<unknown>();
	for (const [path, mod] of Object.entries(overrideFiles)) {
		const Component = Object.values(mod as Record<string, unknown>).find(
			(v): v is ComponentType => typeof v === "function",
		);
		if (!Component || seen.has(Component)) continue;
		seen.add(Component);
		const m = path.match(/\/examples\/([^/]+)\/([^/]+)\.tsx$/);
		it(`${m?.[1] ?? ""}/${m?.[2] ?? path}`, () => {
			expect(() => {
				const { unmount } = render(
					<TooltipProvider>
						<div data-preview>
							<Component />
						</div>
					</TooltipProvider>,
				);
				unmount();
			}).not.toThrow();
		});
	}
});

// A portal override force-opens its hidden surface in-scope (the examples/ path that replaced the legacy
// exploded-surfaces test): the dropdown-menu content + item slots must land inside [data-preview].
describe("portal override exposes hidden slots", () => {
	it("dropdown-menu content + item render in [data-preview]", () => {
		const mod = overrideFiles["../src/components/examples/dropdown-menu/_open.tsx"];
		const Open = Object.values((mod ?? {}) as Record<string, unknown>).find(
			(v): v is ComponentType => typeof v === "function",
		);
		expect(Open).toBeDefined();
		const { container } = render(
			<TooltipProvider>
				<div data-preview>{Open ? <Open /> : null}</div>
			</TooltipProvider>,
		);
		const slots = [...container.querySelectorAll("[data-preview] [data-slot]")].map((e) =>
			e.getAttribute("data-slot"),
		);
		expect(slots).toContain("dropdown-menu-content");
		expect(slots).toContain("dropdown-menu-item");
	});
});

// The demo scene globs each component's demos (no registration) and derives the focused filter: a slot
// extracts its single default instance; a variant/context resolves the whole demo that represents it.
describe("DemoScene", () => {
	it("renders the item demos and extracts a selected slot", () => {
		const { container } = render(
			<TooltipProvider>
				<DemoScene name="item" sel={{ type: "slot", slot: "item-title" }} />
			</TooltipProvider>,
		);
		// Demos rendered from the glob (each wrapped in [data-demo]).
		expect(container.querySelectorAll("[data-demo]").length).toBeGreaterThan(0);
		// The slot resolved to a single default instance, not the empty state.
		expect(screen.queryByText(/Not present/)).toBeNull();
		expect(screen.getByText(/^from /)).toBeTruthy();
		expect(container.querySelectorAll("[data-slot='item-title']").length).toBeGreaterThan(0);
	});

	it("resolves a variant filter to a demo that represents it", () => {
		const { container } = render(
			<TooltipProvider>
				<DemoScene
					name="item"
					sel={{ type: "cva", target: { kind: "option", axis: "variant", option: "outline" } }}
				/>
			</TooltipProvider>,
		);
		expect(screen.getByText("variant · outline")).toBeTruthy();
		expect(
			container.querySelectorAll("[data-slot='item'][data-variant='outline']").length,
		).toBeGreaterThan(0);
	});
});
