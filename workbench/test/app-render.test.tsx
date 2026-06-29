// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { previews } from "~/components/previews";
import { TooltipProvider } from "~/components/ui/tooltip";
import { mockApi, renderApp } from "./harness";

// React throws "Maximum update depth exceeded" on infinite loops and "Cannot read properties of
// null" on a duplicate React. We also fail on the warnings React logs *before* it escalates, so
// unstable store selectors are caught even when they don't reach the throw.
const CRITICAL =
	/Maximum update depth|Cannot read properties of null|getSnapshot should be cached|Rendered (more|fewer) hooks|Should have a queue/;

let logged: string[];

beforeEach(() => {
	mockApi();
	logged = [];
	vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
		logged.push(args.map(String).join(" "));
	});
});

afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

function expectNoCriticalLogs() {
	expect(logged.filter((m) => CRITICAL.test(m))).toEqual([]);
}

// Each route mounts the full shell (Toolbar + Sidebar), so these catch shell-level loops/crashes too.
describe("routes render without runtime errors", () => {
	it("theme editor (/theme)", async () => {
		renderApp("/theme");
		await screen.findByText(/Live preview/);
		expectNoCriticalLogs();
	});

	it("detail with cva (/components/button)", async () => {
		renderApp("/components/button");
		await screen.findByText(/Target/);
		expectNoCriticalLogs();
	});

	it("detail preview-only (/components/input)", async () => {
		renderApp("/components/input");
		await screen.findByText(/preview only/i);
		expectNoCriticalLogs();
	});

	it("detail custom primitive (/components/icon)", async () => {
		renderApp("/components/icon");
		await screen.findByText(/preview only/i);
		expectNoCriticalLogs();
	});
});

// Every wall preview, rendered in isolation — fast and pinpoints exactly which primitive breaks.
describe("every preview renders without throwing", () => {
	for (const name of Object.keys(previews)) {
		it(name, () => {
			expect(() => render(<TooltipProvider>{previews[name]?.()}</TooltipProvider>)).not.toThrow();
			expectNoCriticalLogs();
		});
	}
});
