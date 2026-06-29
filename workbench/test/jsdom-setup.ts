import { vi } from "vitest";

// jsdom lacks several browser APIs that Radix/sonner call during render (matchMedia, ResizeObserver,
// pointer capture, scrollIntoView). The real browser has them; polyfill no-ops so the render tests
// can exercise the actual components. Guarded so node-environment tests are unaffected.
if (typeof window !== "undefined") {
	const w = window as unknown as Record<string, unknown>;

	w.matchMedia ??= (query: string) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: vi.fn(),
		removeListener: vi.fn(),
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn(),
	});

	class Observer {
		observe() {}
		unobserve() {}
		disconnect() {}
		takeRecords() {
			return [];
		}
	}
	w.ResizeObserver ??= Observer;
	w.IntersectionObserver ??= Observer;

	const proto = Element.prototype as unknown as Record<string, unknown>;
	proto.scrollIntoView = vi.fn();
	proto.hasPointerCapture = vi.fn(() => false);
	proto.setPointerCapture = vi.fn();
	proto.releasePointerCapture = vi.fn();
}
