import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";

// Review mode: read-only annotation over the live preview. A note is anchored to the element's real
// data-slot/data-demo (resolved at click time by the overlay) plus the click point (x/y in preview
// content coords) so the numbered pin can be drawn back. This tool never mutates a component/demo/cva.
export type ReviewNote = {
	id: string; // stable id from a persisted counter (no Date.now/Math.random)
	component: string; // route param of the component under review
	view: "demo" | "example"; // top demo strip vs the bottom focus section
	demo: string; // nearest [data-demo], "" if none
	piece: string; // nearest [data-slot], "" if the element has none
	text: string;
	x: number; // pin position within the preview, content coords
	y: number;
};

interface ReviewState {
	on: boolean;
	notes: ReviewNote[];
	seq: number;
	toggle: () => void;
	addNote: (n: Omit<ReviewNote, "id" | "text">) => void;
	setText: (id: string, text: string) => void;
	remove: (id: string) => void;
	clear: (component: string) => void;
}

const KEY = "mw-review";
type Persisted = { notes: ReviewNote[]; seq: number };

// Persist notes + the id counter so annotations survive reloads during a review session. `on` stays
// in-memory (a session toggle, not a saved preference).
function load(): Persisted {
	try {
		const raw = localStorage.getItem(KEY);
		if (raw) return JSON.parse(raw) as Persisted;
	} catch {
		// ponytail: corrupt/blocked storage → start empty, don't crash the workbench.
	}
	return { notes: [], seq: 0 };
}

export const reviewStore = createStore<ReviewState>((set) => {
	const init = load();
	return {
		on: false,
		notes: init.notes,
		seq: init.seq,
		toggle: () => set((s) => ({ on: !s.on })),
		addNote: (n) =>
			set((s) => ({ notes: [...s.notes, { ...n, id: `n${s.seq}`, text: "" }], seq: s.seq + 1 })),
		setText: (id, text) =>
			set((s) => ({ notes: s.notes.map((x) => (x.id === id ? { ...x, text } : x)) })),
		remove: (id) => set((s) => ({ notes: s.notes.filter((x) => x.id !== id) })),
		clear: (component) => set((s) => ({ notes: s.notes.filter((x) => x.component !== component) })),
	};
});

reviewStore.subscribe((s) => {
	try {
		localStorage.setItem(KEY, JSON.stringify({ notes: s.notes, seq: s.seq }));
	} catch {
		// ponytail: storage full/blocked → in-memory only for this session.
	}
});

export function useReview<T>(selector: (s: ReviewState) => T): T {
	return useStore(reviewStore, selector);
}
