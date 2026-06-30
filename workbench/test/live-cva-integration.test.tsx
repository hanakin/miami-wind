// @vitest-environment jsdom
import { cleanup, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { workbenchStore } from "~/stores/workbench";
import { setTargetClass } from "~/utils/cva-edit";
import { mockApi, renderApp } from "./harness";

beforeEach(() => mockApi());
afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

// The core of the live-edit fix: changing the working model repaints a scoped stylesheet with real
// CSS, so a value Tailwind never compiled (fractional opacity) shows instantly.
it("editing a model live-repaints the scoped <style> with resolved CSS", async () => {
	renderApp("/components/button");
	await waitFor(() => expect(workbenchStore.getState().models.buttonVariants).toBeTruthy());
	await waitFor(() => expect(document.getElementById("live-cva")).toBeTruthy());

	const s = workbenchStore.getState();
	const model = s.models.buttonVariants;
	if (!model) throw new Error("button model not loaded");
	const edited = setTargetClass(
		model,
		{ kind: "option", axis: "variant", option: "default" },
		"bg-pink/40",
	);
	s.setModel("buttonVariants", edited);

	await waitFor(() =>
		expect(document.getElementById("live-cva")?.textContent).toContain(
			"color-mix(in oklab, var(--color-pink, var(--pink)) 40%, transparent)",
		),
	);
	// scoped to the preview canvas + targeted by data attributes, never the workbench chrome
	expect(document.getElementById("live-cva")?.textContent).toContain(
		'[data-preview] [data-slot="button"][data-variant="default"]',
	);
});
