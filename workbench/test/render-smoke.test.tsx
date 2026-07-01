// @vitest-environment jsdom
import { Icon } from "@registry-ui/icon";
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { EditorPreview } from "~/components/editor-layout";
import { OpenRender, openRenders } from "~/components/open-renders";
import { type PreviewRender, previews } from "~/components/previews";
import { TooltipProvider } from "~/components/ui/tooltip";
import type { CvaModel } from "../server/lib/cva-codec";

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

// The preview filters to the selected variant and renders each interaction state as a static tile.
describe("EditorPreview", () => {
	const model: CvaModel = {
		name: "button",
		localName: "button",
		exportName: "buttonVariants",
		base: "inline-flex",
		variants: { variant: { default: "bg-primary", link: "bg-transparent hover:underline" } },
		defaultVariants: { variant: "default" },
		compoundVariants: [],
	};

	it("filters to the selected variant and renders a static tile per state", () => {
		const { getByText, container } = render(
			<TooltipProvider>
				<div data-preview>
					<EditorPreview
						name="button"
						model={model}
						sel={{ type: "cva", target: { kind: "option", axis: "variant", option: "link" } }}
					/>
				</div>
			</TooltipProvider>,
		);
		// Live row reflects the chosen variant, not "all variants".
		expect(getByText("live — variant · link")).toBeTruthy();
		// One inert (non-interactive) tile per interaction state — Base/Hover/Focus/Active/Disabled.
		expect(container.querySelectorAll("[inert]").length).toBe(5);
		expect(getByText("Hover")).toBeTruthy();
		expect(getByText("Disabled")).toBeTruthy();
	});
});
