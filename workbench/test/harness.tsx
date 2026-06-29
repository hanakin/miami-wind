import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryHistory, createRouter, RouterProvider } from "@tanstack/react-router";
import { render } from "@testing-library/react";
import { vi } from "vitest";
import { routeTree } from "~/routeTree.gen";

// Canned API so the real hooks/queries resolve in jsdom without a backend.
const BUTTON_MODEL = {
	name: "button",
	localName: "button",
	exportName: "buttonVariants",
	base: "inline-flex items-center justify-center",
	variants: {
		variant: { default: "bg-primary text-primary-foreground", secondary: "bg-secondary" },
		size: { default: "h-9 px-4", sm: "h-8 px-3" },
	},
	defaultVariants: { variant: "default", size: "default" },
	compoundVariants: [],
};

const THEME_TOKENS = [
	{ name: "--color-pink", value: "#f472b6", layer: "theme" },
	{ name: "--color-primary", value: "var(--color-pink)", layer: "theme" },
	{ name: "--background", value: "var(--color-crust)", layer: "dark" },
];

export function mockApi() {
	const json = (data: unknown) =>
		new Response(JSON.stringify(data), { headers: { "content-type": "application/json" } });
	vi.stubGlobal(
		"fetch",
		vi.fn((input: RequestInfo | URL) => {
			const u =
				typeof input === "string"
					? input
					: input instanceof URL
						? input.href
						: (input as Request).url;
			if (u.includes("/api/cva"))
				return Promise.resolve(json({ models: [BUTTON_MODEL], errors: [] }));
			if (u.includes("/api/primitives"))
				return Promise.resolve(json({ custom: ["icon"], cvas: ["button"] }));
			if (u.includes("/api/theme")) return Promise.resolve(json({ tokens: THEME_TOKENS }));
			if (u.includes("/api/tailwind/classes"))
				return Promise.resolve(
					json({ classes: ["bg-pink", "bg-surface", "flex", "p-2", "rounded-md"] }),
				);
			return Promise.resolve(json({ ok: true }));
		}),
	);
}

export function renderApp(path: string) {
	const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
	const router = createRouter({
		routeTree,
		context: { queryClient },
		history: createMemoryHistory({ initialEntries: [path] }),
	});
	return render(
		<QueryClientProvider client={queryClient}>
			<RouterProvider router={router} />
		</QueryClientProvider>,
	);
}
