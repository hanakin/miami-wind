import { beforeEach, describe, expect, it } from "vitest";
import { exportMarkdown } from "../src/components/review-panel";
import { type ReviewNote, reviewStore } from "../src/stores/review";

const note = (over: Partial<ReviewNote>): ReviewNote => ({
	id: "n0",
	component: "button",
	view: "demo",
	demo: "default",
	piece: "button",
	text: "note",
	x: 0,
	y: 0,
	...over,
});

beforeEach(() => reviewStore.setState({ on: false, notes: [], seq: 0 }));

describe("review store", () => {
	it("addNote stamps a counter id and empty text, bumping seq", () => {
		const { addNote } = reviewStore.getState();
		addNote({ component: "button", view: "demo", demo: "d", piece: "p", x: 1, y: 2 });
		addNote({ component: "tabs", view: "example", demo: "", piece: "", x: 3, y: 4 });
		const { notes, seq } = reviewStore.getState();
		expect(notes.map((n) => n.id)).toEqual(["n0", "n1"]);
		expect(notes[0]?.text).toBe("");
		expect(seq).toBe(2);
	});

	it("setText, remove and clear scope correctly", () => {
		reviewStore.setState({
			notes: [note({ id: "a", component: "button" }), note({ id: "b", component: "tabs" })],
		});
		const s = reviewStore.getState();
		s.setText("a", "hi");
		expect(reviewStore.getState().notes.find((n) => n.id === "a")?.text).toBe("hi");
		s.remove("b");
		expect(reviewStore.getState().notes.map((n) => n.id)).toEqual(["a"]);
		s.clear("button");
		expect(reviewStore.getState().notes).toHaveLength(0);
	});
});

describe("exportMarkdown", () => {
	it("groups by component with view · demo · piece prefixes, '—' for blanks", () => {
		const md = exportMarkdown([
			note({ component: "button", piece: "button-icon", text: "too small" }),
			note({ component: "button", demo: "", piece: "", view: "example", text: "add variant" }),
			note({ component: "tabs", piece: "tab-active", text: "unclear" }),
		]);
		expect(md).toBe(
			"## button\n" +
				"- [demo · default · button-icon] too small\n" +
				"- [example · — · —] add variant\n\n" +
				"## tabs\n" +
				"- [demo · default · tab-active] unclear",
		);
	});

	it("is empty for no notes", () => {
		expect(exportMarkdown([])).toBe("");
	});
});
