// @vitest-environment jsdom
import { Icon } from "@registry-ui/icon";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { DemoScene } from "~/components/demo-scene";
import { OpenRender, openRenders } from "~/components/open-renders";
import { type PreviewRender, previews } from "~/components/previews";
import { TooltipProvider } from "~/components/ui/tooltip";

afterEach(cleanup);

// Mounts a preview's output as a real component so React runs its full lifecycle (effects, context).
// __root.tsx wraps the whole app in TooltipProvider, so the canvas always has it — mirror that here.
function Mount({ render: render_ }: { render: PreviewRender }) {
	return <TooltipProvider>{render_({})}</TooltipProvider>;
}

// Guards against a duplicate React instance: the registry's icon.tsx resolves react/iconify from
// outside this package, so without resolve.dedupe it pulls a second React and hooks crash with
// "Cannot read properties of null (reading 'useState')". Rendering it here exercises that path.
describe("render smoke", () => {
	it("renders the registry Icon (custom primitive) without a hook-dispatcher crash", () => {
		expect(() => render(<Icon icon="mdi:home" size={24} />)).not.toThrow();
	});
});

// Previews are invoked as plain functions, so this catches missing providers, invalid-hook usage,
// and bad props for every entry — the single source of truth for the picker and the live preview.
describe("every preview mounts", () => {
	for (const [name, render_] of Object.entries(previews)) {
		it(name, () => {
			expect(() => {
				const { unmount } = render(<Mount render={render_} />);
				unmount();
			}).not.toThrow();
		});
	}
});

// The exploded render must redirect portal surfaces into [data-preview] (not document.body), so the
// inspector can target them and live-css can paint them. Proves the dropdown's hidden menu + item
// render in-scope with their data-slots — the foundation of editing hidden surfaces.
describe("exploded surfaces render in-scope", () => {
	// Each case redirects a portal-backed primitive into [data-preview] and asserts its content slot
	// (the surface the inspector targets) lands there with at least one inner sub-part.
	const cases: Array<[name: string, contentSlot: string, innerSlot: string]> = [
		["dropdown-menu", "dropdown-menu-content", "dropdown-menu-item"],
		["select", "select-content", "select-item"],
		["popover", "popover-content", "popover-trigger"],
		["dialog", "dialog-content", "dialog-title"],
		["drawer", "drawer-content", "drawer-title"],
	];
	for (const [name, contentSlot, innerSlot] of cases) {
		it(`${name} exposes its content + sub-part slots inside [data-preview]`, () => {
			const { container } = render(
				<TooltipProvider>
					<div data-preview>
						<OpenRender name={name} />
					</div>
				</TooltipProvider>,
			);
			const slots = [...container.querySelectorAll("[data-preview] [data-slot]")].map((e) =>
				e.getAttribute("data-slot"),
			);
			expect(slots).toContain(contentSlot);
			expect(slots).toContain(innerSlot);
		});
	}

	// Every exploded render must mount cleanly — catches missing primitive context (e.g. a sub-part
	// rendered outside its required Group/Provider) for the whole set, not just the asserted few.
	for (const name of Object.keys(openRenders)) {
		it(`${name} mounts without throwing`, () => {
			expect(() => {
				const { unmount } = render(
					<TooltipProvider>
						<div data-preview>
							<OpenRender name={name} />
						</div>
					</TooltipProvider>,
				);
				unmount();
			}).not.toThrow();
		});
	}
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
