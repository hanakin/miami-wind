import { beforeEach, describe, expect, it } from "vitest";
import type { CvaModel } from "../server/lib/cva-codec";
import { isDirty, workbenchStore } from "../src/stores/workbench";

const model = (over?: Partial<CvaModel>): CvaModel => ({
	name: "button",
	localName: "button",
	exportName: "buttonVariants",
	base: "inline-flex",
	variants: { size: { sm: "h-8" } },
	defaultVariants: {},
	compoundVariants: [],
	...over,
});

beforeEach(() => {
	workbenchStore.setState({ seeds: {}, saved: {}, models: {} });
});

describe("workbench store", () => {
	it("registerSeed seeds working + saved when absent and is not dirty", () => {
		workbenchStore.getState().registerSeed("buttonVariants", model());
		const s = workbenchStore.getState();
		expect(s.models.buttonVariants?.base).toBe("inline-flex");
		expect(s.saved.buttonVariants?.base).toBe("inline-flex");
		expect(isDirty(s, "buttonVariants")).toBe(false);
	});

	it("registerSeed is idempotent and never clobbers an edit", () => {
		const s = workbenchStore.getState();
		s.registerSeed("buttonVariants", model());
		s.setModel("buttonVariants", model({ base: "edited" }));
		s.registerSeed("buttonVariants", model());
		expect(workbenchStore.getState().models.buttonVariants?.base).toBe("edited");
	});

	it("loadOverrides makes the registry override the baseline, keeping the seed", () => {
		const s = workbenchStore.getState();
		s.registerSeed("buttonVariants", model());
		s.loadOverrides([model({ base: "mw-override" })]);
		const st = workbenchStore.getState();
		expect(st.models.buttonVariants?.base).toBe("mw-override");
		expect(st.seeds.buttonVariants?.base).toBe("inline-flex");
		expect(isDirty(st, "buttonVariants")).toBe(false);
	});

	it("setModel marks dirty, revert restores, markSaved rebaselines", () => {
		const s = workbenchStore.getState();
		s.registerSeed("buttonVariants", model());
		s.setModel("buttonVariants", model({ base: "x" }));
		expect(isDirty(workbenchStore.getState(), "buttonVariants")).toBe(true);

		s.revert("buttonVariants");
		expect(workbenchStore.getState().models.buttonVariants?.base).toBe("inline-flex");
		expect(isDirty(workbenchStore.getState(), "buttonVariants")).toBe(false);

		s.setModel("buttonVariants", model({ base: "y" }));
		s.markSaved("buttonVariants");
		const st = workbenchStore.getState();
		expect(st.saved.buttonVariants?.base).toBe("y");
		expect(isDirty(st, "buttonVariants")).toBe(false);
	});
});
