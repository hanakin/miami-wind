// @vitest-environment jsdom
import { cleanup, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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

// Each route mounts the full shell (navbar + preview canvas), so these catch shell-level loops too.
describe("routes render without runtime errors", () => {
	it("theme scope (/)", async () => {
		renderApp("/");
		await screen.findByText(/Create token/);
		expectNoCriticalLogs();
	});

	it("component with cva (/components/button)", async () => {
		renderApp("/components/button");
		await screen.findByText(/Manage variants/);
		expectNoCriticalLogs();
	});

	it("component non-cva (/components/input)", async () => {
		renderApp("/components/input");
		// Non-cva primitives edit via the slot inspector (no cva "Manage variants"); the "Editing"
		// picker is present and, for a single-element primitive, offers its one slot.
		await screen.findByText(/Editing/i);
		expectNoCriticalLogs();
	});

	it("custom primitive (/components/icon)", async () => {
		renderApp("/components/icon");
		await screen.findByText(/Source/);
		expectNoCriticalLogs();
	});
});
