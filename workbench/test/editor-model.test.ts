import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { readComponentModel } from "../server/lib/component-model";
import { WORKBENCH_ROOT } from "../server/lib/registry-paths";
import {
	baselineModel,
	dirtyDiff,
	editorModelStore,
	workingModel,
} from "../src/stores/editor-model";

const UI = join(WORKBENCH_ROOT, "src/components/ui");
const model = (name: string) =>
	readComponentModel(readFileSync(join(UI, `${name}.tsx`), "utf8"), name);

describe("editor-model store — the launch-time pre-bake", () => {
	beforeEach(() => {
		editorModelStore.getState().loadModels([model("item"), model("dropdown-menu")]);
	});

	it("holds a baseline + working copy for every scanned component", () => {
		const s = editorModelStore.getState();
		expect(Object.keys(s.baseline)).toEqual(expect.arrayContaining(["item", "dropdown-menu"]));
		expect(Object.keys(s.working)).toEqual(expect.arrayContaining(["item", "dropdown-menu"]));
	});

	it("baseline matches the Stage-1 categorization (item root; dropdown content+trigger)", () => {
		expect(baselineModel("item")?.root).toBe("item");
		expect(baselineModel("dropdown-menu")?.root).toBe("dropdown-menu-content");
		expect(baselineModel("dropdown-menu")?.trigger).toBe("dropdown-menu-trigger");
	});

	it("nothing is dirty until an edit; setStateClasses dirties exactly one piece × interaction", () => {
		expect(dirtyDiff("dropdown-menu")).toEqual([]);
		editorModelStore
			.getState()
			.setStateClasses("dropdown-menu", "dropdown-menu-item", "focus", "focus:bg-primary");
		expect(dirtyDiff("dropdown-menu")).toEqual([
			{ piece: "dropdown-menu-item", interaction: "focus" },
		]);
	});

	it("working is a deep clone — editing it never mutates baseline", () => {
		editorModelStore.getState().setStateClasses("item", "item", "default", "bg-red-500");
		expect(workingModel("item")?.classesByPieceState.item?.default).toBe("bg-red-500");
		expect(baselineModel("item")?.classesByPieceState.item?.default).not.toBe("bg-red-500");
	});
});
